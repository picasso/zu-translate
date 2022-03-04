<?php

// 'qTranslate-XT' helpers ----------------------------------------------------]

trait zu_TranslateQT {

	private $is_multilang = null;
	private $lang_config = null;
	private $qtx_version = false;
	private $qtx_link = 'https://github.com/qtranslate/qtranslate-xt/';
	private $qtx_type_excluded = null;

	private function init_qtx_support() {
		$qt_config = $this->get_qt_config();
		$this->is_multilang = $this->is_installed_qtranslate() && !empty($qt_config);
		if($this->is_multilang) {
			$this->qtx_version = defined('QTX_VERSION') ? QTX_VERSION : false;
			$config = [];
			foreach($qt_config['enabled_languages'] as $lang) {
				$config[$lang]['code'] = $lang;
				$config[$lang]['name'] = $qt_config['language_name'][$lang];
				$config[$lang]['flag'] = $qt_config['flag'][$lang];
				$config[$lang]['locale'] = $qt_config['locale'][$lang];
				$config[$lang]['locale_html'] = $qt_config['locale_html'][$lang];
				$config[$lang]['active'] = ($lang === $qt_config['language']);
			}
			$this->lang_config = $config;
		}
	}

	public function is_multilang() {
		return $this->is_multilang;
	}

	public function get_lang($detailed = false) {
		if(!$this->is_multilang()) return $detailed ? [] : '';

		$qt_config = $this->get_qt_config();
		$code = $qt_config['language'];
		return $detailed ? [
			'code'		=> $code,
			'locale'	=> $qt_config['locale'][$code],
			'name'		=> $qt_config['language_name'][$code],
			'flag'		=> $this->sprintf_uri('%s%s', $qt_config['flag_location'] ?? '', $qt_config['flag'][$code]),
		] : $code;
	}

	public function get_all_languages($sorted = true) {
		$languages = $this->is_multilang() ? $this->lang_config : [];
		// sort so active language will be on top
		if($sorted) usort($languages, function($a, $b) { return $b['active'] <=> $a['active']; });
		return $languages;
	}

	public function get_all_codes($sorted = true) {
		$languages = $this->get_all_languages($sorted);
	    return array_map(function($a) { return $a['code']; }, $languages);
	}

	public function convert_text($text, $lang = null, $flags = 0) {
		return apply_filters('translate_text', $text, $lang, $flags);
	}

	public function convert_url($url, $lang = null) {
		return apply_filters('translate_url', $url, $lang);
	}

	public function convert_term($term, $lang = null, $taxonomy = null) {
		return apply_filters('translate_term', $term, $lang, $taxonomy);
	}

	protected function get_urls_for_id($post_id = null) {
		$lang_urls = [];
		foreach($this->get_all_codes() as $code) {
			$lang_urls[$code] = $this->convert_url(get_permalink($post_id), $code);
		}
		return $lang_urls;
	}

	protected function get_url_param($param = null) {
		$qt_url_info = $this->get_qt_config('url_info');
		return $param ? ($qt_url_info[$param] ?? null) : $qt_url_info;
	}


	////////////////////////////////////////////////////////////////////////////
	// это пока не восстановлено после перехода на Zukit

	// return array of content for all languages
	protected function  get_content($raw_content) {
		$qt_config = $this->get_qt_config();
		if(empty($qt_config) || !function_exists('qtranxf_gettext')) return $raw_content;

		$raw_contents = [];
		$keep_lang = $qt_config['language'];
		foreach($qt_config['enabled_languages'] as $lang) {
			// set language
			$qt_config['language'] = $lang;
			$raw_contents[$lang] = qtranxf_gettext($raw_content);
		}
		// restore saved language
		$qt_config['language'] = $keep_lang;
		return $raw_content;
	}

