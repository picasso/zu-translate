<?php

// 'qTranslate-XT' helpers ----------------------------------------------------]

trait zu_TranslateQT {

	private $is_multilang = null;
	private $lang_config = null;
	private $qtx_version = false;
	private $qtx_link = 'https://github.com/qtranslate/qtranslate-xt/';

	// 		'en' => [
	// 			'admin_name' => "Американский Английский",
	// 			'flag' => "gb.png",
	// 			'locale' => "en_US",
	// 			'locale_html' => "en",
	// 			'name' => "English",
	// 		],
	// 		'ru' => [
	// 			'admin_name' => "Русский",
	// 			'flag' => "ru.png",
	// 			'locale' => "ru_RU",
	// 			'locale_html' => "ru",
	// 			'name' => "Русский",
	// 		],
	// 	],

	private function init_qtx_support() {
		global $q_config;

		$this->is_multilang = defined('QTRANSLATE_FILE') && isset($q_config);
		if($this->is_multilang) {
			$this->qtx_version = defined('QTX_VERSION') ? QTX_VERSION : false;
			$config = [];
			foreach($q_config['enabled_languages'] as $lang) {
				$config[$lang]['code'] = $lang;
				$config[$lang]['name'] = $q_config['language_name'][$lang];
				$config[$lang]['flag'] = $q_config['flag'][$lang];
				$config[$lang]['locale'] = $q_config['locale'][$lang];
				$config[$lang]['locale_html'] = $q_config['locale_html'][$lang];
				$config[$lang]['active'] = ($lang === $q_config['language']);
			}
			$this->lang_config = $config;
		}
	}

	protected function is_multilang() {
		return $this->is_multilang;
	}

	protected function get_lang() {
		global $q_config;
		return $this->is_multilang() ? $q_config['language'] : '';
	}

	protected function get_all_languages($sorted = true) {
		$languages = $this->is_multilang() ? $this->lang_config : [];
		// sort so active language will be on top
		if($sorted) usort($languages, function($a, $b) { return $b['active'] <=> $a['active']; });
		return $languages;
	}

	protected function get_all_codes($sorted = true) {
		$languages = $this->get_all_languages($sorted);
	    return array_map(function($a) { return $a['code']; }, $languages);
	}

	protected function convert_text($text, $lang = null, $flags = 0) {
		return apply_filters('translate_text', $text, $lang, $flags);
	}

	protected function convert_url($url, $lang = null) {
		return apply_filters('translate_url', $url, $lang);
	}

	protected function convert_term($term, $lang = null, $taxonomy = null) {
		return apply_filters('translate_term', $term, $lang, $taxonomy);
	}

	protected function get_urls_for_id($post_id = null) {
		$lang_urls = [];
		foreach($this->get_all_codes() as $code) {
			$lang_urls[$code] = $this->convert_url(get_permalink($post_id), $code);
		}
		return $lang_urls;
	}

	// return array of content for all languages
	protected function  get_content($raw_content) {
		global $q_config;
		if(empty($q_config) || !function_exists('qtranxf_gettext')) return $raw_content;

		$raw_contents = [];
		$keep_lang = $q_config['language'];
		foreach($q_config['enabled_languages'] as $lang) {
			// set language
			$q_config['language'] = $lang;
			$raw_contents[$lang] = qtranxf_gettext($raw_content);
		}
		// restore saved language
		$q_config['language'] = $keep_lang;
		return $raw_content;
	}

	// return array of cut content for all languages
	protected function  cut_content($raw_content, $amount = 150) {
		global $q_config;

		if(empty($q_config) || !function_exists('qtranxf_gettext')) return zu()->cut_content($raw_content, $amount);

		$raw_contents = [];
		$contents = [];

		$keep_lang = $q_config['language'];
		foreach($q_config['enabled_languages'] as $lang) {
			// set language
			$q_config['language'] = $lang;
			$raw_contents[$lang] = qtranxf_gettext($raw_content);
			$contents[$lang] = zu()->cut_content($raw_contents[$lang], $amount);
		}
		// restore saved language
		$q_config['language'] = $keep_lang;

		foreach($contents as $lang => $cut_content) {
			$raw_content = str_replace($raw_contents[$lang], $cut_content, $raw_content);
		}
		return $raw_content;
	}

	// return array of modified content for all languages
	protected function  modify_content($raw_content, $prefix = '', $suffix = '', $replace = []) {
		global $q_config;

		if(empty($q_config) || !function_exists('qtranxf_gettext')) return zu()->modify_content($raw_content, $prefix, $suffix, $replace);

		$raw_contents = [];
		$contents = [];

		$c_lang = $q_config['language'];
		foreach($q_config['enabled_languages'] as $lang){
			$q_config['language'] = $lang; 													// set language
			$raw_contents[$lang] = qtranxf_gettext($raw_content);
			$contents[$lang] = zu()->modify_content($raw_contents[$lang], $prefix, $suffix, $replace);
		}
		$q_config['language'] = $c_lang; 													// restore saved language

		foreach($contents as $lang => $mod_content) {
			$raw_content = str_replace($raw_contents[$lang], $mod_content, $raw_content);
		}
		return $raw_content;
	}

	private function qtx_data() {
		global $q_config;
		return $this->is_multilang() ? [
			'language_config'	=> $this->lang_config,
			'flag_location'		=> $this->sprintf_uri($q_config['flag_location'] ?? ''),
			'qtxlink'			=> $this->qtx_link,
		] : [
			'qtxlink'			=> $this->qtx_link,
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
					'value'		=> implode(' ', array_map(function($l) { return '`'.strtoupper($l).'`'; }, $languages)),
			],
		];
	}
}
