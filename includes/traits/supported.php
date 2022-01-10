<?php

// Supported Blocks for WordPress Block Editor --------------------------------]

trait zu_TranslateSupportedBlocks {

	private $wp_synced = '5.8.2';

	private $wp_text_blocks = [
		'core/paragraph'		=> ['name' => 'Paragraph', 'atts' => 'content'],
		'core/heading'			=> ['name' => 'Heading', 'atts' => 'content'],
		'core/list'				=> ['name' => 'List', 'atts' => 'values'],
		'core/quote'			=> ['name' => 'Quote', 'atts' => ['value', 'citation']],
		'core/preformatted'		=> ['name' => 'Preformatted', 'atts' => 'content'],
		'core/pullquote'		=> ['name' => 'Pullquote', 'atts' => ['value', 'citation']],
		'core/verse'			=> ['name' => 'Verse', 'atts' => 'content'],
		// NOTE: when is ready the processing of the attribute which is array
		// 'core/table'			=> ['name' => 'Table', 'atts' => ['caption', 'head', 'body', 'foot']],
	];

	private $wp_media_blocks = [
		'core/image'			=> ['name' => 'Image', 'atts' => 'caption'],
		'core/gallery'			=> ['name' => 'Gallery', 'atts' => 'caption'],
		'core/audio'			=> ['name' => 'Audio', 'atts' => 'caption'],
		'core/file'				=> ['name' => 'File', 'atts' => 'downloadButtonText'],
		'core/video'			=> ['name' => 'Video', 'atts' => 'caption'],
	];

	private $wp_design_blocks = [
		'core/button'			=> ['name' => 'Button', 'atts' => 'text'],
		'core/more'				=> ['name' => 'More', 'atts' => 'customText'],
	];

	private $wp_widgets_blocks = [
		'core/html'				=> ['name' => 'Custom HTML', 'atts' => 'content'],
		'core/search'			=> ['name' => 'Search', 'atts' => ['label', 'placeholder']],
	];

	private $wp_theme_blocks = [
		// as far as i understand, there is no content here, which requires translation
	];

	private $wp_embeds_blocks = [
		// as far as i understand, there is no content here, which requires translation
	];


	private function get_wp_supported_blocks() {
		return array_merge(
			$this->wp_text_blocks,
			$this->wp_media_blocks,
			$this->wp_design_blocks,
			$this->wp_widgets_blocks,
			$this->wp_theme_blocks,
			$this->wp_embeds_blocks
		);
	}
}
