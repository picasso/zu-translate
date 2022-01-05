<?php

// Language Shortcode helpers  ------------------------------------------------]

trait zu_TranslateShortcode {

	private $clear_filters = null;
	private $quote_marker = '_quote_';

	private function add_shortcoses() {
		add_shortcode('zu-lang', [$this, 'lang_shortcode']);
		add_shortcode('zulang', [$this, 'lang_shortcode']);
		if($this->is_option('switcher.shortcode_menu')) $this->support_shortcode_in_menu();
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

	// Shortcode in menu items  -----------------------------------------------]

	// Replace formated links with shortcode content
	// format:
	// 		#after+shortcode?attribute1=value1&attribute2=value2&class=red-color,bold#
	//		after|before|url	- possible values where to put shortcode output, default (if missing) - 'after'
	//		to add class for link use attribute 'linkclass'


	public function menu_items($menu_items) {
	    foreach($menu_items as $menu_item) {
			$shortcode = preg_match('/#([^#]+)#/', $menu_item->url, $shortcodes) ? $shortcodes[1] : null;
			if(empty($shortcode)) continue;

			$parts = explode('+', $shortcode);
			$position = (count($parts) === 2 && in_array($parts[0], ['after', 'before', 'url'])) ? $parts[0] : 'after';
			$url_parts = parse_url(count($parts) === 2 ? $parts[1] : $parts[0]);

			$shortcode_tag = $url_parts['path'];
			parse_str($url_parts['query'], $shortcode_atts);
			$shortcode_atts['embedded_menu'] = 'true';
			$shortcode_atts = $this->restore_classname($shortcode_atts);

			if(shortcode_exists($shortcode_tag)) {
				$content = $this->build_shortcode($shortcode_tag, $shortcode_atts);
				$output = do_shortcode($content);

				$menu_id = $menu_item->ID;
				$link_class = $shortcode_atts['linkclass'] ?? null;
	            $menu_item->url = $position === 'url' ? $output : str_replace($shortcodes[0], '', $menu_item->url);

				$link_class_func = function($atts, $item) use($menu_id, $link_class) {
					if($menu_id === $item->ID) $atts['class'] = $this->snippets('merge_classes', [
						$atts['class'] ?? null,
						explode(',', $link_class)
					]);
					return $atts;
				 };

				$position_func = function($args, $item) use($menu_id, $output, $position) {
					if($menu_id === $item->ID) $args->{$position} = $output;
					return $args;
				};

				if(!empty($link_class)) add_filter('nav_menu_link_attributes', $link_class_func, 10, 2);
				if($position !== 'url') add_filter('nav_menu_item_args', $position_func, 10, 2);

				$this->clear_filters = function() use($link_class_func, $position_func) {
					remove_filter('nav_menu_link_attributes', $link_class_func, 10, 2);
					remove_filter('nav_menu_item_args', $position_func, 10, 2);
				};
	        }
	    }
	    return $menu_items;
	}

	public function clear_menu_filters($nav_menu) {
		if(is_callable($this->clear_filters)) call_user_func($this->clear_filters);
		$this->clear_filters = null;
		return $nav_menu;
	}

	private function support_shortcode_in_menu() {
		add_filter('wp_nav_menu_objects', [$this, 'menu_items']);
		add_filter('pre_wp_nav_menu', [$this, 'clear_menu_filters']);
	}

	private function build_shortcode($tag, $atts = null) {
        $shortcode = sprintf('[%1$s%2$s/]', $tag, is_array($atts) ? (' ' . http_build_query($atts, '', ' ')) : '');
		return str_replace('+', ' ', str_replace($this->quote_marker, '"', $shortcode));
    }

	private function restore_classname($atts) {
		$props = ['class', 'classes', 'className'];
		foreach($props as $name) {
			if(!isset($atts[$name])) continue;
			$classes = str_replace(',', ' ', $atts[$name]);
			$atts[$name] = $this->quote_marker . $classes . $this->quote_marker;
		}
        return $atts;
    }
}
