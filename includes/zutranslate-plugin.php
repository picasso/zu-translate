<?php
// Includes all traits --------------------------------------------------------]

include_once('traits/ajax.php');
include_once('traits/qtx.php');
include_once('traits/gutenberg.php');
include_once('traits/shortcode.php');

class zu_Translate extends zukit_Plugin  {

	// Plugin addons
	private $folders = null;
	private $dominant = null;
	private $sizes = null;
	// private $clean = null;

	// qT-XT helpers, shortcodes, REST API and 'Gutenberg' support
	use zu_TranslateQT, zu_TranslateAjax, zu_TranslateGutenberg, zu_TranslateShortcode;

	protected function config() {
		return  [
			'prefix'			=> 'zutranslate',
			'zukit'				=> true,

			'translations'		=> [
				'path'				=> 'lang',
				'domain'			=> 'zu-translate',
			],

			'appearance'		=> [
				'colors'			=> [
					'backdrop'			=> '#fceff1',
					'header'			=> '#fbb0b8',
					'title'				=> '#662930',
				],
			],

			'options'			=> [
				'flags'				=> false,
				'yseo'				=> false,
				'media_details'		=> false,
				'gutenberg'			=> true,
				'blockeditor'		=> [
					'supported'			=> [],			// see 'traits/gutenberg.php'
					'excluded'			=> [], 			// see 'traits/gutenberg.php'
					'sync'				=> true,
				],
				'switcher'			=> [
					'frontend'			=> true,
					'menu'				=> true,
					'display'			=> 'lang',
				],
			],

			// some data for the Settings Page
	         'settings_script'	=> [
	             'data'  			=> [$this, 'settings_js_data'],
	         ],

			'blocks'			=> [
				'namespace'			=> 'zu',
				'blocks'			=> [$this, 'blocks_enabled'],
				'frontend_blocks'	=> false,
				'load_css'          => true,
				'script'			=> [
					'data'				=> [$this, 'blocks_js_data'],
				]
			],
		];
	}

	protected function extend_metadata($metadata) {
		$metadata['description'] = 'Enhances **qTranslate-XT** with some features and `Gutenberg` support (WordPress Block Editor).';
		return $metadata;
	}

	protected function extend_info() {
		return $this->qtx_info();
	}

	protected function extend_actions() {
		// return [
		// 	[
		// 		'label'		=> __('Update Dominants', 'zu-media'),
		// 		'value'		=> 'zumedia_update_dominants',
		// 		'icon'		=> 'admin-customizer',
		// 		'color'		=> 'gold',
		// 		'help'		=> __('Dominant Colors will be updated for all existing images'
		// 							.' in Media Library if you press this button.', 'zu-media'),
		// 		// the button will be visible only if this option is 'true'
		// 		'depends'	=> 'dominant',
		// 	],
		// 	[
		// 		'label'		=> __('Clean All Cached Data', 'zu-media'),
		// 		'value'		=> 'zumedia_reset_cached',
		// 		'icon'		=> 'dismiss',
		// 		'color'		=> 'magenta',
		// 		'help'		=> __('Clear all cached data referenced to attachments, galleries and folders.'
		// 							.' Needs if you added gallery or folder.', 'zu-media'),
		// 		'depends'	=> '!disable_cache',
		// 	],
		// 	[
		// 		'label'		=> __('Flush Rewrite Rules', 'zu-media'),
		// 		'value'		=> 'zumedia_flush_rewrite',
		// 		'icon'		=> 'superhero',
		// 		'color'		=> 'blue',
		// 		'help'		=> __('Remove rewrite rules and then recreate rewrite rules.'
		// 							.' Needs if you redefined tag or category rewrite rules.', 'zu-media'),
		// 		'depends'	=> ['zumedia_folders_options.add_rewrite', 'add_tags', 'add_category'],
		// 	],
		// ];
	}

