<?php
trait zukit_BlockMeta {

	// 'object_subtype'		- 	A subtype; e.g. if the object type is "post", the post type.
	//							If left empty, the meta key will be registered on the entire object type
	// 'show_in_rest'		- 	Whether data associated with this meta key can be considered public and should be accessible via the REST API.
	// 							A custom post type must also declare support for custom fields for registered meta to be accessible via REST.
	// 							When registering complex meta values this argument may optionally be an array with 'schema' or 'prepare_callback' keys instead of a boolean.
	// 'type' 				-	Valid values are 'string', 'boolean', 'integer', 'number', 'array', and 'object'.
	// 'single' 			-	Whether the meta key has one value per object, or an array of values per object.

	protected function block_metakeys() {

		// NB:	'show_in_rest' => true will be added to all meta

		// Examples -----------------------------------------------------------]

		// return [
		//	// Copyright meta
		// 	[
		// 		'key'				=> 'zu_text_copy',
		// 		'object_subtype'	=> 'page',
		// 		'type'				=> 'string',
		// 		'single'			=> true,
		// 	],
		//
		// 	// Video meta
		// 	[
		// 		'key'				=> 'zu_video_cameraman',
		// 		'object_subtype'	=> 'post',
		// 		'type'				=> 'string',
		// 		'single'			=> true,
		// 	],
		//
		// 	// Sidebar Settings meta
		// 	// NB
		// 	// https://make.wordpress.org/core/2019/10/03/wp-5-3-supports-object-and-array-meta-types-in-the-rest-api/
		//
		// 	[
		// 		'key'				=> 'zu_sidebar_settings',
		// 		'object_subtype'	=> null,
		// 		'single'			=> true,
		// 		'type'				=> 'object',
		// 		'show_in_rest' 		=> [
		// 			'schema' => [
		// 				'type'		=> 'object',
		// 				'properties' => [
		// 					'highlighted'	=> ['type' => 'boolean'],
		// 				 	'usefont'		=> ['type' => 'boolean'],
		// 				],
		// 			],
		// 		],
		// 	],
		// ];
	}

	protected function register_metakeys() {
		// Get all block meta
		$this->metakeys = $this->block_metakeys() ?? [];

		if(empty($this->metakeys)) return;

		foreach($this->metakeys as $meta) {

			$meta_key = isset($meta['key']) ? $meta['key'] : null;
			if(empty($meta_key)) continue;

			$settings = $meta;
			if(!isset($settings['show_in_rest'])) $settings['show_in_rest'] = true;
			unset($settings['key']);

			register_meta('post', $meta_key, $settings);
		}
	}
}
