<?php

require_once('zukit-singleton.php');
require_once('zukit-addon.php');
require_once('zukit-blocks.php');
require_once('zukit-table.php');

require_once('traits/options.php');
require_once('traits/admin.php');
require_once('traits/admin-menu.php');
require_once('traits/ajax-rest.php');
require_once('traits/debug.php');
require_once('traits/exchange.php');

// Basic Plugin Class ---------------------------------------------------------]

class zukit_Plugin extends zukit_SingletonScripts {

	private static $zukit_version = '1.5.0'; // .' (modified)';
	private static $zukit_debug = false;

	public $config;

	protected $options_key;
	protected $options = null;
	protected $path_autocreated = true;
	protected $data = [];
	protected $addons = [];
	protected $blocks = null;

	private static $zukit_translations = false;
	private $translations_loaded = null;
	private $is_plugin = false;
	private $refresh_scripts = false;

	// Options, admin basics, menu management and REST API support
	use zukit_Options, zukit_Admin, zukit_AdminMenu, zukit_AjaxREST, zukit_Debug;

	protected function singleton_config($file) {
		if(isset($file)) {
			$this->data = Zukit::get_file_metadata($file);
			$this->is_plugin = $this->data['Kind'] === 'Plugin';
			$this->version = $this->data['Version'];

			if($this->is_plugin) {
				$this->dir = untrailingslashit(plugin_dir_path($file));
				$this->uri = untrailingslashit(plugin_dir_url($file));
			}
		}

		$this->config = array_replace_recursive([
			'prefix' 	=> 'zuplugin',
			'suffix' 	=> 'frontend',

			// admin settings
			'admin' 	=> [],

			// appearance
			'appearance'	=> [
				'icon'		=> $this->snippets('insert_svg_from_file', $this->dir, 'logo', [
		            'preserve_ratio'	=> true,
		            'strip_xml'			=> true,
		            'subdir'			=> 'images/',
				]),
				'colors'	=> [],
			],

			// translations
			'translations'	=> [
				'path'				=> null,
				'domain'			=> null,
			],

			// custom blocks
			'blocks'		=> zukit_Blocks::defaults(),

			// MISCELLANEOUS:

			// if set to true then options will always be taken from default values
			'debug_defaults'	=> false,

		], $this->config() ?? []);

		$this->prefix = $this->get('prefix') ?? $this->prefix;
		$this->options_key = $this->get('options_key') ?? $this->prefix_it('options', '_');
		// keep updated values in config (there they can be available for add-ons)
		$this->config['prefix'] = $this->prefix;
		$this->config['options_key'] = $this->options_key;

		// Load 'options' before any other methods & actions ('true' - check if installation is required)
		$this->options(true);

		// divide the 'init' for plugins and themes: ($is_admin, $for_plugins)
		add_action('init', function() { $this->init_action(false, true); }, 9);
		add_action('init', function() { $this->init_action(false, false); }, 10);

		add_action('admin_init', function() { $this->init_action(true, true); }, 9);
		add_action('admin_init', function() { $this->init_action(true, false); }, 10);

		add_action('wp_enqueue_scripts', [$this, 'frontend_enqueue'], 10);
		add_action('wp_enqueue_scripts', function() { $this->do_addons('enqueue'); }, 11);

		// enqueue 'zukit' helpers & components and its CSS
		add_action('admin_enqueue_scripts', [$this, 'zukit_enqueue'], 10, 1);

		add_action('admin_enqueue_scripts', [$this, 'admin_enqueue'], 10, 1);
		add_action('admin_enqueue_scripts', function($hook) { $this->do_addons('admin_enqueue', $hook); }, 11, 1);

		// all translations loaded only 'after_setup_theme'
		add_action('after_setup_theme', [$this, 'load_translations']);

		// add body class for an active theme (and maybe child theme)
		$this->theme_mark();

		$this->admin_config($file, $this->get('admin', []));
		$this->admin_menu_config();
		$this->ajax_config();
		$this->blocks_config();
		$this->debug_config();
	}

	// Should not use the functions for 'options' in construct_more(),
	// since the 'options' there are not yet synchronized with the class properties
	protected function construct_more() {}

	protected function config() {}
	protected function status() {}

	public function zukit_ver() { return self::$zukit_version; }
	public static function zukit_debug($toggle = true) { self::$zukit_debug = $toggle; }

