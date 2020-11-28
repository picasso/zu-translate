<?php

// Plugin Debug Trait ---------------------------------------------------------]

trait zukit_Debug {

	private static $debug_prefix = '_debug';

	private function debug_def_options() {
		return [
			'refresh'	=> [
				'label'		=> __('Always Refresh Scripts', 'zukit'),
				'value'		=> false,
			],
		];
	}

	private function debug_def_actions() {
	 	return [
			[
				'label'		=> __('Clear Debug Log', 'zukit'),
				'value'		=> 'clear_log',
				'icon'		=> 'trash',
				'color'		=> 'error',
			],
			[
				'label'		=> __('Test Ajax', 'zukit'),
				'value'		=> 'test_ajax',
				'icon'		=> 'dashboard',
				'color'		=> 'green',
			],
		];
	}

	public function debug_config() {

		$options = array_map(function($option) {
				return $option['value'];
			}, array_merge($this->debug_def_options(), $this->extend_debug_options())
		);

		$this->config['options'][self::$debug_prefix] = $options;
		add_action('init', function() {
			$this->debug = $this->is_debug_option('refresh');
		}, 12);
	}

	protected function extend_debug_options() { return [];}
	protected function extend_debug_actions() { return [];}

	// Debug helpers ----------------------------------------------------------]

	protected function debug_data() {
		return [
			'prefix'	=> self::$debug_prefix,
			'options'	=> array_merge($this->debug_def_options(), $this->extend_debug_options()),
			'actions'	=> array_merge($this->debug_def_actions(), $this->extend_debug_actions()),
		];
	}

	private function debug_path($key) {
		return self::$debug_prefix.'.'.$key;
	}

	public function get_debug_option($key, $default = '') {
		return $this->get_option($this->debug_path($key), $default);
	}

	public function is_debug_option($key, $check_value = true, $addon_options = null) {
		return $this->is_option($this->debug_path($key), $check_value);
	}

	// Debug Ajax Actions -----------------------------------------------------]

	public function debug_ajax_test() {
		return $this->create_notice('info', sprintf(
			'Plugin <strong>"%2$s"</strong> (%3$s) was available via Ajax on <span>%1$s</span>',
			date('H:i d.m.y',  $this->timestamp()),
			$this->data['Name'],
			$this->version
		));
	}

	public function debug_empty_log() {
		return $this->create_notice('warning',
			sprintf( 'empty_log is not implemented yet! (Plugin "%1$s")', $this->data['Name'])
		);
	}
}
