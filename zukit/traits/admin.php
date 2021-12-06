<?php

// Plugin Admin Trait ---------------------------------------------------------]

trait zukit_Admin {

	// The Zukit's plugin instance is stored in a static property. This property is
	// an array, because we need to identify the plugin that currently uses the REST API.
	private static $zukit_items = [];
	protected $ops;

	public function admin_config($file, $options = []) {

		$defaults = [
			'hook' 			=>	'options-general.php',
			'title' 		=>	sprintf('%2$s %1$s', __('Options', 'zukit'), $this->data['Name'] ?? 'unknown'),
			'menu' 			=>	$this->data['Name'] ?? 'unknown',
			'permissions' 	=>	'manage_options',
			'slug' 			=>	$this->prefix.'-settings',
		];

		$this->ops = array_merge($defaults, $options);

		// if Zukit is requred then add the admin slug and class instance to the static property
		if($this->get('zukit')) self::$zukit_items[$this->ops['slug']] = $this;

		// Activation/Deactivation Hooks --------------------------------------]

		register_activation_hook($file, function() {
			$this->on_activation();
		});

		register_deactivation_hook($file, function() {
			delete_option($this->options_key);
			$this->clean_addons();
			$this->on_deactivation();
		});

		add_action('admin_init', function() {
			register_setting($this->options_key.'_group', $this->options_key, []);
		});

		// add 'zukit-settings' class for Settings page only
		add_action('admin_enqueue_scripts', function($hook) {
			if($this->ends_with_slug($hook)) {
				$this->snippets('add_admin_body_class', 'zukit-settings');
			}
		});

		add_action('admin_menu', [$this, 'admin_menu']);
		add_filter('plugin_action_links_'.plugin_basename($file), [$this, 'admin_settings_link']);
	}

	protected function on_activation() {}
	protected function on_deactivation() {}
	protected function extend_info() { return (object)null;}
	protected function extend_actions() { return (object)null;}

	// Wordpress Admin Page ---------------------------------------------------]

	public function info() {
		$defaultFill = '?';
		$expectedKeys = ['AuthorURI', 'Description', 'Name', 'Author', 'URI', 'GitHubURI'];
		$data = array_merge(array_combine(
		    $expectedKeys,
		    array_fill(0, count($expectedKeys), $defaultFill)),
  			$this->data
		);
		$domain = $this->text_domain();
		$github = preg_replace('/\.git$/', '', $data['GitHubURI']);

		return [
			'version'		=> $this->version,
			// yes, I know that should not use a variable as a text string
			// 'Poedit' will pull these strings from the plugin description
			'title'			=> __($data['Name'], $domain),
			'author'		=> __($data['Author'], $domain),
			'link'			=> __($data['AuthorURI'], $domain),
			'description'	=> __($data['Description'], $domain),
			'uri'			=> $data['URI'],
			'github'		=> $github ?: $defaultFill,
			'icon'			=> $this->get('appearance.icon'),
			'colors'		=> $this->get('appearance.colors'),
			'more' 			=> $this->extend_info(),
		];
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

	protected function instance_by_router($router = null) {
		// $router is $this->admin_slug()
		return is_null($router) ? self::$zukit_items : (self::$zukit_items[$router] ?? null);
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

	public function admin_settings_link($links, $as_array = false) {
		$href = sprintf(
			'%1$s%2$s?page=%3$s',
			get_admin_url(),
			$this->ops['hook'],
			$this->admin_slug()
		);
		$title = __('Settings', 'zukit');
		if($as_array) return [$href, $title];

		$settings_link = sprintf('<a href="%1$s">%2$s</a>', $href, $title);
		array_unshift($links, $settings_link);
		return $links;
	}
}
