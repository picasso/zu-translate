<?php
trait zusnippets_Content {

    // Title, Content, Excerpt functions --------------------------------------]

    public function get_closing_tag_from_open($html) {
	    $opened_tag = preg_match('#<(?!meta|img|br|hr|input\b)\b([a-z]+)#iU', $html, $tags) ? $tags[1] : '';
	    return empty($opened_tag) ? '' : sprintf('</%1$s>', $opened_tag);
	}

	public function close_tags($html) {
	    preg_match_all('#<(?!meta|img|br|hr|input\b)\b([a-z]+)(?: .*)?(?<![/|/ ])>#iU', $html, $matches);
	    $openedtags = $matches[1];
	    preg_match_all('#</([a-z]+)>#iU', $html, $matches);
	    $closedtags = $matches[1];
	    $opened_count = count($openedtags);
	    if(count($closedtags) == $opened_count) return trim($html);

	    $openedtags = array_reverse($openedtags);
	    for($i=0; $i < $opened_count; $i++) {
	        if(!in_array($openedtags[$i], $closedtags)) {
	            $html .= '</'.$openedtags[$i].'>';
	        } else {
	            unset($closedtags[array_search($openedtags[$i], $closedtags)]);
	        }
	    }
	    return trim(preg_replace('/<p>\s*<\/p>/i', '', $html));
	}

    public function remove_space_between_tags($html) {
        $html = preg_replace('/^\s+</', '<', $html);
        $html = preg_replace('/>\s+</', '><', $html);
        $html = preg_replace('/>\s+$/', '>', $html);
        $html = preg_replace('/\s+/', ' ', $html);
        return $html;
    }

    function remove_p($html) {
        return preg_replace('/<p\b[^>]*>(.*?)<\/p>/i', '$1', $html);
    }

	public function remove_empty_p($html) {

		// clean up p tags around block elements
		$html = preg_replace( array(
			'#<p>\s*<(ul|ol|div|aside|section|article|header|footer)#i',
			'#</(ul|ol|div|aside|section|article|header|footer)>\s*</p>#i',
			'#</(ul|ol|div|aside|section|article|header|footer)>\s*<br ?/?>#i',
			'#<(ul|ol|div|aside|section|article|header|footer)([^>]+?)>\s*</p>#i',
			'#<p>\s*</(ul|ol|div|aside|section|article|header|footer)#i',
		), array(
			'<$1',
			'</$1>',
			'</$1>',
			'<$1$2>',
			'</$1',
		), $html);

		// remove  <p>&nbsp;<br>&nbsp;</p>
		$html = preg_replace('#<p>(\s|&nbsp;)*(<br\s*/*>)*(\s|&nbsp;)*</p>#i', '', $html);
		// replace  <p>&nbsp;<br>&nbsp; for  <p>
		$html = preg_replace('#<p>(\s|&nbsp;)*(<br\s*/*>)(\s|&nbsp;)*#i', '<p>', $html);
		// replace  &nbsp;<br>&nbsp;</p>  for  </p>
		$html = preg_replace('#(\s|&nbsp;)*(<br\s*/*>)(\s|&nbsp;)*</p>#i', '</p>', $html);
		return $html;
	}

	public function remove_p_on_images($content) {
		// remove p around single image
		$content = preg_replace('/<p>\s*(<a[^>]+>)?[^<]*(<img[^>]+?>)[^<]*(<\/a>)?[^<]*<\/p>/i', '${1}${2}${3}', $content);
		// remove p around group of images
		$content = preg_replace('/<p>\s*((?:(?:<a[^>]+>)?[^<]*(?:<img[^>]+?>)[^<]*(?:<\/a>)?)+)[^<]*<\/p>/i', '${1}', $content);
		return $content;
	}

	public function fix_content($content, $add_p = false, $preserve_br = true) {
		$replace_tags_from_to = array (
            '<br/>'     => '',
            '<br />'    => '',
            "<br/>\n"   => '',
            "<br />\n"  => '',
		);
		$preserve_tags_from_to = array (
            '<br/>'     => '[_br_]',
            '<br />'    => '[_br_]',
            "<br/>\n"   => '[_br_]',
            "<br />\n"  => '[_br_]',
		);
        $fixed = strtr(trim($content), $preserve_br ? $preserve_tags_from_to : $replace_tags_from_to);
        $fixed = preg_replace('/^\s+|\s+$/', '', $fixed);
        $fixed = preg_replace('/^\n+|\n+$/', '', $fixed);
		if($preserve_br) $fixed = str_replace('[_br_]', '<br/>', trim($fixed));
		// remove <br> right after <p> & right before </p>
		if($add_p) $fixed = preg_replace([
			'#<p>\s*<br\s*/>#im',
			'#<br\s*/>\s*</p>#im',
            '#^<p>#im',
            '#</p>$#im',
			], [
			'<p>',
			'</p>',
            '',
            '',
		], sprintf('<p>%s</p>', $fixed));
		return trim($fixed);
	}

