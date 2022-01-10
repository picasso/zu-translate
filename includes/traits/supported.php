<?php

// Supported Blocks for WordPress Block Editor --------------------------------]

trait zu_TranslateSupportedBlocks {

	// 'supported_data' - is a list of all registered blocks, those by default and added by the user
	private $supported_data = null;
	// 'supported_blocks' - is a list of all registered blocks minus blocks from 'excluded' list
	private $supported_blocks = null;

	private $wp_synced = '5.8.2';
	private $external_blocks = [];

	private $wp_text_blocks = [
		'core/paragraph'		=> ['title' => 'Paragraph', 'atts' => 'content'],
		'core/heading'			=> ['title' => 'Heading', 'atts' => 'content'],
		'core/list'				=> ['title' => 'List', 'atts' => 'values'],
		'core/quote'			=> ['title' => 'Quote', 'atts' => ['value', 'citation']],
		'core/preformatted'		=> ['title' => 'Preformatted', 'atts' => 'content'],
		'core/pullquote'		=> ['title' => 'Pullquote', 'atts' => ['value', 'citation']],
		'core/verse'			=> ['title' => 'Verse', 'atts' => 'content'],
		// NOTE: when is ready the processing of the attribute which is array
		// 'core/table'			=> ['title' => 'Table', 'atts' => ['caption', 'head', 'body', 'foot']],
	];

	private $wp_media_blocks = [
		'core/image'			=> ['title' => 'Image', 'atts' => 'caption'],
		'core/gallery'			=> ['title' => 'Gallery', 'atts' => 'caption'],
		'core/audio'			=> ['title' => 'Audio', 'atts' => 'caption'],
		'core/file'				=> ['title' => 'File', 'atts' => 'downloadButtonText'],
		'core/video'			=> ['title' => 'Video', 'atts' => 'caption'],
	];

	private $wp_design_blocks = [
		'core/button'			=> ['title' => 'Button', 'atts' => 'text'],
		'core/more'				=> ['title' => 'More', 'atts' => 'customText'],
	];

	private $wp_widgets_blocks = [
		'core/html'				=> ['title' => 'Custom HTML', 'atts' => 'content'],
		'core/search'			=> ['title' => 'Search', 'atts' => ['label', 'placeholder']],
	];

	private $wp_theme_blocks = [
		// as far as i understand, there is no content here, which requires translation
	];

	private $wp_embeds_blocks = [
		// as far as i understand, there is no content here, which requires translation
	];

	public function register_translated_blocks($blocks) {
		$result = 0;
		if(is_array($blocks)) {
			foreach($blocks as $name => $block) {
				if(array_key_exists($name, $this->external_blocks)) continue;
				if(is_array($block) && array_key_exists('atts', $block)) {
					$this->external_blocks[$name] = $block;
					$result += 1;
				}
			}
		}
		if($result > 0) $this->assign_supported_blocks();
		return $result;
	}

	private function assign_supported_blocks() {
		$supported = $this->get_option('blockeditor.custom', []);
		$supported = array_merge(is_array($supported) ? $supported : [], $this->get_all_supported_blocks());
		$this->supported_data = $supported;
		$excluded = $this->get_option('blockeditor.excluded', []);
		$this->supported_blocks = $this->snippets('array_without_keys', $supported, $excluded);
	}

	private function get_all_supported_blocks() {
		return array_merge(
			// all WP standard blocks
			$this->wp_text_blocks,
			$this->wp_media_blocks,
			$this->wp_design_blocks,
			$this->wp_widgets_blocks,
			$this->wp_theme_blocks,
			$this->wp_embeds_blocks,
			// and all registered external blocks
			$this->external_blocks
		);
	}

	private function get_registered_data($kind = 'blocks') {
		return ($kind === 'blocks' ? $this->supported_blocks : $this->supported_data) ?? [];
	}
}
