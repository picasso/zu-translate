<?php

require_once('zukit-singleton.php');
require_once('zukit-addon.php');
require_once('zukit-table.php');

require_once('traits/admin.php');
require_once('traits/admin-menu.php');
require_once('traits/ajax.php');
require_once('traits/debug.php');

// Basic Plugin Class ---------------------------------------------------------]

class zukit_Plugin extends zukit_Singleton {

	public $config;

	protected $options_key;
	protected $options = null;
	protected $path_autocreated = false;
	protected $data = [];
	protected $addons = [];

	private static $zukit_translations = false;
	private $translations_loaded = null;
	private $is_plugin = true;

	// Admin basics, menu management and REST API support
	use zukit_Admin, zukit_AdminMenu, zukit_Ajax, zukit_Debug;

	function config_singleton($file) {

		if(isset($file)) {
			$this->is_plugin = strpos($file, 'wp-content/plugins/') !== false;

			if($this->is_plugin) {
				$this->dir = untrailingslashit(plugin_dir_path($file));
				$this->uri = untrailingslashit(plugin_dir_url($file));
			}

			$this->data = Zukit::plugin_data($file);
			$this->version = $this->data['Version'];
		}

		$this->config = array_merge([
			'prefix' 	=> 'zuplugin',
			// admin settings
			'admin' 	=> [],
			// appearance
			'icon'		=> $this->snippets('insert_svg_from_file', $this->dir, 'logo', [
	            'preserve_ratio'	=> true,
	            'strip_xml'			=> true,
	            'subdir'			=> 'images/',
			]),
			'colors'	=> [],
			// translations
			'path'				=> null,
			'domain'			=> null,
		], $this->config());
		$this->prefix = $this->config['prefix'] ?? $this->prefix;
		$this->options_key = $this->config['options_key'] ?? $this->prefix.'_options';

		// Load 'options' before any other actions
		add_action('init', [$this, 'options'], 9);
		add_action('init', [$this, 'init'], 10);
		add_action('init', function() { $this->do_addons('init'); }, 11);

		add_action('admin_init', [$this, 'admin_init'], 10);
		add_action('admin_init', function() { $this->do_addons('admin_init'); }, 11);

		add_action('wp_enqueue_scripts', [$this, 'frontend_enqueue'], 10, 1);
		add_action('wp_enqueue_scripts', function($hook) { $this->do_addons('enqueue', $hook); }, 11, 1);

		// enqueue 'zukit' helpers & components and its CSS
		add_action('admin_enqueue_scripts', [$this, 'zukit_enqueue'], 10, 1);

		add_action('admin_enqueue_scripts', [$this, 'admin_enqueue'], 10, 1);
		add_action('admin_enqueue_scripts', function($hook) { $this->do_addons('admin_enqueue', $hook); }, 11, 1);

		// all translations loaded only 'after_setup_theme'
		add_action('after_setup_theme', [$this, 'load_translations']);

		$this->admin_config($file, $this->config['admin']);
		$this->admin_menu_config();
		$this->ajax_config();
		$this->debug_config();
	}

	// Should not use the functions for 'options' in construct_more(),
	// since the 'options' there are not yet synchronized with the class properties
	protected function construct_more() {}

	protected function config() { return []; }
	protected function status() { return null; }

	public function init() {}
	public function admin_init() {}

	// Translations -----------------------------------------------------------]

	private function text_domain() {
		return $this->config['domain'] ?? $this->data['TextDomain'] ?? $this->prefix;
	}

	private function text_path() {
		$path = empty($this->config['path']) ? $this->data['DomainPath'] : $this->config['path'];
		return empty($path) ? null : $this->sprintf_dir('/%1$s', trim($path, '/'));
	}

	public function load_translations() {

		$path_template = '%1$s/%2$s.mo'; // $path . '/' . $locale . '.mo'
		// load Zukit translations
		if(self::$zukit_translations === false) {
			self::$zukit_translations = load_textdomain('zukit', sprintf(
				$path_template,
				$this->zukit_dirname('lang'),
				determine_locale()
			));
		}
		// load plugin/theme translations if path is provided
		$folder = $this->text_path();
		if(!empty($folder)) {
			$domain = $this->text_domain();
			$locale = apply_filters('theme_locale', determine_locale(), $domain);

			$loaded = load_textdomain($domain, sprintf(
				$path_template,
				$folder,
				$locale
			));

			if($loaded) {
				$this->translations_loaded = [
					'domain'	=> $domain,
					'folder'	=> $folder,
				];
				$this->translations_loaded();
			}
		}
	}

