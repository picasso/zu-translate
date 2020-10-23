<?php

require_once('zukit-singleton.php');
require_once('zukit-addon.php');
require_once('zukit-table.php');

require_once('traits/admin.php');
require_once('traits/admin-menu.php');
require_once('traits/ajax.php');

if(!function_exists('zu_snippets')) {
	require_once('snippets/hub.php');
}

// Basic Plugin Class ---------------------------------------------------------]

class zukit_Plugin extends zukit_Singleton {

	public $config;

	protected $options_key;
	protected $options = null;
	protected $data = [];
	protected $addons = [];

	// Admin basics, menu management and REST API support
	use zukit_Admin, zukit_AdminMenu, zukit_Ajax;

	function config_singleton($file) {

		if(isset($file)) {
			$this->dir = untrailingslashit(plugin_dir_path($file));
			$this->uri = untrailingslashit(plugin_dir_url($file));

			$this->data = get_plugin_data($file);
			$this->version = $this->data['Version'];
		}

		$this->config = array_merge([
			'prefix' 	=> 'zuplugin',
			'admin' 	=> [],
			'icon'		=> $this->snippets('insert_svg_from_file', $this->dir, 'logo', true, true),
		], $this->config());
		$this->prefix = $this->config['prefix'] ?? $this->prefix;
		$this->options_key = $this->config['options_key'] ?? $this->prefix.'_options';

// _dbug('prefix', $this->prefix);
// add_action('init', function() { delete_option($this->options_key); }, 8);

		// Load 'options' before any other actions
		add_action('init', [$this, 'options'], 9);
		add_action('init', [$this, 'init'], 10);
		add_action('init', function() { $this->do_addons('init'); }, 11);
// add_action('init', function() { _dbug('after init', $this->options); }, 12);

		add_action('admin_init', [$this, 'admin_init'], 10);
		add_action('admin_init', function() { $this->do_addons('admin_init'); }, 11);

		add_action('enqueue_scripts', [$this, 'frontend_enqueue'], 10, 1);
		add_action('enqueue_scripts', function($hook) { $this->do_addons('enqueue', $hook); }, 11, 1);

		add_action('admin_enqueue_scripts', [$this, 'admin_enqueue'], 10, 1);
		add_action('admin_enqueue_scripts', function($hook) { $this->do_addons('admin_enqueue', $hook); }, 11, 1);

		$this->admin_config($file, $this->config['admin']);
		$this->admin_menu_config();
		$this->ajax_config();
	}

	protected function info() {
		$more_info = apply_filters('zukit_plugin_info', (object) null);
		return [
			'version'		=> $this->version,
			'title'			=> $this->data['Name'],
			'author'		=> $this->data['AuthorName'],
			'link'			=> preg_replace('/.*href="([^\"]+).*/ims', '$1', $this->data['Author']),
			'description'	=> preg_replace('/<cite>.+<\/cite>/i', '', $this->data['Description']),
			'icon'			=> $this->config['icon'],
			'more' 			=> $more_info,
		];
	}

	protected function debug_actions() {
		$debug_actions = apply_filters('zukit_debug_actions', []);
		return $debug_actions === false ? [] : array_merge([
				[
					'label'		=> __('Clear Debug Log', 'zu-plugin'),
					'value'		=> 'clear_log',
					'icon'		=> 'trash',
					'color'		=> 'error',
				],
				[
					'label'		=> __('Test Ajax', 'zu-plugin'),
					'value'		=> 'test_ajax',
					'icon'		=> 'dashboard',
					'color'		=> 'green',
				],
			], $debug_actions);
	}

	// Нельзя! работать с 'options' в 'construct_more()', там 'options' еще не определены
	protected function construct_more() {}

	protected function config() { return []; }
	protected function status() { return null; }
	public function init() {}
	public function admin_init() {}

	// Addons management ------------------------------------------------------]

	public function register_addon($addon, $config = []) {
		if(!in_array($addon, $this->addons)) {
			$this->addons[] = $addon;
			$addon->register($this);
		}
		return $addon;
	}

	public function do_addons($action, $param = '') {
		foreach($this->addons as $addon) {

			if(method_exists($addon, $action)) call_user_func_array([$addon, $action], [$param]);
			else $this->log_error(
				['action' => $action, 'param' => $param],
				['do_addons' => 'Unknown addon method!']
			);
		}
	}

	public function reset_addons() { $this->do_addons('init_options'); }
	public function clean_addons() { $this->do_addons('clean'); }
	public function ajax_addons($action, $value) {

		$result = null;
		foreach($this->addons as $addon) {
			$ajax_result = $addon->ajax($action, $value);
			// сообщить об ошибке если два $addon отреагировали на одно действие
			// если не отреагировали, то результат должен быть null
			if($ajax_result !== null && $result !== null) {
				$this->log_error(
					['action' => $action, 'value' => $value],
					['ajax_addons' => 'Two or more addons responded to ajax actions!']
				);
			} else if($result === null) {
				$result = $ajax_result;
			}
		}

		return $result;
	}

	// Options management -----------------------------------------------------]
	//
	// Нельзя использовать эти функции в 'construct_more()',
	// там options еще не определены
	public function options() {
		$options = get_option($this->options_key);
// _dbug('get options', $options);
// $options = false;

		// Check whether we need to install an option, used during installation of plugin
		if($options === false) $options = $this->reset_options(false);
		$this->options = $options;
		return $this->options;
	}

	public function update_options($options = null) {
		return update_option($this->options_key, $options ?? $this->options);
	}

	public function reset_options($withAddons = true) {
		$options = $this->config['options'] ?? [];
		$this->update_options($options);
		$this->options = $options;
		if($withAddons) $this->reset_addons();
		return $this->options;
	}

