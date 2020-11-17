<?php

// Plugin Addon Class ---------------------------------------------------------]

class zukit_Addon {

	protected $config;
	protected $plugin;
	protected $name;
	protected $options;
	protected $options_key;

	public function register($plugin) {

		$this->plugin = $plugin ?? null;
		if(empty($this->plugin)) {
			_doing_it_wrong(__FUNCTION__, '"Addon" cannot be used without plugin!');
		} else {
			$this->config = $this->config();
			$this->name = $this->config['name'] ?? 'zuaddon';

			$this->options_key = $this->name.'_options';
			$this->init_options();
			$this->construct_more();
		}
	}

	protected function config() { return []; }
	// 'construct_more' вызывается только после регистрации addon плагином!
	protected function construct_more() {}

	public function init() {}
	public function admin_init() {}
	public function enqueue($hook) {}
	public function admin_enqueue($hook) {}
	public function clean() {}
	public function ajax($action, $value) { return null; }

	// Options management -----------------------------------------------------]

	public function init_options() {
		$options = $this->plugin->options();
		if(!isset($options[$this->options_key]) && isset($this->config['options'])) {
			$this->options = $this->config['options'];
			$this->plugin->set_option($this->options_key, $this->options, true);
		} else {
			$this->options($options);
		}
	}

	public function options($options = null) {
		if(!is_null($options)) $this->options = $options[$this->options_key] ?? [];
		return $this->options;
	}

	protected function get_option($key, $default = '') {
		return $this->plugin->get_option($key, $default, $this->options);
	}

	protected function is_option($key, $check_value = true) {
		return $this->plugin->is_option($key, $check_value, $this->options);
	}

	protected function del_option($key) {
		$this->options = $this->plugin->del_option($key, $this->options);
		return $this->plugin->set_option($this->options_key, $this->options, true);
	}

	protected function set_option($key, $value, $rewrite_array = false) {
		$this->options = $this->plugin->set_option($key, $value, $rewrite_array, $this->options);
		return $this->plugin->set_option($this->options_key, $this->options, true);
	}

	// protected function set_plugin_option($key, $value, $rewrite_array = false) {
	// 	return $this->plugin->set_option($key, $value, $rewrite_array);
	// }
	//
	protected function is_plugin_option($key, $check_value = true) {
		return $this->plugin->is_option($key, $check_value);
	}

	// Redirect to plugin methods ---------------------------------------------]

	protected function sprintf_dir(...$params) {
		return call_user_func_array([$this->plugin, 'sprintf_dir'], $params);
	}
	protected function sprintf_uri(...$params) {
		return call_user_func_array([$this->plugin, 'sprintf_uri'], $params);
	}
	protected function enqueue_style($file, $params = []) {
		return $this->plugin->enqueue_style($this->prefix_it($file), $params);
	}
	protected function enqueue_script($file, $params = []) {
		return $this->plugin->enqueue_script($this->prefix_it($file), $params);
	}
	protected function admin_enqueue_style($file, $params = []) {
		return $this->plugin->admin_enqueue_style($this->prefix_it($file), $params);
	}
	protected function admin_enqueue_script($file, $params = []) {
		return $this->plugin->admin_enqueue_script($this->prefix_it($file), $params);
	}
	protected function ajax_error($error, $params = null) {
		return $this->plugin->ajax_error($error, $params);
	}
	protected function check_error($error, $ajax = false, &$report = null) {
		return $this->plugin->check_error($error, $ajax, $report);
	}
	protected function ajax_nonce($create = false) {
		return $this->plugin->ajax_nonce($create);
	}
	protected function ajax_send($result) {
		return $this->plugin->ajax_send($result);
	}
	protected function create_notice($status, $message, $actions = []) {
		return $this->plugin->create_notice($status, $message, $actions);
	}
	protected function prefix_it($str, $divider = '-') {
		// if $str starts with '!' then do not prefix it (could be an absolute path)
		if(substr($str, 0, 1) === '!') return $str;
		return $this->plugin->prefix_it($str, $divider);
	}

	// Common interface plugin methods with availability check ----------------]
	// NOTE: only public functions can be called with this helper

	protected function call($func, ...$params) {
		if(method_exists($this->plugin, $func)) return call_user_func_array([$this->plugin, $func], $params);
		else return null;
	}

	protected function snippets(...$params) {
		return call_user_func_array([$this->plugin, 'snippets'], $params);
	}

	// Helpers ----------------------------------------------------------------]

	protected function get($key, $from_plugin = false, $default_value = null) {
		$config = $from_plugin ? $this->plugin->config : $this->config;
		return isset($config[$key]) ? $config[$key] : $default_value;
	}
}
