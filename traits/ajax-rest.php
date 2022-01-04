<?php

// Plugin Ajax/REST API Trait -------------------------------------------------]
//
// const READABLE = 'GET'
// const CREATABLE = 'POST'
// const EDITABLE = 'POST, PUT, PATCH'
// const DELETABLE = 'DELETE'

// for testing REST API
// https://yoursite.com/wp-json/zukit/v1

trait zukit_AjaxREST {

	private $zukit_api_root = 'zukit';
	private $zukit_api_version = 1;
	private $zukit_routes;

	private $api_root;
	private $api_version;
	private $routes;

	private $nonce;
	private $ajax_error;

	private static $doing_rest = null;
	private static $zukit_rest_registered = false;
	private static $sanitize_helpers = ['sanitize_ids', 'sanitize_keys', 'sanitize_path', 'sanitize_paths', 'floatval'];

	protected function api_routes() {}

	private function ajax_config() {

		$this->nonce = $this->get_callable('api.nonce') ?? $this->prefix.'_ajax_nonce';
		$this->api_root = $this->get_callable('api.root') ?? $this->prefix;
		$this->api_version = $this->get_callable('api.version') ?? 1;

		$this->zukit_routes = [
			// make action via ajax call
			'action'		=> [
				'methods' 		=> WP_REST_Server::CREATABLE,
				'callback'		=> 'do_ajax',
				'args'			=> [
					'router'		=> [
						'required'			=> true,
						'sanitize_callback' => 'sanitize_key',
					],
					'key'		=> [
						'default'			=> false,
						'sanitize_callback' => 'sanitize_key',
					],
				],
				'permission'	=> 'edit_posts',
			],
			// get option for requested 'key'
			'option'		=> [
				'methods' 		=> WP_REST_Server::READABLE,
				'callback'		=> 'get_option_ajax',
				'args'			=> [
					'router'		=> [
						'required'			=> true,
						'sanitize_callback' => 'sanitize_key',
					],
					'key'		=> [
						'default'			=> false,
						'sanitize_callback' => [$this, 'sanitize_path'],
					],
				],
				'permission'	=> 'edit_posts',
			],
			// set options for requested 'keys'
			// if value for 'key' is 'null' then this option will be deleted
			'options'		=> [
				'methods' 		=> WP_REST_Server::CREATABLE,
				'callback'		=> 'set_options_ajax',
				'args'			=> [
					'router'		=> [
						'required'			=> true,
						'sanitize_callback' => 'sanitize_key',
					],
					'keys'		=> [
						'default'			=> [],
						'sanitize_callback' => [$this, 'sanitize_paths'],
					],
					'values'	=> [
						'default'			=> [],
						// 'sanitize_callback' => 'sanitize_key',
					],
				],
				'permission'	=> 'edit_posts',
			],
			// get some data by key
			'zudata'		=> [
				'methods' 		=> WP_REST_Server::READABLE,
				'callback'		=> 'get_zudata',
				'args'			=> [
					'key'		=> [
						'default'			=> false,
						'sanitize_callback' => 'sanitize_key',
					],
				],
				'permission'	=> 'edit_posts',
			],
			// get custom data by 'key'
			'cuget'		=> [
				'methods' 		=> WP_REST_Server::READABLE,
				'callback'		=> 'get_custom',
				'args'			=> [
					'key'		=> [
						'default'			=> false,
						'sanitize_callback' => 'sanitize_key',
					],
				],
				'permission'	=> 'edit_posts',
			],
			// set custom data for requested 'key'
			// if value for 'key' is 'null' then this data will be deleted
			'cuset'		=> [
				'methods' 		=> WP_REST_Server::CREATABLE,
				'callback'		=> 'set_custom',
				'args'			=> [
					'key'		=> [
						'default'			=> false,
						'sanitize_callback' => 'sanitize_key',
					],
					'keys'		=> [
						'default'			=> [],
						'sanitize_callback' => [$this, 'sanitize_paths'],
					],
					'values'	=> [
						'default'			=> [],
						// 'sanitize_callback' => 'sanitize_key',
					],
				],
				'permission'	=> 'edit_posts',
			],

		];

		$this->routes = $this->api_routes() ?? [];

		add_action('rest_api_init', [$this, 'init_zukit_api']);
		add_action('rest_api_init', [$this, 'init_api']);
	}
	public function rest_action() {
		$this->logd('rest_action', '!');
	}

