<?php
	
class TPLUS_Admin extends zuplus_Admin {
	
	private $qtx = null;
	
	protected function construct_more() {
		
		$this->qtx = new tplus_QTX($this->config_addon());
	}
	
	//
	// Should/Could be Redefined in Child Class ----------------------------------]
	//

	protected function options_defaults() { 
		return [
			'qtxseo'				=> false,
			'flags'				=> false,
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
