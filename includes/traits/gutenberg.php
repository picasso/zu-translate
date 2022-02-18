<?php

include_once('supported.php');

// Support for WordPress Block Editor -----------------------------------------]

trait zu_TranslateGutenberg {

	private $multicontent_separator = '[,]';

	use zu_TranslateSupportedBlocks;

	private function init_gutenberg_support() {
		if($this->is_option('gutenberg')) {
			$this->assign_supported_blocks();
			if(!empty($this->get_registered_data('blocks'))) {
				add_filter('the_posts', [$this, 'pre_render_posts'], 0, 2);
				add_action('rest_api_init', [$this, 'rest_api_init']);

				// NOTE: pro tempora! встроить возможность в плагин ''
				$this->qtx_gutenberg_reset();
			}
			if($this->is_option('blockeditor.nobackups')) {
				$this->remove_post_autosave();
			}
		}
	}

	public function rest_api_init() {
		$post_types = $this->enabled_post_types();
		foreach($post_types as $post_type) {
			add_filter("rest_prepare_{$post_type}", [$this, 'rest_prepare'], 99, 3);
		}
		// add_filter('rest_request_before_callbacks', [$this, 'request_before_callbacks'], 99, 3);
		add_filter('rest_request_after_callbacks', [$this, 'request_after_callbacks'], 99, 3);
	}

	// prepare the REST request for a post being edited
	// set the raw content fields
	public function rest_prepare($response, $post, $request) {
		if($this->is_eligible_request($request, 'GET', $post)) {
			$url_lang = $this->get_url_param('language');
			$response = $this->modify_rest_response($response, $url_lang);
		}
		return $response;
	}

// 	public function request_before_callbacks($response, $handler, $request) {
// zu_logc('request_before_callbacks', $this->debug_request_info($request, $response));
// 	}

	// modify the REST response of the post just updated and set the 'raw_*' attributes
	public function request_after_callbacks($response, $handler, $request) {
		if($this->is_eligible_request($request, ['PUT', 'POST'])) {
			$editor_lang = $request->get_param('editor_lang');
// zu_logc('request_after_callbacks', $this->debug_request_info($request, $response), $editor_lang);
			if(isset($editor_lang)) {
				$response = $this->modify_rest_response($response, $editor_lang);
			}
		}
		return $response;
	}

	// replace the latest editable content on RAW content for all attributes
	public function pre_render_posts($posts, $query) {
		if(!is_array($posts)) return $posts;
		if($query->query_vars['post_type'] === 'nav_menu_item') return $posts;
		foreach($posts as $post) {
			$this->restore_post_content($post);
	    }
		return $posts;
	}

	// 'write_your_story' filter will be called before the moment when 'autosave' will be added to '$editor_settings'
	// this is a convenient time to intervene and remove 'autosave' (if it was found)
	public function remove_post_autosave() {
		add_filter('write_your_story', function($story, $post) {
			$autosave = wp_get_post_autosave($post->ID);
			if($autosave) {
				wp_delete_post_revision($autosave->ID);
			}
			return $story;
		}, 10, 2);
	}

	// internal helpers -------------------------------------------------------]

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

	// replace the multi-language raw content with only the current language used for edition and set 'editor_lang'
	private function modify_rest_response($response, $lang) {
		$response_data = $response->get_data();
		$update_data = false;
		if(isset($response_data['title']['raw'])) {
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
			$response->set_data($response_data);
		}
		return $response;
	}

