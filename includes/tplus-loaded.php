<?php
//
// This file loaded only when all parent classes are loaded from plugin
//	

class Translate_Plus extends zuplus_Plugin  {

	protected function extend_config() {
		return  [
			'prefix'					=> 	'tplus',
			'admin'					=> 	'TPLUS_Admin',
			'plugin_file'			=> 	__TPLUS_FILE__,
			'plugin_name'		=>	TPLUS_NAME,
			'version'				=> 	TPLUS_VERSION,
			'options_nosave'	=>	[],
		];
	}
	
	public function init() {

		$this->defaults();
// 		add_shortcode('lang-select', 'tplus_shortcode');	
	}
}

// Helpers --------------------------------------------------------------------]

function tplus_instance() { 
	return Translate_Plus::instance(); 
}

function tplus_options() {
	return tplus_instance()->options();
}

// Additional Classes & Functions ---------------------------------------------]

require_once(__TPLUS_ROOT__ . 'includes/tplus-functions.php');
require_once(__TPLUS_ROOT__ . 'includes/tplus-admin.php');
require_once(__TPLUS_ROOT__ . 'includes/tplus-qtx.php');
