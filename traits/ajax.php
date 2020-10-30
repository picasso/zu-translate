<?php

// Plugin Ajax Trait ----------------------------------------------------------]
//
// const READABLE = 'GET'
// const CREATABLE = 'POST'
// const EDITABLE = 'POST, PUT, PATCH'
// const DELETABLE = 'DELETE'

trait zukit_Ajax {

	private $api_prefix	= 'zukit';
	private $api_version = 1;
	private $routes = [];
	private $nonce;
	private $ajax_error;

	private static $rest_registered = false;

	private function ajax_config() {

		$this->nonce = $this->config['nonce'] ?? $this->prefix.'_ajax_nonce';

		$this->routes = [
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
						'sanitize_callback' => 'sanitize_key',
					],
				],
				'permission'	=> 'edit_posts',
			],
			// set options for requested 'keys'
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

		];

		add_action('rest_api_init' , [$this, 'init_api']);
	}

	public function init_api() {
		// prevent 'register_rest_route' be called many times from different plugins
		if(self::$rest_registered) return;

		foreach($this->routes as $route => $params) {

			$namespace = sprintf('%1$s/v%2$s',
				$this->api_prefix,
				$this->api_version
			);
			$endpoint = sprintf('/%1$s', $route);

			register_rest_route($namespace, $endpoint, [
  		    	'methods'				=> $params['methods'],
  		    	'callback'				=> [$this, $params['callback']],
				'args'					=> $params['args'],
				'permission_callback' 	=> function() use($params) {
                    return empty($params['permission']) ? true : current_user_can($params['permission']);
                },
			]);
		}

		self::$rest_registered = true;
	}

	// Sanitize helpers -------------------------------------------------------]

	public function sanitize_ids($ids) {
		$cleaned_ids = [];

		if(is_numeric($ids)) return [$ids];

		if(is_array($ids)) {
			foreach($ids as $id) {
				$cleaned_ids[] = absint($id);
			}
		}
		return $cleaned_ids;
	}

	public function sanitize_keys($keys) {

		if(is_string($keys)) return [sanitize_key($keys)];

		$cleaned_keys = [];
		if(is_array($keys)) {
			foreach($keys as $key) {
				$cleaned_keys[] = sanitize_key($key);
			}
		}
		return $cleaned_keys;
	}

	// Lowercase alphanumeric characters, dot and underscores are allowed.
	public function sanitize_path($path) {
	    $path = strtolower($path);
	    $path = preg_replace('/[^a-z0-9_.]/', '', $path);
    	return $path;
	}

	public function sanitize_paths($paths) {

		if(is_string($paths)) return [$this->sanitize_path($paths)];

		$cleaned_paths = [];
		if(is_array($paths)) {
			foreach($paths as $path) {
				$cleaned_paths[] = $this->sanitize_path($path);
			}
		}
		return $cleaned_paths;
	}

	public function floatval($value) {
		return filter_var($value, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
	}

	// Basics -----------------------------------------------------------------]

	public function timestamp() {
		return intval(current_time('timestamp'));
	}

	public function ajax_error($error, $params = null) {
		if(is_null($error)) $this->ajax_error = false;
		else {
			$this->ajax_error = [
				'status' 	=> false,
				'message'	=> is_string($error) ? $error : $error->get_error_message(),
				'params'	=> $params,
			];
		}
		return false;
	}

	public function ajax_nonce($create = false) {
		return $create ? wp_create_nonce($this->nonce) : $this->nonce;
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

	public function ajax_test() {
		return $this->create_notice('info', sprintf(
			'Plugin <strong>"%2$s"</strong> (%3$s) was available via Ajax on <span>%1$s</span>',
			date('H:i d.m.y',  $this->timestamp()),
			$this->data['Name'],
			$this->version
		));
	}

	public function ajax_empty_log() {
		return $this->create_notice('warning',
			sprintf( 'empty_log is not implemented yet! (Plugin "%1$s")', $this->data['Name'])
		);
	}

	public function ajax_reset_options() {
		$options = $this->reset_options();
		return $this->create_notice('infodata', // combine 'info' with 'data'
			sprintf( 'Plugin <strong>"%1$s"</strong> settings are reset to defaults', $this->data['Name']),
			$options
		);
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

				case 'clear_log':
					$result = $router->ajax_empty_log();
					break;

				case 'reset_options':
					$result = $router->ajax_reset_options();
					break;

				case 'test_ajax':
					$result = $router->ajax_test();
					break;

				default:
					$result = $router->ajax_more($key, $value);
					if($result === null) $result = $router->ajax_addons($key, $value);
			}
		}

		// if $result is empty - something went wrong - then return empty object
		if(empty($result)) return rest_ensure_response($this->ajax_error !== false ? $this->ajax_error : (object) null);

		return rest_ensure_response($result);
	}

	public function get_option_ajax($request) {

		$params =  $request->get_params();
		// instead of $this, should use $router, because it defines the active plugin
		$router = $this->get_router($params);

		$key = $params['key'];
		$value = is_null($router) ? null : $router->get_option($key, null);

		// if $result is null - something went wrong - then return null
		return rest_ensure_response($value === null ? (object) null : $value);
	}

	public function set_options_ajax($request) {

		$params =  $request->get_params();

		$keys = $params['keys'];
		$values = $params['values'];
		if(!is_array($values)) $values = array_fill_keys($keys, $values);

		// instead of $this, should use $router, because it defines the active plugin
		$router = $this->get_router($params);
		$result = true;

		foreach($keys as $key) {
			// with set_option 'null' will be ignored, 'false' considered as failure
			$return = is_null($router) ? false : $router->set_option($key, $values[$key] ?? null);
			if($return === false) $result = false;
		}
		// if $result is false - something went wrong - then return null
		return rest_ensure_response($result || (object) null);
	}

	// Ajax Actions Helpers ---------------------------------------------------]

	// $rest_router serves to identify the plugin that currently uses the REST API,
	// since all plugins inherit the same Zukit_plugin class and identification
	// is required to determine which of the active plugins should respond to ajax requests
	private function get_router($params) {

		$router_slug = $params['router'] ?? '';
		$rest_router = $this->instance_by_slug($router_slug);

		if($rest_router instanceof zukit_Plugin) return $rest_router;
		$this->ajax_error(__('Active router not defined', 'zukit'), $params);
		return null;
	}

	public function create_notice($status, $message, $data = []) {
		return [
			'status'	=> $status,
			'content'	=> $message ?? 'Unknown',
			'data'		=> $data,
		];
	}
}
