<?php

// Plugin Admin Trait ---------------------------------------------------------]

trait zukit_Admin {

	// The Zukit's plugin instance is stored in a static property. This property is
	// an array, because we need to identify the plugin that currently uses the REST API.
	private static $zukit_items = [];

	protected $min_php_version = '7.0.0';
	protected $min_wp_version = '5.0.0';
	protected $ops;

	public function admin_config($file, $options = []) {

		$defaults = [
			'hook' 			=>	'options-general.php',
			'title' 		=>	sprintf('%2$s %1$s', __('Options', 'zu-plugin'), $this->data['Name'] ?? 'unknown'),
			'menu' 			=>	$this->data['Name'] ?? 'unknown',
			'permissions' 	=>	'manage_options',
			'slug' 			=>	$this->prefix.'-settings',
		];

		$this->ops = array_merge($defaults, $options);

		// if Zukit is requred then add the admin slug and class instance to the static property
		if($this->config['zukit']) self::$zukit_items[$this->ops['slug']] = $this;

		// Activation Hooks ---------------------------------------------------]

		register_activation_hook($file, function() {
			global $wp_version;

			$deactivate = function() { deactivate_plugins(plugin_basename($file)); };
			$plugin_name = $this->data['Name'];

			if(version_compare(phpversion(), $this->min_php_version, '<')) {
				add_action('update_option_active_plugins', $deactivate);
				wp_die(sprintf(
					'%1$s required PHP at least %3$s.*. %1$s was deactivated. <a href="%2$s">Go Back</a>',
					$plugin_name,
					admin_url()),
					explode('.', $this->min_php_version)[0]
				);
			}
			if(version_compare($wp_version, $this->min_wp_version, '<')) {
				add_action('update_option_active_plugins', $deactivate);
				wp_die(sprintf(
					'%1$s required Wordpress at least %3$s.*. %1$s was deactivated. <a href="%2$s">Go Back</a>',
					$plugin_name,
					admin_url()),
					explode('.', $this->min_wp_version)[0]
				);
			}
			$this->on_activation();
		});

		register_deactivation_hook($file, function() {
			delete_option($this->options_key);
			$this->clean_addons();
			$this->on_deactivation();
		});

		add_action('admin_init', function() {
			register_setting($this->options_key.'_group', $this->options_key, []);
			$this->snippets('add_admin_body_class', 'zukit-settings');
		});

		add_action('admin_menu', [$this, 'admin_menu']);
		add_filter('plugin_action_links_'.plugin_basename($file), [$this, 'admin_settings_link']);


	}

	protected function on_activation() {}
	protected function on_deactivation() {}

	protected function extend_info() { return (object)null;}
	protected function extend_debug_actions($actions) { return $actions;}

	// Wordpress Admin Page ---------------------------------------------------]

	protected function info() {
		// $more_info = $this->extend_info();
		// apply_filters('zukit_plugin_info', (object) null);
		return [
			'version'		=> $this->version,
			'title'			=> $this->data['Name'],
			'author'		=> $this->data['AuthorName'],
			'link'			=> preg_replace('/.*href="([^\"]+).*/ims', '$1', $this->data['Author']),
			'description'	=> preg_replace('/<cite>.+<\/cite>/i', '', $this->data['Description']),
			'icon'			=> $this->config['icon'],
			'more' 			=> $this->extend_info(),
		];
	}

	protected function debug_actions() {
		return $this->extend_debug_actions([
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
		]);
		// return $debug_actions === false ? [] : array_merge([
		// 		[
		// 			'label'		=> __('Clear Debug Log', 'zu-plugin'),
		// 			'value'		=> 'clear_log',
		// 			'icon'		=> 'trash',
		// 			'color'		=> 'error',
		// 		],
		// 		[
		// 			'label'		=> __('Test Ajax', 'zu-plugin'),
		// 			'value'		=> 'test_ajax',
		// 			'icon'		=> 'dashboard',
		// 			'color'		=> 'green',
		// 		],
		// 	], $debug_actions);
	}

	public function admin_slug() {
		return $this->ops['slug'];
	}

	public function ends_with_slug($hook, $slug = null) {
		$slug = is_null($slug) ? $this->admin_slug() : $slug;
		return substr($hook, -strlen($slug)) === $slug;
	}

	private function is_zukit_slug($hook) {
		foreach(array_keys(self::$zukit_items) as $zukit_slug) {
			// if $zukit_slug is the current admin_slug() and $hook ends with $zukit_slug
			if($zukit_slug === $this->admin_slug() && $this->ends_with_slug($hook, $zukit_slug)) return true;
		}
		return false;
	}

	private function instance_by_slug($slug) {
		return self::$zukit_items[$slug] ?? null;
	}

	public function admin_menu() {
		$hook_suffix = add_submenu_page(
			$this->ops['hook'],
			$this->ops['title'],
			$this->ops['menu'],
			$this->ops['permissions'],
			$this->admin_slug(),
			[$this, 'render_admin_page']
		);

		if($hook_suffix == false) return false;
	}

	public function render_admin_page() {
		printf( '<div id="%1$s" class="block-editor__container"></div>', $this->prefix);
	}

	public function admin_settings_link($links) {
		$settings_link = sprintf(
			'<a href="%1$s%2$s?page=%3$s">%4$s</a>',
			get_admin_url(),
			$this->ops['hook'],
			$this->admin_slug(),
			__('Settings', 'textdomain')
		);
		array_unshift($links, $settings_link);
		return $links;
	}
}
