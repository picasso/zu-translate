<?php

// Helpers --------------------------------------------------------------------]

function tplus_get_slug($post_id = null) {
	return basename(get_permalink($post_id));
}

function tplus_get_top_ancestor($post_id = null) {
		
		if(empty($post_id)) $post_id = get_the_ID();
		$parents = get_post_ancestors($post_id);
		$parent_id = ($parents) ? $parents[count($parents)-1] : null;  		// Get the top Level page->ID count base 1, array base 0 so -1
		return empty($parent_id) ? $post_id : $parent_id;
}

function tplus_get_top_ancestor_slug($post_id = null) { return tplus_get_slug(tplus_get_top_ancestor()); }

function tplus_merge_classes($classes, $implode = true) {
	
	if(!is_array($classes))	 $classes = preg_split('/[\s,]+/', $classes);
	$classes = array_map('trim', $classes);

	return $implode ? implode(' ', array_filter($classes)) : $classes;
}	

function tplus_remove_classes($classes, $remove = [], $implode = true) {

	$classes = tplus_merge_classes($classes, false);
	
	foreach($remove as $test) if(in_array($test, $classes)) unset($classes[array_search($test, $classes)]);
	
	return $implode ? tplus_merge_classes($classes) : $classes;
}

function tplus_int_in_range($intval, $min, $max) {

	$intval = filter_var($intval, 
	    FILTER_VALIDATE_INT, 
	    array(
	        'options' => array(
	            'min_range' => $min, 
	            'max_range' => $max
	        )
	    )
	);
	
	return $intval === false ? $min : $intval;
}

function tplus_blank_data_uri_img() {
	return 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
}

function tplus_translit($string) {
    $rus = array('А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ё', 'Ж', 'З', 'И', 'Й', 'К', 'Л', 'М', 'Н', 'О', 'П', 'Р', 'С', 'Т', 'У', 'Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Щ', 'Ъ', 'Ы', 'Ь', 'Э', 'Ю', 'Я', 'а', 'б', 'в', 'г', 'д', 'е', 'ё', 'ж', 'з', 'и', 'й', 'к', 'л', 'м', 'н', 'о', 'п', 'р', 'с', 'т', 'у', 'ф', 'х', 'ц', 'ч', 'ш', 'щ', 'ъ', 'ы', 'ь', 'э', 'ю', 'я');
    $lat = array('A', 'B', 'V', 'G', 'D', 'E', 'E', 'Gh', 'Z', 'I', 'Y', 'K', 'L', 'M', 'N', 'O', 'P', 'R', 'S', 'T', 'U', 'F', 'H', 'C', 'Ch', 'Sh', 'Sch', 'Y', 'Y', 'Y', 'E', 'Yu', 'Ya', 'a', 'b', 'v', 'g', 'd', 'e', 'e', 'gh', 'z', 'i', 'y', 'k', 'l', 'm', 'n', 'o', 'p', 'r', 's', 't', 'u', 'f', 'h', 'c', 'ch', 'sh', 'sch', 'y', 'y', 'y', 'e', 'yu', 'ya');
    return str_replace($rus, $lat, $string);
}

function tplus_add_body_class($my_classes) {
	add_filter('body_class', function($classes) use ($my_classes) {
		$classes[] = $my_classes;
		return $classes;
	});
}

function tplus_add_admin_body_class($my_classes) {
	add_filter('admin_body_class', function($classes) use ($my_classes) {
	    $classes .= ' ' . $my_classes;
	    return $classes;
	});
}

// Repeaters functions --------------------------------------------------------]

function tplus_get_repeater_output($repeater = 'default', $contact = null, $message = '', $classes = '') {
	
	$include = tplus_get_my_dir() .'/forms/'. $repeater .'.php';      		
	if(!file_exists($include)) $include = tplus_get_my_dir() .'/forms/default.php';  
	if(!file_exists($include)) return '';

	$_template = $repeater;
	$_classes = $classes;
	$_was_sent = false;
	$_message = $message;
	$_errors = $contact->errors;
	$_values = $contact->as_values();
	
	ob_start();
	include($include); 						// Include repeater template
	$output = ob_get_contents();
	ob_end_clean();

	return $output;
}	

// Shortcode functions --------------------------------------------------------]

function tplus_shortcode($atts, $content = null) {

	extract(shortcode_atts(array(
		'form' => 'contact',
		'class' => '',
		'ajax' => 'true',
		'keep' => 'true',
		'message' => '',
	), $atts));

	$available_forms = array('contact', 'default', 'booking');
	if(!in_array($form, $available_forms)) $form =  'contact';

	if(!is_null($content)) $message = do_shortcode($content);

    $tplus = tplus_instance();

/*
    $was_sent = false;
    
    if($contact->is_valid()) $contact->send_mail();
  
	$tplus->ready();
	return $tplus->contact_form($form, $contact, $message);
*/
	return '';
}

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
