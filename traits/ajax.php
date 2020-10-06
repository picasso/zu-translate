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

	private function ajax_config() {

		$this->nonce = $this->config['nonce'] ?? $this->prefix.'_ajax_nonce';

		$this->routes = [
			// make action via ajax call
			'action'		=> [
				'methods' 		=> WP_REST_Server::CREATABLE,
				'callback'		=> 'do_ajax',
				'args'			=> [
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

		// collect data for REST API
		switch($key) {
			case 'zukit_more_info':
				$result = $this->create_notice('data', null, $this->info());
				break;

			case 'clear_log':
				$result = $this->ajax_empty_log();
				break;

			case 'reset_options':
				$result = $this->ajax_reset_options();
				break;

			case 'test_ajax':
				$result = $this->ajax_test();
				break;

			default:
				$result = $this->ajax_more($key, $value);
				if($result === null) $result = $this->ajax_addons($key, $value);
		}

		// if $result is empty - something went wrong - then return empty object
		if(empty($result)) return rest_ensure_response($this->ajax_error !== false ? $this->ajax_error : (object) null);

		return rest_ensure_response($result);
	}

	public function get_option_ajax($request) {

		$params =  $request->get_params();

		$key = $params['key'];
		$value = $this->get_option($key, null);

		// if $result is null - something went wrong - then return null
		return rest_ensure_response($value === null ? (object) null : $value);
	}

	public function set_options_ajax($request) {

		$params =  $request->get_params();

		$keys = $params['keys'];
		$values = $params['values'];
		if(!is_array($values)) $values = array_fill_keys($keys, $values);

		$result = true;

		foreach($keys as $key) {
			// 'null' will be ignored
			$return = $this->set_option($key, $values[$key] ?? null);
			if($return === false) $result = false;
		}
		// if $result is false - something went wrong - then return null
		return rest_ensure_response($result || (object) null);
	}

	// Ajax Actions Helpers ---------------------------------------------------]

	public function create_notice($status, $message, $data = []) {
		return [
			'status'	=> $status,
			'content'	=> $message ?? 'Unknown',
			'data'		=> $data,
		];
	}
}
