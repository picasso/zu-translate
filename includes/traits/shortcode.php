<?php

// Language Shortcode helpers  ------------------------------------------------]

trait zu_TranslateShortcode {

	private function add_shortcoses() {
		add_shortcode('lang', [$this, 'lang_shortcode']);
	}

	// generate language switcher
	public function lang_shortcode($atts) {

		if(!$this->is_multilang()) return '';

		$atts = $this->snippets('shortcode_atts_with_cast', [
			'className' 	=> '',			// additional classes to be added
			'class' 		=> null,		// alias for additional classes
			'embedded_menu'	=> false,		// if embedded in the menu, the base class will be 'lang-menu' otherwise 'lang-shortcode'
    		'as_code' 		=> false,		// use language codes as the name of the switcher items
    		'unsorted'		=> false, 		// if sorted then the active language will be on top
			'post_id'		=> null,		// post ID for which you want to create a language switcher
    	], $atts, ['as_code', 'unsorted', 'embedded_menu']);
		extract($atts, EXTR_OVERWRITE);

		$links = [];
		$lang_urls = $this->get_urls_for_id($post_id);
		$languages = $this->get_all_languages(!$unsorted);
		$key = $as_code ? 'code' : 'name';

		foreach($languages as $lang) {
			$code = $lang['code'];
			$links[] = zu_sprintf(
				'<li class="%1$s">
					<a href="%3$s">
						<span class="name">
							<span class="font-icon %4$s"></span>
							%2$s
						</span>
					</a>
				</li>',
				$this->snippets('merge_classes', [
					'lang',
					'lang-'.$code,
					$lang['active'] ? 'active' : null,
					'no-anim'
				]),
				$lang[$key],
				$lang_urls[$code],
				$lang['active'] ? 'tick' : 'none tick'
			);
		}
		$active_lang = $this->get_lang(true);

		return empty($links) ? '' : zu_sprintf(
			'<ul class="%2$s" data-name="%4$s" data-code="%3$s">
				%1$s
			</ul>',
			implode('', $links),
			$this->snippets('merge_classes', [
				$embedded_menu ? 'lang-menu' : 'lang-shortcode',
				$class ?? $className,
			]),
			$active_lang['code'],
			$active_lang['name']
		);
	}
}