	// NOTE: now the case is not processed when one (or more) attribute is in content, and the other is
	// in the special comment to the block (<!-- wp:<block name>)
	// I have not met such a situation, but suddenly it is possible?
	private function restore_post_content($post) {
		$content = $post->post_content;
		// at first quick check if we have at least one 'qtxRaw' attribute
		if(strpos($content, 'qtxRaw') !== false) {
// zu_log($content);
			$blocks = $this->get_supported_blocks($content);
// zu_log($blocks);
			foreach($blocks as $block) {
				[$raw_content, $lang] = $this->get_block_atts($block);
				if($raw_content) {
					$block_content = render_block($block);
					// if the rendered block was found in '$content', then replace the content
					if(strpos($content, $block_content) !== false) {
						$block_raw_content = $this->restore_block_raw($block_content, $raw_content, $lang);
						$content = str_replace($block_content, $block_raw_content, $content);
// zu_logc('replace content', $block_content, $block_raw_content);
					} else {
						// if the rendered block was NOT found in '$content',
						// then replace the values in a special comment with the attributes of the block
						$blockName = strip_core_block_namespace($block['blockName']);
						if(preg_match_all("/<!-- wp:{$blockName}.+?-->/m", $content, $matches)) {
							foreach($matches as $comment_block) {
								$block_raw_content = $this->restore_block_raw($comment_block[0], $raw_content, $lang);
								$content = str_replace($comment_block[0], $block_raw_content, $content);
// zu_logc('replace comment', $comment_block[0], $block_raw_content);
							}
						}
					}
// zu_log_if($block['blockName'] == 'core/paragraph', $block_content, $block_raw_content, $block);
				}
			}
			$post->post_content = $content;
			return true;
		}
		return false;
	}

	private function get_supported_blocks($blocks_or_content) {
		$blocks = is_string($blocks_or_content) ? parse_blocks($blocks_or_content) : $blocks_or_content;
		$found_blocks = [];
		$registered_blocks = $this->get_registered_data('blocks');
		foreach($blocks as $block) {
			$blockName = $block['blockName'];
			// if 'blockName' is null, we are dealing with a 'pre-Gutenberg' post ('Classic editor' block?)
			if(is_null($blockName)) continue;
			if(array_key_exists($block['blockName'], $registered_blocks)) {
				$found_blocks[] = $block;
			}
			// recursively collect all 'innerBlocks'
			if(!empty($block['innerBlocks'])) {
				$found_blocks = array_merge(
					$found_blocks,
					$this->get_supported_blocks($block['innerBlocks'])
				);
			}
		}
		return $found_blocks;
	}

	private function get_block_atts($block) {
		$atts = $block['attrs'] ?? null;
		return [$atts['qtxRaw'] ?? false, $atts['qtxLang'] ?? false];
	}

	private function restore_block_raw($content, $raw_content, $lang) {
		// split RAW on content blocks for each attribute
		// (usually attribute for content is only one, but sometimes several)
		$raw_blocks = explode($this->multicontent_separator, $raw_content);
		foreach($raw_blocks as $raw) {
			// replace the latest editable content on RAW content for this attribute
			// (which will later be used by the 'qTranslate-XT' plugin)
			$blocks = qtranxf_split($raw);
			$last_edited_content = $blocks[$lang] ?? '';
			$content = str_replace($last_edited_content, $raw, $content);
// zu_logc('restore_block_raw', $raw, $lang, $blocks, $last_edited_content);
		}
		return $content;
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

	private function gutenberg_data($settings_data = false) {
		$data = [
			'supported' => $this->get_registered_data($settings_data ? 'all' : 'blocks'),
		];
		if(!$settings_data) {
			$data = array_merge($data, [
				'lang'		=> $this->get_url_param('language'),
				'flags'		=> $this->is_option('flags'),
				'sync'		=> $this->is_option('blockeditor.sync'),
				'session'	=> $this->is_option('blockeditor.session'),
				'unsaved'	=> $this->is_option('blockeditor.unsaved'),
				'nobackups'	=> $this->is_option('blockeditor.nobackups'),
				'initial'	=> $this->is_option('blockeditor.initial'),
				'debug'		=> $this->get_option('_debug'),
			]);
		}
		return $data;
	}

	// it's only necessary for debugging, then can be deleted
	private function debug_request_info($request, $response) {
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
			'content_type'	=> $request->get_content_type(),
			'response'		=> $response ?? null,
			'data'			=> $data,
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

	// remove the filter by the name of the class when there is no access to the instance value
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
					remove_filter($tag, $identifier, $p);
				}
			}
		}
	}
}
