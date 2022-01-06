<?php
// Includes all traits --------------------------------------------------------]

include_once('traits/ajax.php');
include_once('traits/qtx.php');
include_once('traits/gutenberg.php');
include_once('traits/shortcode.php');

class zu_Translate extends zukit_Plugin  {

	// private $clean = null;

	// qT-XT helpers, shortcodes, REST API and 'Gutenberg' support
	use zu_TranslateQT, zu_TranslateAjax, zu_TranslateGutenberg, zu_TranslateShortcode;

	protected function config() {
		return  [
			// всегда загружать дефолтные опции
			// 'debug_defaults'	=> true,

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
				'flags'				=> true,
				'appearance'		=> false,
				'large'				=> false,
				'yseo'				=> false,
				'media_details'		=> false,
				'gutenberg'			=> true,
				'blockeditor'		=> [
					'custom'			=> [],			// see 'traits/gutenberg.php'
					'excluded'			=> [], 			// see 'traits/gutenberg.php'
					'sync'				=> true,
				],
				'switcher'			=> [
					'shortcode_menu'	=> true,
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

		if(!$this->is_option('flags')) {
            $this->snippets('add_admin_body_class', 'zutranslate-noflags');
		}
		if($this->is_option('appearance')) {
            $this->snippets('add_admin_body_class', 'zutranslate-custom-appearance');
			if($this->is_option('large')) {
				$this->snippets('add_admin_body_class', 'zutranslate-custom-large');
			}
		}



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

		if(!$is_frontend && $this->need_common_admin_css($hook)) {
			$this->admin_enqueue_style('zutranslate-common');
		}
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

	private function need_common_admin_css($hook) {
		return !$this->ends_with_slug($hook) && (
			$this->is_option('flags') === false ||
			$this->is_option('appearance')
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
		$this->register_snippet('is_multilang');
		$this->register_snippet('get_lang');
		$this->register_snippet('get_all_languages');
		$this->register_snippet('get_all_codes');

		$this->register_snippet('convert_text');
		$this->register_snippet('convert_url');
		$this->register_snippet('convert_term');
	}
}

// Entry Point ----------------------------------------------------------------]

function zutranslate($file = null) {
	return zu_Translate::instance($file);
}

// Additional Classes & Functions ---------------------------------------------]

// require_once('addons/dominant-color.php');
// require_once('media-folders/zumedia-folders.php');