	public function init_zukit_api() {
		// prevent 'register_rest_route' for Zukit be called many times from different plugins
		if(self::$zukit_rest_registered) return;
		$this->init_routes($this->zukit_routes, $this->zukit_api_root, $this->zukit_api_version);
		self::$zukit_rest_registered = true;
		self::$doing_rest = true;
	}

	public function init_api() {
		$this->init_routes($this->routes, $this->api_root, $this->api_version);
	}

	// 'REST_REQUEST' is only available after the 'rest_api_init' action
	public function doing_rest() {
		// trying to determine that this is a 'REST_REQUEST' before 'rest_api_init' action
		// by analyzing 'REQUEST_URI'. Not sure if this is a reliable method,
		// but I haven't come up with anything better yet...
		if(self::$doing_rest === null) {
			$uri = $_SERVER['REQUEST_URI'] ?? '';
			$prefix = rest_get_url_prefix();
			if(substr($uri, 0, strlen($prefix) + 2) === sprintf('/%s/', $prefix)) {
				self::$doing_rest = true;
			}
		}
		return self::$doing_rest;
	}

	private function init_routes($routes, $api_root, $api_version) {

		$namespace = sprintf('%1$s/v%2$s', $api_root, $api_version);
		foreach($routes as $route => $params) {

			$endpoint = sprintf('/%1$s', $route);

			register_rest_route($namespace, $endpoint, [
  		    	'methods'				=> $params['methods'],
  		    	'callback'				=> [$this, $params['callback']],
				'args'					=> $this->maybe_fix_sanitize($params['args']),
				'permission_callback' 	=> function() use($params) {
                    return empty($params['permission']) ? true : current_user_can($params['permission']);
                },
			]);
		}
	}

	public function api_basics() {
		return [
			'rest'	=> [
				'router'	=> $this->get_router_name(),
				'root'		=> $this->api_root,
				'version'	=> $this->api_version,
			],
		];
	}

	// Sanitize helpers -------------------------------------------------------]

	public function sanitize_ids($ids) {
		if(is_scalar($ids)) $ids = wp_parse_list($ids);
		return !is_array($ids) ? [] : array_filter(array_unique(array_map('absint', $ids)));
	}

	public function sanitize_keys($keys) {
		if(is_scalar($keys)) $keys = wp_parse_list($keys);
		return !is_array($keys) ? [] : array_filter(array_unique(array_map('sanitize_key', $keys)));
	}

	// lowercase keys 'maybe' separated with dots.
	public function sanitize_path($path) {
	    $path = strtolower($path);
		$path = array_filter(array_map('sanitize_key', explode('.', $path)));
		return implode('.', $path);
	}

	public function sanitize_paths($paths) {
		if(is_scalar($paths)) $paths = wp_parse_list($paths);
		return !is_array($paths) ? [] : array_filter(array_unique(array_map([$this, 'sanitize_path'], $paths)));
	}

