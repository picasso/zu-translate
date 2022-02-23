<?php

// Convert blocks for WordPress Block Editor ----------------------------------]

trait zu_TranslateConverted {

	private function convert_classic_blocks($post_id, $post_lang = 'en') {
		$post = get_post($post_id);
		$content = $post->post_content;
		$found_blocks = $this->find_blocks($content);
		if(empty($found_blocks)) return false;

		[ $block_tokens, $languages ] = $this->get_tokens($found_blocks);
// zu_log($block_tokens, $languages);
		if(!empty($languages)) {
			foreach($found_blocks as $id => $raw) {
				$lang_blocks = qtranxf_split($raw);
				$tokens = $block_tokens[$id];

				$headings = [];
				$paragraphs = [];
				foreach($languages as $lang) {
					foreach($tokens[$lang]['headings'][1] as $index => $value) {
						$headings[$index][$lang] = $value;
					}
					foreach($tokens[$lang]['text'] as $index => $value) {
						$paragraphs[$index][$lang] = $value;
					}
				}
				$block_content = $this->replace_blocks_with_raw($lang_blocks[$post_lang], [
					'headings'			=> $tokens[$post_lang]['headings'][0],
					'paragraphs'		=> $tokens[$post_lang]['text'],
					'shortcodes'		=> $tokens[$post_lang]['shortcodes'],
					'headings_raw'		=> array_map('qtranxf_join_b', $headings),
					'paragraphs_raw'	=> array_map('qtranxf_join_b', $paragraphs),
				]);
// zu_log($id, $block_content, $content);
				$content = str_replace($id, $block_content, $content);
			}
// zu_log($content, $tokens);
			$this->duplicate_post_as_draft($post, $content);
			return true;
		}
		return false;
	}

	private function split_classic_blocks($post_id) {
		$post = get_post($post_id);
		$content = $post->post_content;
		$found_blocks = $this->find_blocks($content);
		if(empty($found_blocks)) return false;

		[ $block_tokens, $languages ] = $this->get_tokens($found_blocks);

		$split_content = [];
		if(!empty($languages)) {
			$split_content = array_fill_keys($languages, $content);

			foreach($found_blocks as $id => $raw) {
				$lang_blocks = qtranxf_split($raw);
				$tokens = $block_tokens[$id];
				foreach($lang_blocks as $lang => $lang_raw) {
					$block_content = $this->replace_blocks_with_raw($lang_raw, [
						'without_raw'		=> true,
						'headings'			=> $tokens[$lang]['headings'][0] ?? [],
						'paragraphs'		=> $tokens[$lang]['text'] ?? [],
						'shortcodes'		=> $tokens[$lang]['shortcodes'] ?? [],
					]);
					$split_content[$lang] = str_replace($id, $block_content, $split_content[$lang]);
				}
			}
		}
		if(!empty($split_content)) {
			foreach($languages as $lang) {
				$this->duplicate_post_as_draft($post, $split_content[$lang], strtoupper($lang));
			}
			return true;
		}
		return false;
	}

	// internal helpers -------------------------------------------------------]

	private function find_blocks(&$content) {
		$blocks = parse_blocks($content);
		$found_blocks = [];
		foreach($blocks as $index => $block) {
			$blockName = $block['blockName'];
			// if 'blockName' is null, we are dealing with a 'pre-Gutenberg' post ('Classic editor' block)
			if(is_null($blockName)) {
				$block_id = "#__classic-$index";
				$block_content = $block['innerHTML'];
				// skip blocks with 'empty' content
				if(trim(preg_replace('/\r\n|\r|\n/', '', $block_content))) {
					$found_blocks[$block_id] = $block_content;
					$content = str_replace($block_content, $block_id, $content);
				}
			}
		}
// zu_logc('Found Blocks', $found_blocks);
		return $found_blocks;
	}

	private function get_tokens($blocks) {
		$block_tokens = [];
		$languages = [];
		foreach($blocks as $id => $raw) {
			$lang_blocks = qtranxf_split($raw);
			$tokens = [];
			foreach($lang_blocks as $lang => $lang_raw) {
				$tokens[$lang]['headings'] = $this->split_headings($lang_raw);
				$fixed_raw = str_replace($tokens[$lang]['headings'][0], '', $lang_raw);
				$tokens[$lang]['shortcodes'] = $this->split_shortcodes($fixed_raw);
				$tokens[$lang]['text'] = $this->split_paragraphs($fixed_raw, $tokens[$lang]);
			}
			$block_tokens[$id] = $tokens;
			$block_languages = array_keys($lang_blocks);
			if(count($block_languages) > count($languages)) $languages = $block_languages;
		}
// zu_logc('Found Tokens', $block_tokens, $languages);
		return [$block_tokens, $languages];
	}

