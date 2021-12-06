<?php
trait zusnippets_Lang {

    private $support_multilang = null;

    // Language functions -----------------------------------------------------]

	public function is_multilang() {
		global $q_config;

		if(is_null($this->support_multilang)) {
			$this->support_multilang = defined('QTRANSLATE_FILE') && isset($q_config) ? true : false;
		}
		return $this->support_multilang;
	}

	public function get_lang($default_lang = '') {
		global $q_config;

		return $this->is_multilang() ? $q_config['language'] : $default_lang;
	}

	public function get_all_languages($keep_unsorted = false, $only_codes = true) {
		global $q_config;

		if(!$this->is_multilang()) return [];

		$languages = [];
		$language = $q_config['language'];

		foreach($q_config['enabled_languages'] as $lang) {

			$languages[$lang]['name'] = $q_config['language_name'][$lang];
			$languages[$lang]['code'] = $lang;
			$languages[$lang]['active'] = ($lang == $language) ? true : false;
		}

		if($keep_unsorted) return $languages;

		$sorted_languages = array_values($languages);
		// sort so active language will be on top
		usort($sorted_languages, function($a, $b) { return $b['active'] <=> $a['active'];});

		$languages = $keep_unsorted ? $languages : $sorted_languages;

		return $only_codes ? wp_list_pluck($languages, 'code') : $languages;
	}

	public function convert_lang_url($url, $code = null) {
		return $this->is_multilang() ? apply_filters('translate_url', $url, $code) : $url;
	}

	public function convert_lang_text($text, $code = null) {
		return $this->is_multilang() ? apply_filters('translate_text', $text, $code, 0) : $text;
	}
}