	public function get_excerpt($post_id = null, $amount = 270, $force_from_content = false) {
		global $post;

		if(is_null($post_id)) $post_id = is_object($post) ? $post->ID : null;

		if(!$force_from_content && has_excerpt($post_id)) {
			$raw_excerpt = apply_filters('the_excerpt', get_post_field('post_excerpt', $post_id));
		} else {
			if(!empty($post_id) || is_null($post)) $post = get_post($post_id);

			$raw_excerpt = empty($post->post_content) ? '' : $post->post_content;
		}

		// we need remove shortcodes before apply_filters('the_content'...) otherwise it will lead to infinitive recursion
        $raw_excerpt = strip_shortcodes($raw_excerpt);

		// we need remove any Gutenberg block which use 'get_excerpt' before apply_filters('the_content'...)
		// otherwise it will lead to infinitive recursion
		// check if there were added blocks which we should avoid during apply_filters('the_content'...)
		$skip_blocks = apply_filters('zukit_no_excerpt_blocks', []);
		// for avoided Gutenberg block we shoud use add_filter('pre_render_block', ...) and return not null
		$prevent_recursion = function($pre_render, $block) use($skip_blocks) {
			return in_array($block['blockName'], $skip_blocks) ? '' : $pre_render;
		};
		add_filter('pre_render_block', $prevent_recursion, 10, 2);

        $raw_excerpt = apply_filters('the_content', $raw_excerpt);
		// and remove filter after 'the_content' is processed
		remove_filter('pre_render_block', $prevent_recursion, 10, 2);


		// remove javascript text translations
        $raw_excerpt = preg_replace('/\s*\[[^\]]+?\]/i', '', $raw_excerpt);
		// remove first <h*> tag if text starts with it
		$raw_excerpt = preg_replace('/^(?:<p>\s*<\/p>\s*)?<h.?[^<]+<\/h.?>/i', '', $raw_excerpt);
        $raw_excerpt = strip_tags($raw_excerpt);
		// replace HTML '...' (&#8230;)  with '&.' - and restore later
        $raw_excerpt = str_replace('&#8230;', '&.', $raw_excerpt);
        $tokens = array();
        $count = 0;
        $post_excerpt = '';

		// split in sentences
 		preg_match_all('/[^.!?\s][^.!?]*(?:[.!?](?![\'\"]?\s|$)[^.!?]*)*[.!?]?[\'\"]?(?=\s|$)/', $raw_excerpt, $tokens);

        foreach($tokens[0] as $token) {

            if($count > $amount) break;

			$post_excerpt .= $token.' ';
            $count = strlen($post_excerpt);
        }

		// restore replaced &#8230;
        $post_excerpt = trim(str_replace('&.', '&#8230;', $post_excerpt));

		return $this->fix_content($post_excerpt);
	}

	public function cut_content($content, $amount = 150) {

	    $raw_content = strip_shortcodes($content);
	    $raw_content = apply_filters('the_content', $raw_content);
		// remove all headers <h1><h2> etc.
	    $raw_content = preg_replace('/<h\d[^>]+?>.+?<\/h\d>/i', '', $raw_content);
		// remove javascript text translations
	    $raw_content = preg_replace('/\s*\[[^\]]+?\]/i', '', $raw_content);

	    $raw_content = strip_tags($raw_content);
	    $raw_content = html_entity_decode($raw_content, ENT_QUOTES | ENT_XML1);

	    $tokens = [];
	    $count = 0;
	    $cut_content = $try_content = '';

		// split in sentences
		preg_match_all('/[^.!?\s][^.!?]*(?:[.!?](?![\'\"]?\s|$)[^.!?]*)*[.!?]?[\'\"]?(?=\s|$)/', $raw_content, $tokens);

	    foreach($tokens[0] as $token) {

			$try_content .= $token.' ';
	        $count = strlen($try_content);
	        if($count > $amount) break;
			$cut_content = $try_content;
	    }

		// if the first sentece is longer than the requested amount - anyway better to have one sentece
		if(empty($cut_content)) $cut_content = $try_content;

	    return trim($cut_content);
	}

	public function  modify_content($content, $prefix = '', $suffix = '', $replace_pairs = []) {

		foreach($replace_pairs as $search => $replace) {
			$content = str_replace($search, $replace, $content);
		}

		if(!empty($prefix)) $content = $prefix . $content;
		if(!empty($suffix)) $content = $content . $suffix;

		return $content;
	}
}
