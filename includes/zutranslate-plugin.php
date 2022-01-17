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
			// always load default options
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
				'list'				=> false,
				'yseo'				=> false,
				'media_details'		=> false,
				'gutenberg'			=> true,
				'blockeditor'		=> [
					'custom'			=> [],			// see 'traits/gutenberg.php'
					'excluded'			=> [], 			// see 'traits/gutenberg.php'
					'sync'				=> true,
					'session'			=> true,
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
		$metadata['description'] = str_replace('qTranslate-XT', '**qTranslate-XT**', $metadata['description']);
		$metadata['description'] = str_replace('Gutenberg', '`Gutenberg`', $metadata['description']);
		return $metadata;
	}

	protected function extend_info() {
		return $this->qtx_info();
	}

	protected function extend_actions() {
		// return [
		// 	[
		// 		'label'		=> __('Clean All Cached Data', 'zu-translate'),
		// 		'value'		=> 'zumedia_reset_cached',
		// 		'icon'		=> 'dismiss',
		// 		'color'		=> 'magenta',
		// 		'help'		=> __('Clear all cached data referenced to attachments, galleries and folders.'
		// 							.' Needs if you added gallery or folder.', 'zu-translate'),
		// 		'depends'	=> '!disable_cache',
		// 	],
		// 	[
		// 		'label'		=> __('Flush Rewrite Rules', 'zu-translate'),
		// 		'value'		=> 'zumedia_flush_rewrite',
		// 		'icon'		=> 'superhero',
		// 		'color'		=> 'blue',
		// 		'help'		=> __('Remove rewrite rules and then recreate rewrite rules.'
		// 							.' Needs if you redefined tag or category rewrite rules.', 'zu-translate'),
		// 		'depends'	=> ['zumedia_folders_options.add_rewrite', 'add_tags', 'add_category'],
		// 	],
		// ];
	}

	protected function extend_debug_options() {
		return [
			'edit_lang'	=> [
				'label'		=> __('Enable logging in `EditLang`', 'zu-translate'),
				'value'		=> false,
			],
			'raw_store'	=> [
				'label'		=> __('Enable logging in `Raw Store`', 'zu-translate'),
				'value'		=> false,
			],
			'raw_helpers'	=> [
				'label'		=> __('Enable logging in `Raw Helpers`', 'zu-translate'),
				'value'		=> false,
			],
			'edited_entity' => [
				'label'		=> __('Enable logging in `Entity`', 'zu-translate'),
				'value'		=> false,
			],
			'post_saving'	=> [
				'label'		=> __('Enable logging in `Post Saving`', 'zu-translate'),
				'value'		=> false,
			],
		];
	}

	protected function extend_debug_actions() {
		// return $this->folders ? [
		// 	[
		// 		'label'		=> __('Fix Orphaned Attachments', 'zu-translate'),
		// 		'value'		=> 'zumedia_fix_orphaned',
		// 		'icon'		=> 'hammer',
		// 		'color'		=> 'blue',
		// 	],
		// 	[
		// 		'label'		=> __('Check Existed Terms', 'zu-translate'),
		// 		'value'		=> 'zumedia_check_terms',
		// 		'icon'		=> 'warning',
		// 		'color'		=> 'gold',
		// 	],
		// ] : [];
	}

	protected function construct_more() {
		add_filter('qtranslate_admin_config', [$this, 'update_qtx_config']);
		// $this->get_all_registered_blocks();
	}

	public function update_qtx_config($admin_config) {
// zu_log($admin_config);
		if($this->is_option('gutenberg')) {
			unset($admin_config['post']);
		}
		if($this->is_option('list')) {
			$admin_config['edit'] = [
				'pages'		=> ['edit.php' => ''],
				// there is no way to indicate that 'qTranslate-XT' plugin do not need to create a language wrap by an anchor
				// so we use an existing 'id' and a non-existing 'where' modifier
			    'anchors'	=> ['the-list' => ['where' => 'none']],
				'js-exec'	=> ['zutranslate-edit-list'  => [
					'src'		=> $this->get_full_filepath('zutranslate-exec-edit'),
			 	]],
			];
		}
		return $admin_config;
	}

	// Actions & Add-ons ------------------------------------------------------]

	public function init() {

		// // Media Folders Addon
		// if($this->is_option('folders')) {
		// 	$this->folders = $this->register_addon(new zu_TranslateFolder());
		// }

		// add our classes to the body class

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
					'menu'		=> 'qtranslate-xt',
					'after'		=> 'zumedia-settings',
				],
				[
					'onfail'	=> true,
					'menu'		=> 'qtranslate-xt',
					'after'		=> 'options-privacy.php',
				],
				[
					'menu'		=> 'zutranslate-settings',
					'after'		=> 'qtranslate-xt',
				],
			],
			'separator'	=>	[
					'before'	=> 	'qtranslate-xt',
					'after'		=> 	'zutranslate-settings',
			],
		];
	}

	// Script/Style enqueue ---------------------------------------------------]

	protected function should_load_css($is_frontend, $hook) {
		return $is_frontend === false && $this->ends_with_slug($hook);
	}

	protected function should_load_js($is_frontend, $hook) {
		return $is_frontend === false && $this->ends_with_slug($hook);
	}

	protected function enqueue_more($is_frontend, $hook) {
		// add styles for custom button appearance and more
		if(!$is_frontend && $this->need_common_admin_css($hook)) {
			$this->admin_enqueue_style('zutranslate-common');
		}
	}

	public function settings_js_data($is_frontend = true) {
		return $is_frontend ? null : array_merge([
				'locale'	=> get_locale(),
				'disabled'	=> !$this->is_multilang(),
			],
			$this->qtx_data(true),
			$this->gutenberg_data(true)
		);
	}

	private function need_common_admin_css($hook) {
		return !$this->ends_with_slug($hook) && (
			$this->is_option('flags') === false ||
			$this->is_option('appearance') ||
			$this->is_option('list')
		);
	}

	// Custom blocks helpers --------------------------------------------------]

	public function blocks_js_data() {
		return array_merge(
			$this->qtx_data(),
			$this->gutenberg_data()
		);
	}

	public function blocks_enabled() {
		// the block name can be any, since we do not create a block, only hooks
		return $this->is_installed_qtranslate() && $this->is_option('gutenberg') ? ['hooks_only'] : null;
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

		$this->register_snippet('register_translated_blocks');
	}
}

// Entry Point ----------------------------------------------------------------]

function zutranslate($file = null) {
	return zu_Translate::instance($file);
}

// Public methods -------------------------------------------------------------]

function zutrans_is_multilang() {
	return zutranslate()->is_multilang();
}

function zutrans_register_translated_blocks($blocks) {
	return zutranslate()->register_translated_blocks();
}

function zutrans_get_all_languages($sorted = true) {
	return zutranslate()->get_all_languages($sorted);
}

function zutrans_convert_text($text, $lang = null, $flags = 0) {
	return zutranslate()->convert_text($text, $lang, $flags);
}

function zutrans_convert_url($url, $lang = null, $flags = 0) {
	return zutranslate()->convert_url($url, $lang);
}

// Additional Classes & Functions ---------------------------------------------]

// require_once('addons/???.php');
