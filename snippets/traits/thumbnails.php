<?php

trait zusnippets_Thumbnails {

    private $default_dominant_color = '#333333';

    public function get_attachment_id($post_or_attachment_id = null) {
		if(get_post_type($post_or_attachment_id) === 'attachment') return $post_or_attachment_id;
		else if(has_post_thumbnail($post_or_attachment_id)) {
			$attachment_id = get_post_thumbnail_id($post_or_attachment_id);
			return get_post_type($attachment_id) === 'attachment' ? absint($attachment_id) : null;
		}
		return null;
	}

    // when $size is null - we only need to check if the `thumbnail` exists (returns false or true)
    public function get_post_thumbnail($post_id = null, $size = 'full') {
		if(has_post_thumbnail($post_id)) {
            if($size === null) return true;
			$imgsrc = wp_get_attachment_image_src(get_post_thumbnail_id($post_id), $size);
			return $imgsrc[0];
		} else
			return $size === null ? false : '';
	}

    // Color, Background, Thumbnail, Attachment functions ---------------------]

	public function get_post_gallery_blocks($post_id_or_content = null, $core_gallery = true) {

		if(!function_exists('has_blocks')) return [];
		if(!is_string($post_id_or_content)) {
			if(!$post = get_post($post_id_or_content)) return [];
			$post_id_or_content = $post->post_content;
		}

		$galleries = [];
		if(has_block('zu/gallery', $post_id_or_content) || ($core_gallery && has_block('gallery', $post_id_or_content))) {

			$blocks = parse_blocks($post_id_or_content);
			foreach($blocks as $block) {
				if($block['blockName'] === 'zu/gallery' || ($core_gallery && $block['blockName'] === 'core/gallery')) {
					$block['attrs']['_block'] = $block['blockName'];
					$galleries[] = $block['attrs'];
				}
			}
		}
		// NB! Только первая галерея на странице будет засчитана как основная и связана с этой страницей
		return isset($galleries[0]) ? $galleries[0] : [];
	}

	public function get_post_gallery($post_id = null) {

		// Replace of WP 'get_post_gallery' to avoid multiple resolving of shortcodes
		$check_for_blocks = function_exists('has_blocks');
		if(!$post = get_post($post_id)) return [];

		// if we do not have shortcodes -> checks for blocks
		if(!has_shortcode($post->post_content, 'gallery')) return $this->get_post_gallery_blocks($post->post_content);

		$galleries = [];
		if(preg_match_all('/'.get_shortcode_regex().'/s', $post->post_content, $matches, PREG_SET_ORDER)) {
			foreach($matches as $shortcode) {
				if('gallery' === $shortcode[2]) {

					$shortcode_attrs = shortcode_parse_atts($shortcode[3]);
					if(!is_array($shortcode_attrs)) $shortcode_attrs = [];

					$galleries[] = $shortcode_attrs;
				}
			}
		}

		// if we have not found galleries in shortcodes -> checks in blocks
		return isset($galleries[0]) ? $galleries[0] : get_post_gallery_blocks($post->post_content);
	}

	public function get_background_image($image_url = null, $post_id = null, $with_quote = true) {
		if(is_null($image_url)) $image_url = $this->get_post_thumbnail($post_id);
		$image_bg = empty($image_url) ? '' : sprintf('background-image:url(%2$s%1$s%2$s);', $image_url,  $with_quote ? '&quot;' : '"');
		return $image_bg;
	}

    public function get_default_background_color() {
         return $this->default_dominant_color;
    }

	public function get_background_color($post_or_attachment_id = null, $with_important = false, $as_array = false) {
		$color = $this->maybe_call('get_dominant_by_id', $post_or_attachment_id) ?? $this->default_dominant_color;
		$color_bg = empty($color) ? '' : sprintf('background-color:%1$s%2$s;', $color, $with_important ? ' !important' : '');
		return $as_array ? [$color, $color_bg] : $color_bg;
	}
}