	protected function translations_loaded() {}

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
	// !! Should not use these functions in construct_more() !!
	//
	public function options() {
		$options = get_option($this->options_key);
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

	// If we remove from the options belonging to the add-on, then after the operation
	// we do not update the options - add-on will take care of this
	public function del_option($key, $addon_options = null) {
		$result = true;
		$options = is_null($addon_options) ? $this->options : $addon_options;
		if(array_key_exists($key, $options)) {
			unset($options[$key]);
			if(is_null($addon_options)) {
				$this->options = $options;
				$result = $this->update_options();
			}
		}
		return $result === false ? false : $options;
	}

	// If 'key' contains 'path' - then resolve it before update
	// When $this->path_autocreated is true then if a portion of path doesn't exist, it's created
	// If we set value for the options belonging to the add-on, then after the operation
	// we do not update the options - add-on will take care of this
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
					if(!is_array($current)) {
						if($this->path_autocreated) $current = [];
						else return false;
					}
					$current = &$current[$pathKey];
				}
				if(!is_array($current)) {
					if($this->path_autocreated) $current = [];
					else return false;
				}
				$current[$lastKey] = $value;
			}
		}

		if(is_null($addon_options)) {
			$this->options = $options;
			$result = $this->update_options();
		}
		return $result === false ? false : $options;
	}

	// If 'key' contains 'path' - then resolve it before get
	public function get_option($key, $default = '', $addon_options = null) {
		$options = is_null($addon_options) ? $this->options : $addon_options;

		// gets a value in a nested array based on path (if presented)
		$pathParts = explode('.', $key);
		$set = $options;
		if(count($pathParts) > 1) {
			$key = $pathParts[count($pathParts)-1];
			foreach($pathParts as $pathKey) {
				if($pathKey === $key) break;
				if(!is_array($set)) return $default;
				$set = $set[$pathKey] ?? null;
			}
		}

		if(!isset($set[$key])) return $default;

		// return and cast to default value type
		if(is_bool($default)) return filter_var($set[$key], FILTER_VALIDATE_BOOLEAN);
		if(is_int($default)) return intval($set[$key]);
		if(is_string($default))	return strval($set[$key]);

		return $set[$key];
	}

	public function is_option($key, $check_value = true, $addon_options = null) {
		$value = $this->get_option($key, $this->def_value($check_value), $addon_options);
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

	protected function js_params($is_frontend) {
		return [
			'deps'	=> $is_frontend ? [] : ['zukit'],
			'data'	=> $this->get_js_data($is_frontend),
		];
	}
	protected function css_params($is_frontend) {
		return [
			'deps'	=> $is_frontend ? [] : ['zukit'],
		];
	}
	// Guarantees that if user did not include any requred keys or set it to 'null'
	// then default values will be added anyway
	private function js_params_validated($is_frontend) {
		$params_not_null = array_filter($this->js_params($is_frontend), function($val) { return !is_null($val); });
		return array_merge(self::js_params($is_frontend), $params_not_null);
	}
	private function css_params_validated($is_frontend) {
		$params_not_null = array_filter($this->css_params($is_frontend), function($val) { return !is_null($val); });
		return array_merge(self::css_params($is_frontend), $params_not_null);
	}

	protected function get_js_data($is_frontend) {
		$default_data = $is_frontend ? [
			'ajaxurl'       => admin_url('admin-ajax.php'),
			'nonce'     	=> $this->ajax_nonce(true),
			'slug'			=> $this->snippets('get_slug'),
		] : [
			'jsdata_name'	=> $this->prefix_it('settings', '_'),
			'router'		=> $this->admin_slug(),
			'options' 		=> $this->options,
			'info'			=> $this->info(),
			'debug'			=> $this->debug_data(),
			'actions' 		=> [],
		];
		$custom_data = $this->js_data($is_frontend);
		return array_merge($default_data, is_array($custom_data) ? $custom_data : []);
	}

	protected function js_data($is_frontend) {}
	protected function should_load_css($is_frontend, $hook) { return false; }
	protected function should_load_js($is_frontend, $hook) { return false; }
	protected function enqueue_more($is_frontend, $hook) {}

	public function frontend_enqueue($hook) {
		if($this->should_load_css(true, $hook)) $this->enqueue_style(null, $this->css_params_validated(true));
		if($this->should_load_js(true, $hook)) $this->enqueue_script(null, $this->js_params_validated(true));
		$this->enqueue_more(true, $hook);
	}

	public function zukit_enqueue($hook) {
		if($this->is_zukit_slug($hook)) {
			// dependencies for Zukit script & styles
			$js_deps = ['wp-edit-post'];
			$css_deps = ['wp-edit-post'];
			// params for 'zukit' script
			$zukit_params = [
				'data'		=> null,
				'deps'		=> $js_deps,
				'handle'	=> 'zukit'
			];
			$this->admin_enqueue_script('!zukit', $zukit_params);
			$this->admin_enqueue_style('!zukit', array_merge($zukit_params, ['deps'	=> $css_deps]));
			// Parameters: [$handle, $domain, $path]. WordPress will check for a file in that path
			// with the format ${domain}-${locale}-${handle}.json as the source of translations
        	wp_set_script_translations('zukit', 'zukit', $this->zukit_dirname('lang'));
		}
	}

	public function admin_enqueue($hook) {
		if($this->should_load_css(false, $hook)) $this->admin_enqueue_style(null, $this->css_params_validated(false));
		if($this->should_load_js(false, $hook)) {
			$handle = $this->admin_enqueue_script(null, $this->js_params_validated(false));
			if($this->translations_loaded !== null) {
				// Parameters: [$handle, $domain, $path]
				wp_set_script_translations(
					$handle,
					$this->translations_loaded['domain'],
					$this->translations_loaded['folder']
				);
			}
		}
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
