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
				add_action('rest_api_init', [$this, 'rest_api_init']);
				// add_filter('render_block', [$this, 'translate_render'], 10, 2);

				// pro tempora!
				$this->qtx_gutenberg_reset();
			}
		}
	}


	public function rest_api_init() {
		$post_types = $this->enabled_post_types();
// zu_log($post_types);
		foreach($post_types as $post_type) {
			add_filter("rest_prepare_{$post_type}", [$this, 'rest_prepare'], 99, 3);
		}
		// add_filter('rest_request_before_callbacks', [$this, 'qt_rest_request_before_callbacks'], 99, 3);
		add_filter('rest_request_after_callbacks', [$this, 'request_after_callbacks'], 99, 3);
	}

	// Prepare the REST request for a post being edited
	// Set the raw content and the 'qtx_editor_lang' field for the current language.
	public function rest_prepare($response, $post, $request) {
// zu_logc('rest_prepare', $this->request_info($request, $response));
		if($this->is_eligible_request($request, 'GET', $post)) {

// // zu_log($q_config, use_block_editor_for_post($post));
// // if(!use_block_editor_for_post($post)) return $response;
			$url_lang = $this->get_url_param('language');
			$response = $this->select_raw_response_language($response, $url_lang);
		}
		return $response;
	}

	// ??? Restore the raw content of the post just updated and set the 'qtx_editor_lang', as for the prepare step
	public function request_after_callbacks($response, $handler, $request) {
		if($this->is_eligible_request($request, ['PUT', 'POST'])) {
			$editor_lang = $request->get_param('editor_lang');
	zu_logc('request_after_callbacks', $this->request_info($request, $response), $editor_lang);
			if(isset($editor_lang)) {
				$response = $this->select_raw_response_language($response, $editor_lang);
			}
		}
		return $response;
	}

	private function is_eligible_request($request, $method = 'GET', $post = null) {
		$context = 'edit';
		$method = is_array($method) ? $method : [$method];
		if(!function_exists('use_block_editor_for_post')) {
			// See https://github.com/WordPress/gutenberg/issues/14012#issuecomment-467015362
			require_once(ABSPATH . 'wp-admin/includes/post.php');
		}
		if($post && !use_block_editor_for_post($post)) return false;
		if($context && $request->get_param('context') !== $context) return false;
		return in_array($request->get_method(), $method);
	}

	// Replace the multi-language raw content with only the current language used for edition and set 'qtx_editor_lang'
	private function select_raw_response_language($response, $lang) {
		$response_data = $response->get_data();
		$update_data = false;
		if(isset($response_data['title']['raw'])) {
		// if( isset( $response_data['content'] ) && is_array( $response_data['content'] ) && isset( $response_data['content']['raw'] ) ) {
			$response_data['title_raw'] = $response_data['title']['raw'];
			$response_data['title']['raw'] = qtranxf_use($lang, $response_data['title']['raw'], false, true);
			$update_data = true;
		}
		if(isset($response_data['excerpt']['raw'])) {
			$response_data['excerpt_raw'] = $response_data['excerpt']['raw'];
			$response_data['excerpt']['raw'] = qtranxf_use($lang, $response_data['excerpt']['raw'], false, true);
			$update_data = true;
		}
		if($update_data) {
			$response_data['qtx_editor_lang'] = $lang;
			$response->set_data($response_data);
		}
		return $response;
	}

	private function request_info($request, $response) {
		$data = $response ? $response->get_data() : null;
		if($data) unset($data['content']);
		$params = $request->get_params();
		unset($params['content']);
		return [
			'method'		=> $request->get_method(),
			'params'		=> $params,
			'body'			=> $request->get_body(),
			'body_params'	=> $request->get_body_params(),
			'route'			=> $request->get_route(),
			// 'attributes'	=> $request->get_attributes(),
			'content_type'	=> $request->get_content_type(),
			// 'response'		=> $response ?? null,
			'data'			=> $data,
		];
	}

	public function qt_rest_request_before_callbacks($response, $handler, $request) {

		// zu_logc('rest_request_before_callbacks', $this->request_info($request, $response));

		if($this->is_eligible_request($request, ['POST', 'PUT'])) {
		}

		// if($request->get_method() !== 'PUT' && $request->get_method() !== 'POST') {
		//    return $response;
	   // }
	   //
	   // $editor_lang = $request->get_param('qtx_editor_lang');
	   // if(!isset($editor_lang)) {
		//    return $response;
	   // }
	   //
	   // $request_body = json_decode($request->get_body(), true);
	   // $post = get_post($request->get_param('id'), ARRAY_A);
	   //
	   // $fields = ['title', 'content', 'excerpt'];
	   // foreach($fields as $field) {
		//    if(! isset($request_body[ $field ])) {
		// 	   continue; // only the changed fields are set in the REST request
		//    }
	   //
		//    // split original values with empty strings by default
		//    $original_value = $post[ 'post_' . $field ];
		//    $split = qtranxf_split($original_value);
	   //
		//    // replace current language with the new value
		//    $split[ $editor_lang ] = $request_body[ $field ];
	   //
		//    // remove auto-draft default title for other languages (not the correct translation)
		//    if($field === 'title' && $post['post_status'] === 'auto-draft') {
		// 	   global $q_config;
		// 	   foreach ($q_config['enabled_languages'] as $lang) {
		// 		   if($lang !== $editor_lang) {
		// 			   $split[ $lang ] = '';
		// 		   }
		// 	   }
		//    }
	   //
		//    // TODO handle custom separator
		//    //$sep = '[';
		//    //$new_data = qtranxf_collect_translations_deep($split, $sep);
		//    //$new_data = qtranxf_join_texts($split, $sep);
		//    $new_data = qtranxf_join_b($split);
	   //
		//    $request->set_param($field, $new_data);
	   // }

	   return $response;
   }



	private function enabled_post_types() {
		global $q_config;
		$enabled_post_types = [];
		$post_types = get_post_types(['show_in_rest' => true]);
			foreach($post_types as $post_type) {
				$post_type_excluded = in_array($post_type, $q_config['post_type_excluded'] ?? []);
				if(!$post_type_excluded) $enabled_post_types[] = $post_type;
			}
		return $enabled_post_types;
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
		$post_types = $this->enabled_post_types();
		foreach($post_types as $post_type) {
			$this->remove_filter("rest_prepare_{$post_type}", 'QTX_Admin_Gutenberg', 'rest_prepare', 99);
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
		if(empty($filters)) return;
		foreach($filters as $p => $filter) {
			if(!is_null($priority) && ((int) $priority !== (int) $p)) continue;
			foreach($filter as $identifier => $function) {
				$remove = false;
				$removed_method = null;
				$function = $function['function'];
				if(is_array($function)
					&& (is_a($function[0], $class) || (is_array($function) && $function[0] === $class))
				) {
					$remove = ($method && ($method === $function[1]));
					$removed_method = $remove ? [$method, $identifier, $function[0]] : null;
				} elseif($function instanceof Closure && $class === 'Closure') {
					$remove = true;
					$removed_method = 'Closure';
				}
	// zu_logc('check_filter', $remove, $function, is_array($function) ? is_a($function[0], $class) : 'NOT METHOD');
				if($remove) {
	// zu_logc('Removed filter', $tag, $removed_method, $p);
					remove_filter($tag, $identifier, $p);
	// zu_logc('after', $filters[$priority]);
				}
			}
		}
	}
}