	// return array of cut content for all languages
	protected function  cut_content($raw_content, $amount = 150) {
		$qt_config = $this->get_qt_config();
		if(empty($qt_config) || !function_exists('qtranxf_gettext')) return zu()->cut_content($raw_content, $amount);

		$raw_contents = [];
		$contents = [];

		$keep_lang = $qt_config['language'];
		foreach($qt_config['enabled_languages'] as $lang) {
			// set language
			$qt_config['language'] = $lang;
			$raw_contents[$lang] = qtranxf_gettext($raw_content);
			$contents[$lang] = zu()->cut_content($raw_contents[$lang], $amount);
		}
		// restore saved language
		$qt_config['language'] = $keep_lang;

		foreach($contents as $lang => $cut_content) {
			$raw_content = str_replace($raw_contents[$lang], $cut_content, $raw_content);
		}
		return $raw_content;
	}

	// return array of modified content for all languages
	protected function  modify_content($raw_content, $prefix = '', $suffix = '', $replace = []) {
		$qt_config = $this->get_qt_config();
		if(empty($qt_config) || !function_exists('qtranxf_gettext')) return zu()->modify_content($raw_content, $prefix, $suffix, $replace);

		$raw_contents = [];
		$contents = [];

		$c_lang = $qt_config['language'];
		foreach($qt_config['enabled_languages'] as $lang){
			// set language
			$qt_config['language'] = $lang;
			$raw_contents[$lang] = qtranxf_gettext($raw_content);
			$contents[$lang] = zu()->modify_content($raw_contents[$lang], $prefix, $suffix, $replace);
		}
		// restore saved language
		$qt_config['language'] = $c_lang;

		foreach($contents as $lang => $mod_content) {
			$raw_content = str_replace($raw_contents[$lang], $mod_content, $raw_content);
		}
		return $raw_content;
	}

	////////////////////////////////////////////////////////////////////////////

	// internal helpers -------------------------------------------------------]

	private function is_installed_qtranslate() {
		return defined('QTRANSLATE_FILE');
	}

	private function get_qt_config($key = null) {
		global $q_config;
		return is_null($key) ? ($q_config ?? null) : ($q_config[$key] ?? null);
	}

	private function set_qt_config($key = null, $value = null) {
		global $q_config;
		if($q_config ?? null) {
			if(is_null($key)) $q_config = $value;
			else $q_config[$key] = $value;
		}
	}

	private function get_qt_config_excluded() {
		return $this->qtx_type_excluded ?? $this->get_qt_config('post_type_excluded') ?? [];
	}

	private function reset_qt_config_excluded($excluded, $current_post_type) {
		$this->qtx_type_excluded = $this->get_qt_config('post_type_excluded');
		if(!in_array($current_post_type, $excluded)) $excluded[] = $current_post_type;
		$this->set_qt_config('post_type_excluded', $excluded);
	}

	private function qtx_data($settings_data = false) {
		$content_url = trailingslashit(wp_normalize_path(dirname(WP_PLUGIN_URL)));
		return $settings_data ? [
			'qtxlink' => $this->qtx_link,
			'qtxlangs' => $this->get_all_languages(),
		] : [
			'config'	=> $this->lang_config,
			'location'	=> $content_url . $this->get_qt_config('flag_location') ?? '',
			'format'	=> $this->is_installed_qtranslate() ? QTX_LANG_CODE_FORMAT : '',
		];
	}

	private function qtx_info() {
		$languages = $this->get_all_codes();
		return [
			'qtx_link'		=> [
					'label'		=> __('Dependency', 'zu-translate'),
					'value'		=> 'qTranslate-XT',
					'link'		=> $this->qtx_link,
			],
			'qtx_version'	=> [
					'label'		=> __('qTranslate-XT version', 'zu-translate'),
					'value'		=> $this->is_multilang() ? $this->qtx_version : __('Inactive', 'zu-translate'),
			],
			'qtx_languages'	=> [
					'label'		=> __('Enabled languages', 'zu-translate'),
					'value'		=> implode(' ', array_map(function($l) { return sprintf('`%s`', strtoupper($l)); }, $languages)),
			],
		];
	}
}
