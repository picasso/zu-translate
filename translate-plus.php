<?php
/*
Plugin Name: Translate+
Plugin URI: https://dmitryrudakov.ru/plugins/
GitHub Plugin URI: https://github.com/picasso/translate-plus
Description: Extension for qTranslate-X
Version: 0.9.1
Author: Dmitry Rudakov
Author URI: https://dmitryrudakov.ru/about/
Text Domain: tplus-plugin
Domain Path: /lang/
*/

// define('ZUDEBUG', true);

// Prohibit direct script loading
defined('ABSPATH') || die('No direct script access allowed!');
define('TPLUS_VERSION', '0.9.1');
define('TPLUS_NAME', 'Translate+');
define('__TPLUS_ROOT__', plugin_dir_path(__FILE__)); 
define('__TPLUS_FILE__', __FILE__); 

define('__TPLUS_LOG__', false);					// set to TRUE to change log location 

// Helpers --------------------------------------------------------------------]

function tplus_get_my_dir() {
	return untrailingslashit(__TPLUS_ROOT__);
}

function tplus_get_my_url() {
	return untrailingslashit(plugin_dir_url(__FILE__));
}

// Start! --------------------------------------------------------------------]

add_action('zuplus_loaded', function() { 	//  All ZU+ classes are loaded now
	
	if(__TPLUS_LOG__) _dbug_change_log_location(__FILE__, 2);
	
	require_once(__TPLUS_ROOT__ . 'includes/tplus-loaded.php');
	tplus_instance();
});
