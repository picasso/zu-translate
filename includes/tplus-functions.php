<?php

// qTranslate-X functions -----------------------------------------------------]

function tplus_not_multilang() {
	global $_tplus_multilang, $q_config;

	if(is_null($_tplus_multilang)) $_tplus_multilang = defined('QTRANSLATE_FILE') && isset($q_config) ? false : true;
	return $_tplus_multilang;
}

function tplus_all_languages() {
	global $q_config;
	$languages = [];
	if(tplus_not_multilang()) return $languages;
	
	$language = $q_config['language'];

	foreach($q_config['enabled_languages'] as $lang) {
	
		$languages[$lang]['name'] = $q_config['language_name'][$lang];
		$languages[$lang]['code'] = $lang;
		$languages[$lang]['active'] = ($lang == $language) ? true : false;
	}
	return $languages;
}

function tplus_get_lang() {
	global $q_config;
	
	return tplus_not_multilang() ? '' : $q_config['language'];	
}

function tplus_get_all_codes($sorted = true) {
	$codes = tplus_all_languages();
	if($sorted) usort($codes, function($a, $b) { return $b['active'] <=> $a['active'];});		// sort so active language will be on top

    return array_map(function($a) { return $a['code']; }, $codes);
}

function tplus_convert_text($text, $lang = null, $flags = 0) {
	return apply_filters('translate_text', $text, $lang, $flags);
}

function tplus_convert_url($url, $lang = null) {
	return apply_filters('translate_url', $url, $lang);
}

function tplus_convert_term($term, $lang = null, $taxonomy = null) {
	return apply_filters('translate_term', $term, $lang, $taxonomy);
}

function tplus_get_urls_for_id($post_id = null) {
	
	$lang_urls = [];

	foreach(tplus_get_all_codes() as $code) $lang_urls[$code] = tplus_convert_url(get_permalink($post_id), $code);
	return $lang_urls;
}

function  tplus_get_content($raw_content) {		// return array of content for all languages
	global $q_config;

	if(empty($q_config) || !function_exists('qtranxf_gettext')) return $raw_content;

	$raw_contents = [];
	
	$c_lang = $q_config['language'];
	foreach($q_config['enabled_languages'] as $lang) {
		$q_config['language'] = $lang; 													// set language
		$raw_contents[$lang] = qtranxf_gettext($raw_content);
	}
	$q_config['language'] = $c_lang; 													// restore saved language
	
	return $raw_content;
}

function  tplus_cut_content($raw_content, $amount = 150) { 		// return array of cut content for all languages
	global $q_config;

	if(empty($q_config) || !function_exists('qtranxf_gettext')) return zu()->cut_content($raw_content, $amount);
	
	$raw_contents = [];
	$contents = [];
	
	$c_lang = $q_config['language'];
	foreach($q_config['enabled_languages'] as $lang){
		$q_config['language'] = $lang; 													// set language
		$raw_contents[$lang] = qtranxf_gettext($raw_content);
		$contents[$lang] = zu()->cut_content($raw_contents[$lang], $amount);
	}
	$q_config['language'] = $c_lang; 													// restore saved language
	
	foreach($contents as $lang => $cut_content) {
		$raw_content = str_replace($raw_contents[$lang], $cut_content, $raw_content);
	}
	return $raw_content;
}

function  tplus_modify_content($raw_content, $prefix = '', $suffix = '', $replace = []) {		// return array of modified content for all languages
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
