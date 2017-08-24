<?php
/*
Plugin Name: Translate+
Plugin URI: https://dmitryrudakov.ru/plugins/
Description: Extension for qTranslate-X
Version: 0.7.4
Author: Dmitry Rudakov
Author URI: https://dmitryrudakov.ru/about/
Text Domain: tplus-plugin
Domain Path: /lang/
*/

//	
// 	How adapt for a new plugin:
//
// 		- replace 'TPLUS_' for 'YOUR_'
// 		- replace 'tplus_' for 'your_'
//			- replace 'tplus-' for 'your-'
//			- define var $tplus_options_id' in __construct
//


// Prohibit direct script loading
defined('ABSPATH') || die('No direct script access allowed!');
define('TPLUS_VERSION', '0.7.4');
define('TPLUS_NAME', 'Translate+');
define('__TPLUS_ROOT__', plugin_dir_path(__FILE__)); 
define('__TPLUS_FILE__', __FILE__); 

// set SCRIPT_DEBUG to true in wp-config.php to debug qTranslate-X scripts

include_once('/nas/content/live/dmitryrudakov/wp-content/themes/drfoto/includes/debug/dr-debug.php');
// _dbug_change_log_location(plugin_dir_path(__FILE__));

class Translate_Plus {

	private $tplus_admin = null;
	private $tplus_nonce = 'tplus_ajax_nonce';
	private $tplus_options_id = 'tplus_options';
	
	private $defaults = [];

	private static $_tplus_instance;
	public static function instance() {
		if(!isset(self::$_tplus_instance)) {
			$class_name = __CLASS__;
			self::$_tplus_instance = new $class_name;
		}
		return self::$_tplus_instance;
	}

	function __construct() {
		
		add_action('init', array($this, 'init'));

		if(is_admin()) {
			$this->tplus_admin = new tplus_Admin($this->tplus_options_id);
		}
	}

	public function defaults() {
		
		if(empty($this->defaults)) {
			$defaults = [
				'ajaxurl'                => admin_url('admin-ajax.php'),
				'tplus_nonce'     	=> $this->ajax_nonce(),
			];
		
			$this->defaults = $defaults;
		}
		
		return $this->defaults;
	}

	public function options() { 
		return get_option($this->tplus_options_id, []); 
	}
	
	public function ajax_nonce($create = 'true') { 
		return $create ? wp_create_nonce($this->tplus_nonce) : $this->tplus_nonce; 
	}

	public function get_value($key) {
			return isset($this->defaults[$key]) ? $this->defaults[$key] : [];
	}

	public function init() {

		$this->defaults();
		add_shortcode('lang-select', 'tplus_shortcode');	
	}

	public function ready() {
		
		$this->enqueue();
	}

	public function enqueue() {					// front-end

		if(function_exists('dr_add_style_from_file')) dr_add_style_from_file(__TPLUS_ROOT__ . 'css/translate-plus.css');
		else wp_enqueue_style('tplus-style', plugins_url('css/translate-plus.css', __FILE__), array(), TPLUS_VERSION);
		
		wp_enqueue_script('tplus-script', plugins_url('js/translate-plus.min.js', __FILE__), array('jquery'), TPLUS_VERSION, true);
		wp_localize_script('tplus-script', 'tplus_custom', $this->defaults());
	}
}

// Helpers --------------------------------------------------------------------]

function tplus_get_my_dir() {
	return untrailingslashit(__TPLUS_ROOT__);
}

function tplus_get_my_url() {
	return untrailingslashit(plugin_dir_url(__FILE__));
}

function tplus_instance() { 
	return Translate_Plus::instance(); 
}

function tplus_options() {
	return tplus_instance()->options();
}

// Functions & Classes --------------------------------------------------------]

require_once(__TPLUS_ROOT__ . 'includes/tplus-functions.php');
require_once(__TPLUS_ROOT__ . 'includes/tplus-admin.php');
require_once(__TPLUS_ROOT__ . 'includes/tplus-qtx.php');
require_once(__TPLUS_ROOT__ . 'includes/tplus-duplicate-menu.php');

// Start! --------------------------------------------------------------------]

tplus_instance();
