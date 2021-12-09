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
				add_filter('render_block', [$this, 'translate_render'], 10, 2);
			}
		}
	}

	public function translate_render($content, $block) {
		if(in_array($block['blockName'], $this->supported_blocks)) {
			// $content = '<div class="wp-block-paragraph">';
			// $content .= $block_content;
			// $content .= '</div>';
			zu_log($content, $block);
			return $this->get_translated_content($content, $block);
		}
		return $content;
	}

	private function get_translated_content($content, $block) {
		$atts = $block['attrs'] ?? null;
		$rawContent = $atts['qtxRaw' ?? 'qtxRaw'] ?? false;
		if($rawContent) {
			$lang = $atts['qtxLang'];
			$blocks = qtranxf_split($rawContent);
			$selected_content = $blocks[$lang] ?? '';
			return str_replace($selected_content, $rawContent, $content);
		}
		return $content;
	}

	private function gutenberg_data() {
		return [
			'supported' => $this->supported_data ?? [],
		];
	}
}
