<?php
// qTranslate-XT admin support & utils
// NOTE: еще не портировано после перехода на 'Zukit'

class zu_TranslateQTXT extends zukit_Addon {

	private $qtx_seo = null;

	protected function construct_more() {

		add_action('admin_enqueue_scripts', [$this, 'post_admin_style']);
		add_filter('i18n_admin_config',[$this, 'admin_page_config']);

		if($this->check_option('qtxseo')) $qtx_seo = new tplus_QTX_SEO($this->config_addon());
		if(!$this->check_option('flags')) zu()->add_admin_body_class('qtx-flags-disabled');
		if($this->check_option('media_details')) zu()->add_admin_body_class('qtx-media-enabled');
	}

	// Adds some JS & CSS for qTranslateX ----------------------------------------]

	public function post_admin_style($hook) {
		$this->enqueue_style('tplus-admin-qtx', ['qtranslate-admin-style']);
	}

	public function admin_page_config($page_configs) {

		$filename = tplus_get_my_dir() . '/i18n-config.json';
		if(!file_exists($filename)) return $page_configs;
		if(isset($page_configs['translate-plus'])) return $page_configs;

		$config_json = file_get_contents($filename);
		if($config_json) {
			$config = json_decode($config_json, true);
			if(!empty($config) && is_array($config) && isset($config['admin-config'])) {
				$page_configs = qtranxf_merge_config($page_configs, $config['admin-config']);
			}
		}

// 	_dbug_log('json_encode($page_configs)=', json_encode($page_configs));

		return $page_configs;
	}

	public function get_lang() {
		global $_default_lang;
		return function_exists('qtranxf_getLanguage') ? qtranxf_getLanguage() : (empty($_default_lang) ? 'en' : $_default_lang);
	}
}

// QTX + WPSEO support --------------------------------------------------------]

class tplus_QTX_SEO extends zuplus_Addon {

	private $seo_post_types;

	protected function construct_more() {

		$post_types = $this->get_config('types');
		$seo_post_types = empty($post_types) ? array_values(array_diff(get_post_types(['public' => true], 'names'), ['attachment', 'project'])) : $post_types;
		add_action( 'admin_init',  [$this, 'setup_column_hooks']);
		add_action('save_post', [$this, 'save_meta_box'], 10, 3);
		zu()->add_admin_body_class('qtx-seo-enabled');
	}

	public function add_meta_box() {

		add_meta_box(
		    'qtx_seo_value',
		    'qtx SEO',
		    [$this, 'display_meta_box'],
		    $this->seo_post_types,
		    'normal'
		);
	}

	public function display_meta_box($post) {

	    wp_nonce_field(basename(__TPLUS_FILE__), 'qtx_seo_nonce');

		printf('
	    	<input type="hidden" id="qtx_seo_score" name="qtx_seo_score" value="%1$s">
	    	<input type="hidden" id="qtx_seo_content_score" name="qtx_seo_content_score" value="%2$s">',
			get_post_meta($post->ID, 'qtx_seo_score', true),
			get_post_meta($post->ID, 'qtx_seo_content_score', true)
		);
	}

	public function save_meta_box($post_id, $post, $update) {

	    if(!isset($_POST['qtx_seo_nonce']) || !wp_verify_nonce($_POST['qtx_seo_nonce'], basename(__TPLUS_FILE__))) return $post_id;
	    if(defined("DOING_AUTOSAVE") && DOING_AUTOSAVE) return $post_id;
		if(!in_array($post->post_type, $this->seo_post_types)) return $post_id;

	    $qtx_seo_score = $qtx_seo_content_score = '';
	    if(isset($_POST['qtx_seo_score'])) $qtx_seo_score = $_POST['qtx_seo_score'];
	    if(isset($_POST['qtx_seo_content_score'])) $qtx_seo_content_score = $_POST['qtx_seo_content_score'];

	    update_post_meta($post_id, 'qtx_seo_score', $qtx_seo_score);
	    update_post_meta($post_id, 'qtx_seo_content_score', $qtx_seo_content_score);
	}

	public function setup_column_hooks() {

		add_action('add_meta_boxes',  [$this, 'add_meta_box']);

		foreach($this->seo_post_types as $pt) {
				add_filter('manage_' . $pt . '_posts_columns', [$this, 'column_heading'], 10, 1);
				add_action('manage_' . $pt . '_posts_custom_column', [$this, 'column_content'], 10, 2);
		}
	}

	public function column_heading($columns) {
		return array_merge($columns, ['qtx_seo' => 'qtx_SEO']);
	}

	public function column_content($column_name, $post_id) {

		if($column_name === 'qtx_seo') {
			$qtx_seo_score = get_post_meta($post_id, 'qtx_seo_score', true);
			$qtx_seo_content_score = get_post_meta($post_id, 'qtx_seo_content_score', true);
			printf(
				'<span class="qtx_seo_score" aria-hidden="true">%1$s</span>
				<span class="qtx_seo_content_score" aria-hidden="true">%2$s</span>',
				$qtx_seo_score,
				$qtx_seo_content_score
			);
		}
	}
}
