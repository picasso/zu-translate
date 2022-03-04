<?php

// Plugin Debug Trait ---------------------------------------------------------]

trait zukit_Debug {

	private static $log_shift = 0;
	private $debug_mode = true;

	protected static $debug_group = '_debug';
	protected static $panels_group = '_panels';

	private function debug_def_options() {
		return [
			'refresh'	=> [
				'label'		=> __('Prevent Script Caching', 'zukit'),
				'value'		=> false,
			],
		];
	}

	private function debug_def_actions() {
		$clear_label = __('Clear Error Log', 'zukit');
		if(function_exists('zuplus') && zuplus()->is_debug()) $clear_label = __('Clear Debug Log', 'zukit');
	 	return [
			[
				'label'		=> $clear_label,
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
			}, array_merge($this->debug_def_options(), $this->extend_debug_options() ?? [])
		);

		$this->config['options'][self::$debug_group] = $options;
		add_action('init', function() {
			$this->refresh_scripts = $this->is_debug_option('refresh');
		}, 12);
	}

	protected function extend_debug_options() {}
	protected function extend_debug_actions() {}

	// Debug helpers ----------------------------------------------------------]

	protected function internal_data() {
		return [
			'debug_group'	=> self::$debug_group,
			'panels_group'	=> self::$panels_group,
			'options'		=> array_merge($this->debug_def_options(), $this->extend_debug_options() ?? []),
			'actions'		=> array_merge($this->debug_def_actions(), $this->extend_debug_actions() ?? []),
		];
	}

	private function debug_path($key) {
		return self::$debug_group.'.'.$key;
	}

	public function get_debug_option($key, $default = '') {
		return $this->get_option($this->debug_path($key), $default);
	}

	public function is_debug_option($key, $check_value = true) {
		return $this->is_option($this->debug_path($key), $check_value);
	}

	public function debug_line_shift($shift = 0) {
		if($shift === null) return self::$log_shift;
		else self::$log_shift = $shift;
	}

	// Log methods ------------------------------------------------------------]

	// overriding the 'log', 'logc' and 'logfile_clear' methods from the Zu+ plugin, if available
	public function log(...$params) {
		if($this->can_override()) zuplus()->dlog($params, static::class);
        else parent::log_with(self::$log_shift, null, ...$params);
    }

	public function logc($context, ...$params) {
		if($this->can_override()) zuplus()->dlogc($context, $params, static::class);
        else parent::log_with(self::$log_shift, $context, ...$params);
    }

	protected function logfile_clean() {
		return $this->can_override() ? zuplus()->dlog_clean() : parent::logfile_clean();
	}

	private function can_override() {
		return $this->created && function_exists('zuplus');
	}

	// Debug Ajax Actions -----------------------------------------------------]

	public function debug_ajax_test() {
		return $this->create_notice('info', sprintf(
			'Plugin "**%2$s**" [*%3$s*] was available via Ajax on `%1$s`',
			date('H:i d.m.y',  $this->timestamp()),
			$this->data['Name'],
			$this->version
		));
	}

	public function debug_empty_log() {
		$file = $this->logfile_clean();
		if($file === null) return $this->create_notice('error', __('**Failed to clear log**. Something went wrong.', 'zukit'));
		if(is_array($file)) return $file;
		return $this->create_notice('info', sprintf('**Error log** has been cleared\nat `%1$s`', $file));
	}
}

// Log functions for use in code ----------------------------------------------]
// overriding the 'log' and 'logc' methods from the Zu+ plugin, if available

if(!function_exists('zu_log')) {
    function zu_log(...$params) {
		if(function_exists('zuplus')) zuplus()->dlog($params);
        else if(function_exists('zu_snippets')) zu_snippets()->log_with(0, null, ...$params);
    }
}
if(!function_exists('zu_logc')) {
	function zu_logc($context, ...$params) {
		if(function_exists('zuplus')) zuplus()->dlogc($context, $params);
        else if(function_exists('zu_snippets')) zu_snippets()->log_with(0, $context, ...$params);
    }
}
if(!function_exists('zu_log_if')) {
    function zu_log_if($condition, ...$params) {
		if($condition) {
			if(function_exists('zuplus')) {
				array_unshift($params, '!condition hit!');
				zuplus()->dlog($params);
			} else if(function_exists('zu_snippets')) zu_snippets()->log_with(0, null, ...$params);
		}
    }
}
if(!function_exists('zu_logd')) {
	function zu_logd(...$params) {
		if(function_exists('zu_snippets')) zu_snippets()->logd(...$params);
	}
}
if(!function_exists('zu_log_location')) {
	function zu_log_location($path, $priority = 1) {
		if(function_exists('zuplus')) return zuplus()->dlog_location($path, $priority);
		return null;
	}
}