	private function replace_blocks_with_raw($content, $params) {
		$without_raw = $params['without_raw'] ?? false;
		foreach($params['headings'] as $index => $value) {
			$heading_raw = $without_raw ? strip_tags($value) : ($params['headings_raw'][$index] ?? '');
			$content = str_replace($value, $this->core_heading($heading_raw, $value), $content);
		}
		foreach($params['shortcodes'] as $index => $value) {
			if($value['parent' !== -1]) continue;
// zu_log($value);
			$shortcode_tag = $value['tag'];
			$shortcode_raw = sprintf('%s%s%s',
				$value['content'],
				$value['inner'] ?? '',
				$value['closing'] ? "[/{$shortcode_tag}]" : '',
			);
// zu_log($shortcode_raw);
			$content = str_replace($shortcode_raw, $this->core_shortcode($shortcode_raw), $content);
		}
		foreach($params['paragraphs'] as $index => $value) {
			$paragraph_raw = $without_raw ? strip_tags($value) : ($params['paragraphs_raw'][$index] ?? '');
			$content = str_replace($value, $this->core_paragraph($paragraph_raw, $value), $content);
		}
		return $content;
	}

	// parse and analyse block contents ---------------------------------------]

	private function split_headings($raw) {
		$re = '/<h[1-6]+>([^<]+?)<\/h[1-6]+>/im';
		$result = preg_match_all($re, $raw, $matches, PREG_SET_ORDER, 0);
		return $result ? [array_column($matches, 0), array_column($matches, 1)] : [[], []];
	}

	private function split_shortcodes($raw) {
		$re = '/\[([\/]*[^\s|\]|\/]+)([^]]*)\]/m';
		$result = preg_match_all($re, $raw, $matches, PREG_SET_ORDER, 0);
		$shortcodes = [];
		if($result) {
			$blocks = array_column($matches, 0);
			$tags = array_column($matches, 1);
			$params = array_column($matches, 2);
			$parents = [];
			foreach($tags as $index => $tag) {
				if(substr($tag, 0, 1) === '/') {
					array_pop($parents);
					continue;
				}
				$has_closing_tag = $this->test_closing_tag($tags, $tag, $index + 1);
				$shortcodes[] = [
					'tag'		=> $tag,
					'content'	=> $blocks[$index],
					'params'	=> $params[$index],
					'closing'	=> $has_closing_tag,
					'inner'		=> null,
					'parent'	=> $parents[0] ?? -1,
				];
				if($has_closing_tag) array_push($parents, count($shortcodes) - 1);
			}
			foreach($shortcodes as $index => $data) {
				if($data['closing']) {
					$tag = $data['tag'];
					$re_inner = "/\[{$tag}[^\]]*\](.+?)\[\/{$tag}/ms";
					if(preg_match_all($re_inner, $raw, $matches, PREG_SET_ORDER, 0)) {
						$shortcodes[$index]['inner'] = $matches[0][1];
						$raw = str_replace($matches[0], '', $raw);
					}
				}
			}
		}
// zu_log($shortcodes); //, $matches, $tokens);
		return $shortcodes;
	}

	private function split_paragraphs($raw) {
		$re = '/\[[^\]]+\][\n]*/m';
		$without_shortcodes = strip_tags(preg_replace($re, '', $raw));
		$paragraphs = preg_split('/\n/', $without_shortcodes, -1, PREG_SPLIT_NO_EMPTY);
		return $paragraphs;
	}

	private function test_closing_tag($tags, $test, $from) {
		$last_index = count($tags) - 1;
		$closing_tag = "/{$test}";
		while($from) {
			if($from > $last_index) break;
			if($tags[$from] === $test) break;
			if($tags[$from] === $closing_tag) return true;
			$from++;
		}
		return false;
	}

	// format content as Gutenberg blocks -------------------------------------]

	private function core_heading($raw, $rendered) {
		$without_tags = strip_tags($rendered);
		$rendered = str_replace($without_tags, $raw, $rendered);
		$heading_id = mb_strtolower(preg_replace('/\s+/', '-', $without_tags));
		return sprintf(
			"<!-- wp:heading -->\n%s\n<!-- /wp:heading -->",
			preg_replace('/<(h[1-6])/i', '<$1 id="' . $heading_id . '"', $rendered)
		);
	}

	private function core_paragraph($raw, $rendered) {
		return sprintf(
			"<!-- wp:paragraph -->\n<p>%s</p>\n<!-- /wp:paragraph -->",
			str_replace($rendered, $raw, $rendered)
		);
	}

	private function core_shortcode($raw) {
		return sprintf("<!-- wp:shortcode -->\n%s\n<!-- /wp:shortcode -->", $raw);
	}
}