	// Если меняем только часть опций принадлежащих addon, то не обновляем опции - addon об этом позаботится
	// If 'key' contains 'path' - then resolve it before update
	public function set_option($key, $value, $rewrite_array = false, $addon_options = null) {

		// $value cannot be undefined or null!
		if(!isset($value) || is_null($value)) return $options;

		$result = true;
		$options = is_null($addon_options) ? $this->options : $addon_options;
		if(!$rewrite_array && is_array($value)) $options[$key] = array_replace_recursive($options[$key] ?? [], $value);
		else {
			// sets a value in a nested array based on path (if presented)
			$pathParts = explode('.', $key);

			if(count($pathParts) === 1) {
				$options[$key] = $value;
			} else {
				$lastKey = $pathParts[count($pathParts)-1];
				$current = &$options;
				foreach($pathParts as $pathKey) {
					if($pathKey === $lastKey) break;
					if(!is_array($current)) return false;
					$current = &$current[$pathKey];
				}
				if(!is_array($current)) return false;
				$current[$lastKey] = $value;
			}
		}

		if(is_null($addon_options)) {
			$this->options = $options;
			$result = $this->update_options();
		}
		return $result === false ? false : $options;
	}

	public function get_option($key, $default = '', $addon_options = null) {
		$options = is_null($addon_options) ? $this->options : $addon_options;
		if(!isset($options[$key])) return $default;

		// return and cast to default value type
		if(is_bool($default)) return filter_var($options[$key], FILTER_VALIDATE_BOOLEAN);
		if(is_int($default)) return intval($options[$key]);
		if(is_string($default))	return strval($options[$key]);

		return $options[$key];
	}

	public function is_option($key, $check_value = true, $addon_options = null) {
		$value = $this->get_option($key, $this->def_value($check_value), $addon_options);

		// if(is_bool($check_value)) $value = filter_var($this->get_option($key, false, $addon_options), FILTER_VALIDATE_BOOLEAN);
		// else if(is_int($check_value)) $value = intval($this->get_option($key, 0, $addon_options));
		// else $value = strval($this->get_option($key, '', $addon_options));

		return $value === $check_value;
	}

	private function def_value($type) {
		// return default value for given type
		if(is_bool($type)) return false;
		if(is_int($type)) return 0;
		if(is_string($type)) return '';
		return null;
	}

	// Scripts & Paths management ---------------------------------------------]

	public function sprintf_dir(...$params) {
		$path = call_user_func_array('sprintf', $params);
		return $this->dir.$path;
	}

	public function sprintf_uri(...$params) {
		$path = call_user_func_array('sprintf', $params);
		return $this->uri.$path;
	}

	protected function js_deps($is_frontend) {
		return $is_frontend ? [] : ['wp-api', 'wp-i18n', 'wp-components', 'wp-element'];
	}
	protected function css_deps($is_frontend) {
		return $is_frontend ? [] : ['wp-edit-post'];
	}
	protected function get_js_data($is_frontend) {
		return $this->js_data($is_frontend, [
			'jsdata_name'	=> 'zukit_settings',
			'options' 		=> $this->options,
			'info'			=> $this->info(),
			'debug'			=> $this->debug_actions(),
			'actions' 		=> [],
		]);
	}

	protected function js_data($is_frontend, $default_data) { return  $is_frontend ? [] : $default_data; }
	protected function should_load_css($is_frontend, $hook) { return false; }
	protected function should_load_js($is_frontend, $hook) { return false; }
	protected function enqueue_more($is_frontend, $hook) {}

	public function frontend_enqueue($hook) {
		if($this->should_load_css(true, $hook)) $this->enqueue_style(null, $this->css_deps(true));
		if($this->should_load_js(true, $hook)) $this->enqueue_script(null, $this->get_js_data(true), $this->js_deps(true));
		$this->enqueue_more(true, $hook);
	}

	public function admin_enqueue($hook) {

		// enqueue 'zukit' helpers & components and CSS
		if($this->config['zukit'] && $this->should_load_js(false, $hook)) {
			$this->admin_enqueue_script($this->get_zukit_filepath(false, 'zukit'), null, self::js_deps(false), true, 'zukit');
			$this->admin_enqueue_style($this->get_zukit_filepath(true, 'zukit'), self::css_deps(false), 'zukit');
		}

		if($this->should_load_css(false, $hook)) $this->admin_enqueue_style(null, $this->css_deps(false));
		if($this->should_load_js(false, $hook)) $this->admin_enqueue_script(null, $this->get_js_data(false), $this->js_deps(false));
		$this->enqueue_more(false, $hook);
	}

	public function prefix_it($str, $divider = '-') {
		return sprintf('%1$s%2$s%3$s', $this->prefix, $divider, $str);
	}

	// Error handling ---------------------------------------------------------]

	// нужно написать перегрузку этой функции чтобы вызывать функцию из Zu+ если он доступен
	// public function log_error($error, $context) {
	// 	if(isset($context)) error_log(print_r($context, true));
	// 	error_log(print_r($error, true));
	// }

	public function check_error($error, $ajax = false, &$report = null) {
		if(is_wp_error($error)) {
			if(isset($report) && isset($report['errors'])) $report['errors'] += 1;

			if($ajax) $this->ajax_error($error, is_array($report) ? null : $report);
			else $this->log_error($error, $report);

			return true;
		}
		return false;
	}

	// Common Interface to Zu Snippets helpers with availability check --------]

	public function snippets($func, ...$params) {
		if(!function_exists('zu_snippets')) return null;
		$snippets = zu_snippets();
		if(method_exists($snippets, $func)) return call_user_func_array([$snippets, $func], $params);
		else return null;
	}
}
