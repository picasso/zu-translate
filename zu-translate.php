<?php
/*
Plugin Name: Zu Translate
Plugin URI: https://wordpress.org/plugins/zu-translate/
GitHub Plugin URI: https://github.com/picasso/zu-translate
Description: Extension for qTranslate-XT
Version: 0.9.6
Author: Dmitry Rudakov
Author URI: https://dmitryrudakov.ru/about/
Text Domain: zu-translate
Domain Path: /lang/
Requires at least: 5.8.0
Requires PHP: 7.2.0
*/

// Prohibit direct script loading
defined('ABSPATH') || die('No direct script access allowed!');

add_action('plugins_loaded', function() { 	// DEBUG-ONLY

// Always load Zukit even if we don't use it later ('wp_doing_ajax' or 'wp_doing_cron')
// as other plugins or themes may want to use it
require_once('zukit/load.php');

// Exit early if a WordPress heartbeat comes
if(wp_doing_ajax() && isset($_POST['action']) && ($_POST['action'] === 'heartbeat')) return;
// Let's not load plugin during cron events
if(wp_doing_cron()) return;

// Start! ---------------------------------------------------------------------]

// compatibility check for Zukit
if(Zukit::is_compatible(__FILE__)) {

	require_once('includes/zutranslate-plugin.php');
	zutranslate(__FILE__);
}

});
