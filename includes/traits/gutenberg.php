<?php

// Support for WordPress Block Editor -----------------------------------------]

trait zu_TranslateGutenberg {

	private $supported_blocks = null;
	private $supported_data = null;
	private $default_blocks = [
		'core/paragraph'		=> ['name' => 'Paragraph', 'atts' => 'content'],
		'core/heading'			=> ['name' => 'Heading', 'atts' => 'content'],
		'core/list'				=> ['name' => 'List', 'atts' => 'values'],
		'core/quote'			=> ['name' => 'Quote', 'atts' => ['value', 'citation']],
		'core/preformatted'		=> ['name' => 'Preformatted', 'atts' => 'content'],
		'core/pullquote'		=> ['name' => 'Pullquote', 'atts' => ['value', 'citation']],
		'core/verse'			=> ['name' => 'Verse', 'atts' => 'content'],
	];

	private function init_gutenberg_support() {
		if($this->is_option('gutenberg')) {
			$supported = $this->get_option('supported', null);
			if($supported === 'default') {
				$supported = $this->default_blocks;
			}
			if(!empty($supported)) {
				$this->supported_data = $supported;
				$this->supported_blocks = array_keys($supported);
				add_filter('the_posts', [$this, 'pre_render_posts'], 0, 2);
				// add_filter('render_block', [$this, 'translate_render'], 10, 2);

				// pro tempora!
				$this->qtx_gutenberg_reset();
			}
		}
	}

	// public function test_content($content) {
	// 	zu_logc('the_content', $content);
	// 	return $content;
	// }

	public function pre_render_posts($posts, $query) {
		if(!is_array($posts)) return $posts;
		if($query->query_vars['post_type'] === 'nav_menu_item')  return $posts;
		foreach($posts as $post) {
			$result = $this->restore_post_content($post);
			if($result) zu_logc('the_posts', $post);
	    }
		return $posts;
	}

	private function restore_post_content($post) {
		$content = $post->post_content;
// zu_log('pre_post_content', $content);
		// first quick check if we have at least one 'qtxRaw' attribute
		if(strpos($content, 'qtxRaw') !== false) {
			$blocks = parse_blocks($content);
			foreach($blocks as $block) {
				[$rawContent, $lang] = $this->get_block_atts($block);
				if($rawContent) {
					$block_content = render_block($block);
					$block_raw_content = $this->restore_block_raw($block_content, $rawContent, $lang);
// zu_logc('str_replace', $block_content, $block_raw_content);
					$content = str_replace($block_content, $block_raw_content, $content);
				}
			}
			$post->post_content = $content;
			return true;
		}
		return false;
	}

	private function get_block_atts($block) {
		$atts = $block['attrs'] ?? null;
		return [$atts['qtxRaw'] ?? false, $atts['qtxLang'] ?? false];
	}

	private function restore_block_raw($content, $rawContent, $lang) {
		$blocks = qtranxf_split($rawContent);
		$last_edited_content = $blocks[$lang] ?? '';
// zu_logc('restore_block_raw', $rawContent, $lang, $blocks, $last_edited_content);
		return str_replace($last_edited_content, $rawContent, $content);
	}

// 	public function translate_render($content, $block) {
// 		if(in_array($block['blockName'], $this->supported_blocks)) {
// 			// $content = '<div class="wp-block-paragraph">';
// 			// $content .= $block_content;
// 			// $content .= '</div>';
// // zu_log($content, $block);
// 			return $this->get_translated_content($content, $block);
// 		}
// 		return $content;
// 	}

	// private function get_translated_content($content, $block) {
	// 	$atts = $block['attrs'] ?? null;
	// 	$rawContent = $atts['qtxRaw' ?? 'qtxRaw'] ?? false;
	// 	if($rawContent) {
	// 		$lang = $atts['qtxLang'];
	// 		$blocks = qtranxf_split($rawContent);
	// 		$selected_content = $blocks[$lang] ?? '';
	// 		zu_log($rawContent, $lang, $blocks, $selected_content);
	// 		return str_replace($selected_content, $rawContent, $content);
	// 	}
	// 	return $content;
	// }

	private function gutenberg_data() {
		return [
			'supported' => $this->supported_data ?? [],
		];
	}

	////////////////////////////////////////////////////////////////////////////

	// temporary measure - since I cannot prevent the current processing in the 'qTranslate-XT' plugin
	private function qtx_gutenberg_reset() {
		add_action('rest_api_init', [$this, 'remove_all'], 99);
	}

	public function remove_all() {
		$post_types = get_post_types(['show_in_rest' => true]);
		foreach ($post_types as $post_type) {
			$post_type_excluded = in_array($post_type, $q_config['post_type_excluded'] ?? []);
			if(!$post_type_excluded) {
				$this->remove_filter("rest_prepare_{$post_type}", 'QTX_Admin_Gutenberg', 'rest_prepare', 99);
			}
		}
		$this->remove_filter('rest_request_before_callbacks', 'QTX_Admin_Gutenberg', 'rest_request_before_callbacks', 99);
		$this->remove_filter('rest_request_before_callbacks', 'QTX_Admin_Gutenberg', 'rest_request_after_callbacks', 99);
		add_action('enqueue_block_editor_assets', function() {
			wp_dequeue_script('qtx-gutenberg');
			wp_deregister_script('qtx-gutenberg');
		}, 99);
	}

	private function remove_filter($tag, $class, $method = null, $priority = null) {
		$filters = $GLOBALS['wp_filter'][$tag] ?? [];
	// zu_logc('before', $filters[$priority]);
		if(empty($filters)) return;
		foreach($filters as $p => $filter) {
			if(!is_null($priority) && ((int) $priority !== (int) $p)) continue;
			$remove = false;
			$removed_method = null;
			foreach($filter as $identifier => $function) {
				$function = $function['function'];
				if(is_array($function)
					&& (is_a($function[0], $class) || (is_array($function) && $function[0] === $class))
				) {
					$remove = ($method && ($method === $function[1]));
					$removed_method = $remove ? $method : null;
				} elseif($function instanceof Closure && $class === 'Closure') {
					$remove = true;
					$removed_method = 'Closure';
				}
				if($remove) {
	// zu_logc('Removed filter', $tag, $removed_method, $p);
					remove_filter($tag, $identifier, $p);
	// zu_logc('after', $filters[$priority]);
				}
			}
		}
	}
}