	protected function extend_debug_options() {
		// return [
		// 	'show_id'	=> [
		// 		'label'		=> __('Display Attachment Id', 'zu-media'),
		// 		'value'		=> false,
		// 	],
		// ];
	}

	protected function extend_debug_actions() {
		// return $this->folders ? [
		// 	[
		// 		'label'		=> __('Fix Orphaned Attachments', 'zu-media'),
		// 		'value'		=> 'zumedia_fix_orphaned',
		// 		'icon'		=> 'hammer',
		// 		'color'		=> 'blue',
		// 	],
		// 	[
		// 		'label'		=> __('Check Existed Terms', 'zu-media'),
		// 		'value'		=> 'zumedia_check_terms',
		// 		'icon'		=> 'warning',
		// 		'color'		=> 'gold',
		// 	],
		// ] : [];
	}

	// Actions & Add-ons ------------------------------------------------------]

	public function init() {

		// // Media Folders Addon
		// if($this->is_option('folders')) {
		// 	$this->folders = $this->register_addon(new zu_TranslateFolder());
		// }

		// Some internal 'inits' ----------------------------------------------]

		$this->init_qtx_support();
		$this->init_gutenberg_support();
		$this->register_snippets();
		$this->add_shortcoses();
	}

	// Custom menu position ---------------------------------------------------]

	protected function custom_admin_submenu() {

		return [
			'reorder'	=>	[
				[
					'menu'				=> 	'qtranslate-xt',
					'after_index2'		=>	'zuplus-settings',
				],
				[
					'menu'				=> 	'zutranslate-settings',
					'after_index'		=>	'qtranslate-xt',
				],
			],
			'separator'	=>	[
				[
					'before_index'		=> 	'qtranslate-xt',
				],
			],
		];
	}

	// Script enqueue ---------------------------------------------------------]

	protected function should_load_css($is_frontend, $hook) {
		return $is_frontend === false && $this->ends_with_slug($hook);
	}

	protected function should_load_js($is_frontend, $hook) {
		return $is_frontend === false && $this->ends_with_slug($hook);
	}

	protected function enqueue_more($is_frontend, $hook) {
		// always add styles only for Settings Page (needed for Folders Preview)
		// we cannot do this in the add-on, since if it is not created (because
		// the 'folders' option is disabled), then the styles will not be loaded

		// if(!$is_frontend && $this->ends_with_slug($hook)) {
		// 	$this->admin_enqueue_style('zumedia-folders');
		// }
	}

	public function settings_js_data($is_frontend = true) {
		return $is_frontend ? null : array_merge([
				'locale'	=> get_locale(),
				'disabled'	=> !$this->is_multilang(),
			],
			$this->qtx_data(),
			$this->gutenberg_data(true)
		);
	}

	// Custom blocks helpers --------------------------------------------------]

	public function blocks_js_data() {
		return $this->gutenberg_data();
	}

	public function blocks_enabled() {
		// the block name can be any, since we do not create a block, only hooks
		return $this->is_option('gutenberg') ? ['hooks_only'] : null;
	}


	// Public snippets --------------------------------------------------------]

	private function register_snippets() {
		$this->register_snippet('get_dominant_by_id', $this->dominant, $this->snippets('get_default_background_color'));
		$this->register_snippet('update_dominant_by_id', $this->dominant, false);
		$this->register_snippet('media_size_full_key', $this->sizes, 'full');

		$this->register_snippet('get_folders', $this->folders, null);
		$this->register_snippet('get_folder', $this->folders, null);
		$this->register_snippet('get_folder_props', $this->folders, null);
		$this->register_snippet('get_folder_by_attachment_id', $this->folders, null);

		$this->register_snippet('get_location');
		$this->register_snippet('get_media_taxonomy_link');
	}
}

// Entry Point ----------------------------------------------------------------]

function zutranslate($file = null) {
	return zu_Translate::instance($file);
}

// Additional Classes & Functions ---------------------------------------------]

// require_once('addons/dominant-color.php');
// require_once('media-folders/zumedia-folders.php');