	// split the 'init' for plugins and themes
	// the 'init' for plugins will be called before the themes
	public function init_action($is_admin, $for_plugins) {
		$plugin_related = $this->is_plugin && $for_plugins;
		$theme_related = !$this->is_plugin && !$for_plugins;
		if(!$is_admin && ($plugin_related || $theme_related)) {
			$this->init();
			$this->do_addons('init');
		}
		if($is_admin && ($plugin_related || $theme_related)) {
			$this->admin_init();
			$this->do_addons('admin_init');
		}
	}

	protected function init() {}
	protected function admin_init() {}

	// Translations -----------------------------------------------------------]

	private function text_domain() {
		return $this->get('translations.domain') ?? $this->data['TextDomain'] ?? $this->prefix;
	}

	private function text_path() {
		$path = $this->get('translations.path') ?? $this->data['DomainPath'];
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

	public function do_addons($action, $param = '', $options = null, &$return = null) {
		$swap_param_and_return = $options['swap'] ?? false;
		$single_param = $options['single'] ?? true;
		$collected = ($options['collect'] ?? false) ? [] : null;
		foreach($this->addons as $addon) {
			if(method_exists($addon, $action)) {
				$return = call_user_func_array([$addon, $action], $single_param ? [$param] : ($param ?? []));
				if(!is_null($collected)) $collected[get_class($addon)] = $return;
				if($swap_param_and_return) $param = $return;
			}
			else {
				if(!is_null($collected)) $collected[get_class($addon)] = null;
				else $this->logc('Unknown addon method!', [
					'addons'				=> $this->addons,
					'action'				=> $action,
					'param'					=> $param,
					'swap_param_and_return'	=> $swap_param_and_return,
					'single_param'			=> $single_param,
					'collected'				=> $collected,
				]);}
		}
		return $collected;
	}

	public function reset_addons() { $this->do_addons('init_options'); }
	public function extend_from_addons(&$options) { $this->do_addons('extend_parent_options', $options, ['swap' => true], $options); }
	public function clean_addons() { $this->do_addons('clean'); }
	public function ajax_addons($action, $value) {

		$result = null;
		foreach($this->addons as $addon) {
			$ajax_result = $addon->ajax($action, $value);
			// сообщить об ошибке если два $addon отреагировали на одно действие
			// если не отреагировали, то результат должен быть null
			if($ajax_result !== null && $result !== null) {
				$this->logc('Two or more addons responded to ajax actions!', [
					'action' => $action,
					'value' => $value
				]);
			} else if($result === null) {
				$result = $ajax_result;
			}
		}

		return $result;
	}

	// Scripts & Paths management ---------------------------------------------]

	public function sprintf_dir(...$params) {
		$path = call_user_func_array('sprintf', $params);
		return $this->dir . '/' . ltrim($path, '/\\');
	}

	public function sprintf_uri(...$params) {
		$path = call_user_func_array('sprintf', $params);
		return $this->uri . '/' . ltrim($path, '/\\');
	}

	private function script_defaults() {
		// for admin handle will be '<prefix>' and for frontend -> '<prefix>-<suffix>'
		// for the theme and main stylesheet will be '<prefix>-main'
		$admin_handle = $this->get('prefix');
		$frontend_handle = $this->prefix_it($this->get('suffix'));
		$main_style_handle = $this->prefix_it('main');

		return [
			// front-end script & style
			'script'	=> [
				'deps'		=> [],
				'data'		=> [$this, 'jsdata_defaults'],
				'handle'	=> $frontend_handle,
				'refresh'	=> $this->refresh_scripts,
			],
			'style'		=> [
				'deps'		=> [],
				'handle'	=> $frontend_handle,
				'refresh'	=> $this->refresh_scripts,
			],
			'main_style'	=> [
				'deps'		=> [],
				'handle'	=> $main_style_handle,
				'absolute'	=> true,
				'refresh'	=> $this->refresh_scripts,
			],
			// plugin/theme settings page script & style
			'settings_script'	=> [
				'deps'		=> ['zukit'],
				'data'		=> [$this, 'jsdata_defaults'],
				'handle'	=> $admin_handle,
				'refresh'	=> $this->refresh_scripts,
			],
			'settings_style'	=> [
				'deps'		=> ['zukit'],
				'handle'	=> $admin_handle,
				'refresh'	=> $this->refresh_scripts,
			],
		];
	}

	public function get_file_version($filepath) {
		return $this->get_version($filepath, $this->refresh_scripts);
	}

	public function enforce_defaults($is_style, $is_frontend, $params) {
		return array_merge($params, [
			'refresh'	=> $this->refresh_scripts,
		]);
	}

	private function jsdata_defaults($is_frontend) {
		$default_data = $is_frontend ? [
			'ajaxurl'       => admin_url('admin-ajax.php'),
			'nonce'     	=> $this->ajax_nonce(true),
			'slug'			=> $this->snippets('get_slug'),
		] : [
			'jsdata_name'	=> $this->prefix_it('settings', '_'),
			'wp'			=> get_bloginfo('version'),
			'router'		=> $this->get_router_name(),
			'options' 		=> $this->options,
			'info'			=> $this->info(),
			'debug'			=> $this->debug_data(),
			'actions' 		=> $this->extend_actions(),
		];
		return $default_data;
	}

	protected function js_params($is_frontend, $defaults = null) {
		$params = $this->get($is_frontend ? 'script' : 'settings_script', [], $defaults);
		$params['data'] = $this->get_callable_data($params['data'] ?? null, $is_frontend);
		return $params;
	}

	protected function css_params($is_frontend, $defaults = null) {
		return $this->get($is_frontend ? 'style' : 'settings_style', [], $defaults);
	}

	// Guarantees that if user did not include any requred keys or set it to 'null'
	// then default values will be added anyway
	private function js_params_validated($is_frontend) {
		return $this->params_validated(
			$this->js_params($is_frontend),
			$this->js_params($is_frontend, $this->script_defaults())
		);
	}
	private function css_params_validated($is_frontend) {
		return $this->params_validated(
			$this->css_params($is_frontend),
			$this->css_params($is_frontend, $this->script_defaults())
		);
	}

	// protected function js_data($is_frontend) {}
	protected function should_load_css($is_frontend, $hook) { return false; }
	protected function should_load_js($is_frontend, $hook) { return false; }
	protected function enqueue_more($is_frontend, $hook) {}

	public function frontend_handles($handle = null) {
		$handles = ['script' => null, 'style' => null];
		if($this->should_load_js(true, null)) $handles['script'] = $this->enqueue_script(
			null,
			$this->js_params_validated(true),
			true
		);
		if($this->should_load_css(true, null)) $handles['style'] = $this->enqueue_style(
			null,
			$this->css_params_validated(true),
			true
		);
		return $handle ? ($handles[$handle] ?? null) : $handles;
	}

	public function enqueue_main_style() {
		$params = $this->get('main_style', [], $this->script_defaults());
		if(is_child_theme() && $this->is_option('load_parent_css')) {
			$parent_params = $params;
			$parent_params['handle'] = $this->prefix_it('parent');
			$this->enqueue_style($this->sprintf_uri('style.css'), $params);
			$params['deps'][] = $parent_params['handle'];
		}
		$this->enqueue_style(get_stylesheet_uri(), $params);
	}

	public function frontend_enqueue() {
		if(!$this->is_plugin) $this->enqueue_main_style();
		if($this->should_load_css(true, null)) $this->enqueue_style(null, $this->css_params_validated(true));
		if($this->should_load_js(true, null)) $this->enqueue_script(null, $this->js_params_validated(true));
		$this->enqueue_more(true, null);
	}

	// Этот метод используется для загрузки CSS and JS
	// которые будут использованы для блоков внутри Gutenberg Editor
	public function force_frontend_enqueue($load_css, $load_js) {
		if($load_css && $this->should_load_css(true, null)) {
			$css_params = $this->css_params_validated(true);
			$css_params['register_only'] = false;
			$this->enqueue_style(null, $css_params);
		}
		if($load_js && $this->should_load_js(true, null)) {
			$js_params = $this->js_params_validated(true);
			$js_params['register_only'] = false;
			$this->enqueue_script(null, $js_params);
		}
	}
	public function blocks_enqueue_more($is_frontend, $block_name, $attributes) {}

	public function zukit_enqueue($hook) {
		if($this->is_zukit_slug($hook)) {
			// dependencies for Zukit script & styles
			$js_deps = ['wp-edit-post'];
			$css_deps = ['wp-edit-post'];
			// params for 'zukit' script
			$zukit_params = [
				'data'		=> null,
				'deps'		=> $js_deps,
				'handle'	=> 'zukit',
				'refresh'	=> self::$zukit_debug ? true : $this->refresh_scripts,
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

	public function enqueue_only($is_style = null, $handle = null, $is_frontend = true) {

		if(is_null($handle)) {
			$js_params = $this->js_params_validated($is_frontend);
			$css_params = $this->css_params_validated($is_frontend);
			$handle = [$css_params['handle'], $js_params['handle']];
		}
		parent::enqueue_only($is_style, $handle);
    }

	// Helpers ----------------------------------------------------------------]

	// gets a value and if this value is a function or a class method,
	// then calls it and returns the result of this call
	public function get_callable_data($data, $is_frontend) {
		if(is_callable($data)) $data = call_user_func($data, $is_frontend);
		return $data;
	}

	// redefined this method from snippets for convenience (it's very often used)
	public function array_with_defaults($array, $defaults, $only_default_keys = true, $clean = true) {
		return $this->snippets('array_with_defaults', $array, $defaults, $only_default_keys, $clean);
	}

	public function prefix_it($str, $divider = '-') {
		// if '$str' starts with '!' then do not prefix it (could be an absolute path)
		if(substr($str, 0, 1) === '!') return $str;
		return sprintf('%1$s%2$s%3$s', $this->prefix, $divider, $str);
	}

	public function get($key, $default_value = null, $addon_config = null, $check_callable = true) {
		$config = is_null($addon_config) ? $this->config : $addon_config;
		// If 'key' contains 'path' - then resolve it before get
		$pathParts = explode('.', $key);
		$pathCount = count($pathParts);
		if($pathCount > 1) {
			$key = $pathParts[$pathCount - 1];
			foreach($pathParts as $pathKey) {
				if($pathCount === 1) break;
				if(!is_array($config)) return $default_value;
				$config = $config[$pathKey] ?? null;
				$pathCount--;
			}
		}
		return isset($config[$key]) ? $config[$key] : $default_value;
	}

	public function get_callable($key, $default_value = null, $addon_config = null) {
		$value = $this->get($key, $default_value, $addon_config);
		// we do not use 'is_callable' directly to avoid cases when the 'value' matches the name of the existing function
		$is_callable = (is_array($value) && is_callable($value)) || ($value instanceof Closure);
		return $is_callable ? call_user_func($value) : $value;
	}

	public function params_validated($params, $defaults = []) {
		$params_not_null = array_filter($params ?? [], function($val) { return !is_null($val); });
		return array_replace_recursive($defaults, $params_not_null);
	}

	private function theme_mark($delimiter = '-', $prefix = 'is-') {
		$theme = wp_get_theme();
		$names = [
			preg_replace('/\s+/', $delimiter, strtolower($theme->name)),
			empty($theme->parent_theme) ? null : strtolower(preg_replace('/\s+/', $delimiter, $theme->parent_theme)),
		];
		$this->snippets('add_body_class', $names, $prefix);
		$this->snippets('add_admin_body_class', $names, $prefix);
	}

	private function blocks_config() {
		$blocks = $this->get_callable('blocks.blocks');
		$instance = $this->get_callable('blocks.instance');
		if(!empty($blocks) || !empty($instance)) {
			if(is_null($instance)) $this->blocks = new zukit_Blocks;
			elseif(is_string($instance) && class_exists($instance)) $this->blocks = new $instance();
			if($this->blocks instanceof zukit_Blocks) $this->register_addon($this->blocks);
			else zu_logc('!Your class must inherit from the "zukit_Blocks" class', $instance);
		}
	}

	// Error handling ---------------------------------------------------------]

	public function is_error($error) {
		if(is_wp_error($error)) {
			zu_logc('!WP_Error occurred', $error->get_error_message());
			return true;
		}
		return false;
	}

	// Common Interface to Zu Snippets helpers with availability check --------]

	public function has_snippet($name) {
		if(!function_exists('zu_snippets')) return false;
		return zu_snippets()->method_exists($name);
	}

	public function register_snippet($func, $instance = 'self', $default = null) {
		if(!function_exists('zu_snippets')) return false;
		zu_snippets()->register_method($func, $instance === 'self' ? $this : $instance, $default);
		return true;
	}

	public function snippets($func, ...$params) {
		return $this->call_snippet(false, $func, $params);
	}

	// use this method to supress error logging
	public function _snippets($func, ...$params) {
		return $this->call_snippet(true, $func, $params);
	}

	private function call_snippet($quiet, $func, $params) {
		if(!function_exists('zu_snippets')) return null;
		$snippets = zu_snippets();
		if($snippets->method_exists($func)) return call_user_func_array([$snippets, $func], $params);
		else {
			$is_heartbeat = wp_doing_ajax() && isset($_POST['action']) && ($_POST['action'] === 'heartbeat');
			if($this->debug_mode && !$quiet) $this->logc('!Snippet called was not found!', $func, $is_heartbeat);
			return null;
		}
	}
}
