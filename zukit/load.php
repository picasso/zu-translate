<?php

// Compatibility check for Zukit classes --------------------------------------]
// use only PHP 5.* syntax!!

if(!class_exists('Zukit')) {
	class Zukit {

		private static $cache_time = HOUR_IN_SECONDS;

		private static $requires = array(
			'min_php'	=> '7.2.0',
			'min_wp'	=> '5.3.0',
		);

		// The constructor should always be private to prevent direct
	    // construction calls with the `new` operator.
		private function __construct() {}

	    // should not be cloneable
	    final public function __clone() {
	        _doing_it_wrong(__FUNCTION__, 'This class should not be cloneable');
	    }

	    // should not be restorable from strings
	    final public function __wakeup() {
	        _doing_it_wrong(__FUNCTION__, 'Unserializing instances of this class is forbidden');
	    }

		public static function at_least($file, $params) {
			$data = self::get_file_metadata($file);
			$params = array_merge(
				self::$requires,
				array_filter(array('min_php' => $data['RequiresPHP'], 'min_wp' => $data['RequiresWP'])),
				$params
			);

			if(version_compare(self::$requires['min_php'], $params['min_php'], '<')) {
				self::$requires['min_php'] = $params['min_php'];
			}
			if(version_compare(self::$requires['min_wp'], $params['min_wp'], '<')) {
				self::$requires['min_wp'] = $params['min_wp'];
			}
		}

		public static function get_file_metadata($file) {
			// try from cache first
			$cache_id = wp_normalize_path(str_replace(WP_CONTENT_DIR, '', $file));
			$meta = get_transient($cache_id);
			if($meta !== false) return $meta;

			$theme_root = WP_CONTENT_DIR . '/themes';
			$is_theme = strpos($file, $theme_root) !== false;

			$default_headers = array(
				'GitHubURI'			=> 'GitHub URI',
		        'Version'     		=> 'Version',
		        'Description' 		=> 'Description',
		        'Author'      		=> 'Author',
		        'AuthorURI'   		=> 'Author URI',
		        'TextDomain'  		=> 'Text Domain',
		        'DomainPath'  		=> 'Domain Path',
		        'Network'     		=> 'Network',
		        'RequiresWP'  		=> 'Requires at least',
		        'RequiresPHP' 		=> 'Requires PHP',
		    );

			if($is_theme) {
				$stylesheet = get_stylesheet();
				$file = sprintf('%s/%s/style.css', $theme_root, get_stylesheet());
				$default_headers = array_merge(array(
					'Name'        		=> 'Theme Name',
					'ThemeURI'			=> 'Theme URI',
					'GitHubThemeURI'	=> 'GitHub Theme URI',
				), $default_headers);
			} else {
				$default_headers = array_merge(array(
					'Name'        		=> 'Plugin Name',
					'PluginURI'   		=> 'Plugin URI',
					'GitHubPluginURI'	=> 'GitHub Plugin URI',
				), $default_headers);
			}

			$meta = get_file_data($file, $default_headers, $is_theme ? 'theme' : 'plugin');
			$meta['Kind'] = $is_theme ? 'Theme' : 'Plugin';
			$meta['URI'] = $is_theme ? $meta['ThemeURI'] : $meta['PluginURI'];
			$meta['GitHubURI'] = $meta['GitHubURI'] ? $meta['GitHubURI'] : ($is_theme ? $meta['GitHubThemeURI'] : $meta['GitHubPluginURI']);
			set_transient($cache_id, $meta, self::$cache_time);
			return $meta;
		}

		// Check if compatible or maybe all parent classes were loaded in other plugin?
		public static function should_load() {
			$not_compat = self::not_compat();
			$is_compatible = $not_compat['php'] || $not_compat['wp'] ? false : true;
			return $is_compatible && !class_exists('zukit_Plugin');
		}

		public static function not_compat() {
			global $wp_version;
			return array(
				'php'	=> version_compare(phpversion(), self::$requires['min_php'], '<'),
				'wp'	=> version_compare($wp_version, self::$requires['min_wp'], '<'),
			);
		}

		public static function ver_2($version = null) {
			global $wp_version;
			$parts = explode('.', is_null($version) ? $wp_version : $version);
			return $parts[0] .'.'. (isset($parts[1]) ? $parts[1] : '*');
		}

		public static function is_compatible($file, $params = []) {

			self::at_least($file, $params);
			$not_compat = self::not_compat();

			if($not_compat['php'] || $not_compat['wp']) {
				$data = self::get_file_metadata($file);
				$screen = function_exists('get_current_screen') ? get_current_screen() : null;

				$notice = sprintf($not_compat['php'] ?
					'<b>"%1$s"</b> requires at least <b>PHP %2$s</b> and is not compatible with %3$s.' :
					'<b>"%1$s"</b> requires at least <b>WordPress %2$s</b> and is not compatible with WP %3$s.',
					$data['Name'],
					self::ver_2(self::$requires[$not_compat['php'] ? 'min_php' : 'min_wp']),
					self::ver_2($not_compat['php'] ? phpversion() : null)
				);

				$message = sprintf('%1$s<br/>The plugin cannot be activated!<br/><br/>
					<a href="%2$s">Go Back</a>',
					$notice,
					admin_url($screen && $screen->id === 'plugins' ? 'plugins.php' : '')
				);

				add_action('admin_notices', function() use($file, $notice) {
			        printf('<div class="notice notice-error"><p>%1$s</p></div>', $notice);
					deactivate_plugins($file, true);
				});

				register_activation_hook($file, function() use($message) {
					wp_die($message);
				});

				return false;
			}
			return true;
		}
	}
}

// load Zukit classes if they not were loaded in other plugin/theme
if(Zukit::should_load()) {
	require_once('zukit-plugin.php');

	if(!function_exists('zu_snippets')) {
		require_once('snippets/hub.php');
	}
}
