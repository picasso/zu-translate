<?php
	
class TPLUS_Admin extends zuplus_Admin {
	
	private $qtx = null;
	
	protected function construct_more() {
		
		$this->qtx = new tplus_QTX($this->config_addon());
	}
	
	//
	// Should/Could be Redefined in Child Class ----------------------------------]
	//

	// 	To modify menu and submenu you should pass array with optional keys  ['reorder', 'rename', 'remove', 'separator']
	//		If presented key should array of array with the following keys
	//		'menu'					- item-slug
	//		'new_index'			- new item position
	//		'after_index'			- item position will be after item with this slug
	//		'after_index2'		- item position will be after item with this slug + 1 (the space could be used for separator later)
	//		'before_index'		- item position will be before item with this slug
	//		'before_index2'		- item position will be before item with this slug - 1 (the space could be used for separator later)
	//		'new_name'			- new item name
	//		'parent'					- parent menu slug (if absent then  'options-general.php' will be used)

	protected function custom_admin_submenu() {

		return [
			'reorder'	=>	[
				[
					'menu'					=> 	'qtranslate-x',
					'after_index2'		=>	'cplus-settings',
				],
				[
					'menu'					=> 	'tplus-settings',
					'after_index'			=>	'qtranslate-x',
				],
			],
			'rename'	=>	[
				[
					'menu'					=> 	'qtranslate-x',
					'new_name'			=>	'qTranslate-X',
				],
			],
			'separator'	=>	[
				[
					'before_index'		=> 	'qtranslate-x',
				],
			],
		];
	}

	protected function options_defaults() { 
		return [
			'qtxseo'				=> false,
			'flags'				=> false,
			'media_details'	=> false,
			'ls_frontend' 		=> true, 
			'ls_menu' 			=> true, 
			'ls_display' 		=> 'lang', 
		]; 
	}

	public function meta_boxes_more($settings_page, $no_default_boxes) {

		// Custom Boxes -------------------------------------------------------------]
		
		$this->form->add_meta_box('tplus-switcher', __('Language Switcher', 'tplus-plugin'), [$this, 'print_lang_switcher']);
	}

	public function status_callback() {

		return sprintf('
			<p><strong>qTranslate-X</strong> - version %1$s</p>', 
			defined('QTX_VERSION') ? QTX_VERSION : '??'
		);
	}
	
	public function validate_options($input) {
		
		$new_values = parent::validate_options($input);
		$new_values['ls_display'] = in_array($input['ls_display'], ['lang', 'code']) ? $input['ls_display'] : 'lang';
		return $new_values;
	}

	public function print_options($post) {

		$this->form->checkbox('flags', 'Show flags in buttons?');
		$this->form->checkbox('media_details', 'Support for Language Switcher in Media Details?', 'You cannot edit the fields when viewing the modal dialog.');
		$this->form->checkbox('qtxseo', 'Include support for Yoast SEO Plugin?', 'The Yoast SEO should be activated.');

		echo $this->form->fields('The plugin extend functionality of qTranslate-X plugin.');
		echo $this->form->print_save_mobile();
	}
	
	public function print_lang_switcher($post) {

		$this->form->checkbox('ls_frontend', 'Swither on Front-End?');
		$this->form->checkbox('ls_menu', 'Swither in Menu?', 'The switcher should be added in menu to be displayed.');
		$this->form->select('ls_display', 'Display in Menu', [	
			'lang' 	=> 'Language Name', 
			'code' 	=> 'Language Code', 
		], 'How the language will be dispayed in menu');

		echo $this->form->fields('Customization & settings for Language Switcher.');
	}
}