	public function floatval($value) {
		return filter_var($value, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
	}

	private function maybe_fix_sanitize($args) {
		foreach($args as $key => $value) {
			if($value['sanitize_callback'] ?? false) {
				$callback = $value['sanitize_callback'];
				if(is_string($callback) && in_array($callback, self::$sanitize_helpers)) {
					$args[$key]['sanitize_callback'] = [$this, $callback];
				}
			}
		}
		return $args;
	}

	// Basics -----------------------------------------------------------------]

	public function timestamp() {
		return intval(current_time('timestamp'));
	}

	// if '$as_bold' is string then this string will be emphasized in the message with the <strong> tag
	public function ajax_error($error, $params = null, $as_bold = null) {
		if(is_null($error)) $this->ajax_error = false;
		else {
			$message = is_string($error) ? $error : $error->get_error_message();
			if(!empty($as_bold)) {
				$message = preg_replace('/('.$as_bold.')/m', '<strong>$1</strong>', $message);
			}
			$this->ajax_error = [
				'status' 	=> false,
				'message'	=> $message,
				'params'	=> $params,
			];
		}
		return false;
	}

	public function ajax_nonce($create = false, $action = null) {
		$action = empty($action) ? $this->nonce : $action;
		return $create ? wp_create_nonce($action) : $action;
	}

	// Generic Ajax Actions ---------------------------------------------------]

	public function ajax_send($result) {
		if($this->ajax_error !== false) {
			$this->ajax_error['more'] = $result ?? null;
			wp_send_json_success($this->ajax_error);
		} else {
			wp_send_json_success($result);
		}
	}

	public function ajax_reset_options() {
		$options = $this->reset_options();
		return $this->create_notice('infodata', // combine 'info' with 'data'
			sprintf('Plugin "**%1$s**" settings are reset to defaults', $this->data['Name']),
			$options
		);
	}

	public function ajax_default_options() {
		$options = $this->initial_options();
		return $this->create_notice('data', null, $options);
	}

	public function ajax_more($action, $value) { return null; }

	// API Requests -----------------------------------------------------------]

	public function do_ajax($request) {

		$params =  $request->get_params();

		$key = $params['key'] ?? '';
		$value = $params['value'] ?? null;
		$result = null;

		// instead of $this, should use $router, because it defines the active plugin
		$router = $this->get_router($params);

		// collect data for REST API
		if(!is_null($router)) {
			switch($key) {
				case 'zukit_more_info':
					$result = $router->create_notice('data', null, $router->info());
					break;

				case 'reset_options':
					$result = $router->ajax_reset_options();
					break;

				case 'default_options':
					$result = $router->ajax_default_options();
					break;

				// default debug actions
				case 'clear_log':
					$result = $router->debug_empty_log();
					break;

				case 'test_ajax':
					$result = $router->debug_ajax_test();
					break;

				default:
					$result = $router->ajax_more($key, $value);
					if($result === null) $result = $router->ajax_addons($key, $value);
			}
		}

		// if $result is empty - something went wrong - then return empty object
		if(empty($result)) return $this->rest_response($this->ajax_error, $this->ajax_error === false);
		// rest_ensure_response($this->ajax_error !== false ? $this->ajax_error : (object) null);

		return $this->rest_response($result);
		// return rest_ensure_response($result);
	}

	public function get_option_ajax($request) {

		$params =  $request->get_params();
		// instead of $this, should use $router, because it defines the active plugin
		$router = $this->get_router($params);

		$key = $params['key'];
		$value = is_null($router) ? null : $router->get_option($key, null);

		// if $result is null - something went wrong - then return null
		return $this->rest_response($value, is_null($value));
		// return rest_ensure_response($value === null ? (object) null : $value);
	}

	public function set_options_ajax($request) {

		$params =  $request->get_params();

		$keys = $params['keys'];
		$values = $params['values'];
		if(!is_array($values)) $values = array_fill_keys($keys, $values);

		// instead of $this, should use $router, because it defines the active plugin
		$router = $this->get_router($params);
		$result = is_null($router) ? false : true;

		if($result) {
			$result = false;
			foreach($keys as $key) {
				// if value for 'key' is 'null' then call 'del_option' instead of 'set_option'
				if(array_key_exists($key, $values) && $values[$key] === null) $return = $router->del_option($key);
				// with set_option 'null' will be ignored, 'false' considered as failure
				else $return = $router->set_option($key, $values[$key] ?? null, true);
				// if at least one call returns 'true', then the overall result will also be 'true'
				$result = $result || $return;
			}
		}
		// if $result is false - something went wrong - then return null
		return $this->rest_response($result, $result === false);
		// return rest_ensure_response($result ?? (object) null);
	}

	protected function extend_zudata($key, $params) {}

	public function get_zudata($request) {

		$params =  $request->get_params();

		$key = $params['key'];
		$result = null;

		// if $router is defined then use it, otherwise use $this
		// because some methods are plugin dependent and some are not
		$request_router = $this->get_router($params, false);
		$router = is_null($request_router) ? $this : $request_router;

		// collect data for REST API
		switch($key) {
			case 'loaders':
				$loader_index = $params['loaderIndex'] ?? null;
				$duration = $params['duration'] ?? 0.8;

				if($loader_index !== null) {
					$result = $this->snippets('loader', -1, $duration);
					$result = array_key_exists($loader_index, $result) ? $result[$loader_index] : (object) null;
				} else {
					$result = [];
					foreach($this->snippets('loader', -1, $duration) as $index => $value) {
						$result[$index] = $value;
					}
				}
				break;

			case 'svg':
				$name = $params['name'] ?? 'logo';
				$folder = $params['folder'] ?? 'images/';
				$result = $this->snippets('insert_svg_from_file', $router->dir, $name, [
		            'preserve_ratio'	=> true,
		            'strip_xml'			=> true,
		            'subdir'			=> $folder,
				]);
				break;

			// process 'zudata' from all loaded plugins/themes
			default:
				foreach($this->instance_by_router() as $plugin_router) {
					$result = $plugin_router->extend_zudata($key, $params) ?? null;
					if(!empty($result)) break;
				}
		}

		// if $result is empty - something went wrong - then return empty object
		return $this->rest_response($result, empty($result));
		// return rest_ensure_response(empty($result) ? (object) null : $result);
	}

	// Custom Data Routes which could be extended -----------------------------]

	protected function get_custom_value($request_id, $params) {}

	public function get_custom($request) {

		$params =  $request->get_params();

		$request_id = $params['key'];
		$result = null;

		foreach($this->instance_by_router() as $plugin_router) {
			$result = $plugin_router->get_custom_value($request_id, $params) ?? null;
			if(!is_null($result)) break;
		}

		// if $result is empty - something went wrong - then return empty object
		return rest_ensure_response(is_null($result) ? (object) null :  $result);
	}

	protected function set_custom_value($request_id, $keys, $values) {}

	public function set_custom($request) {

		$params =  $request->get_params();

		$request_id = $params['key'];
		$keys = $params['keys'];
		$values = $params['values'];
		$result = null;

		foreach($this->instance_by_router() as $plugin_router) {
			$result = $plugin_router->set_custom_value($request_id, $keys, $values) ?? null;
			if(!is_null($result)) break;
		}

		// if $result is empty - something went wrong - then return empty object,
		// otherwise return 'false' or 'true' ('set_option' returns 'false' or 'options')
		return rest_ensure_response(is_null($result) ? (object) null : $result !== false);
	}

	// REST & Ajax Helpers ----------------------------------------------------]

	protected function rest_response($response, $if_failed = false, $params = null) {

		$params = $this->array_with_defaults($params, [
			'as_object'	=> true,
			'as_array'	=> false,
		]);
		extract($params, EXTR_OVERWRITE);

		if($if_failed) {
			return rest_ensure_response($as_object ? (object) null : ($as_array ? [] : null));
		}
		return rest_ensure_response($as_object ? (object) $response : ($as_array ? (array) $response : $response));
	}

	private function reset_ajax_error() {
		$this->ajax_error = false;
	}

	private function get_router_name() {
		return $this->admin_slug();
	}

	// $rest_router serves to identify the plugin that currently uses the REST API,
	// since all plugins inherit the same Zukit_plugin class and identification
	// is required to determine which of the active plugins should respond to ajax requests
	private function get_router($params, $log_errors = true) {

		$this->reset_ajax_error();

		$router = $params['router'] ?? '';
		$rest_router = $this->instance_by_router($router);

		if($rest_router instanceof zukit_Plugin) return $rest_router;

		$message = __('Active router not defined', 'zukit');
		$this->ajax_error($message, $params);

		// also log the error as it is quite severe
		if($log_errors) $this->logc("?$message", $params);

		return null;
	}

	public function get_ajax_error() {
		return $this->ajax_error;
	}

	public function create_notice($status, $message, $data = []) {
		return [
			'status'	=> $status,
			'content'	=> $message ?? 'Unknown',
			'data'		=> $data,
		];
	}
}
