<?php
trait zusnippets_InlineStyle {

    private $advanced_style = [];
	private $admin_style = [];
	private $fonts = [];
    private $without_minify = false;

    private function init_advanced_style() {
        if(is_admin()) add_action('admin_footer', [$this, 'maybe_add_advanced_styles']);
		else add_action('wp_footer', [$this, 'maybe_add_advanced_styles']);
    }

    // Inline styles to the footer if needed ----------------------------------]

	public function add_advanced_style($name, $style) {
		if(!empty($name)) {
			$this->advanced_style[] = ['name' => $name, 'style' => $style];
		}
	}

	public function add_admin_style($name, $style) {
		if(!empty($name)) {
			$this->admin_style[] = ['name' => $name, 'style' => $style];
		}
	}

	public function add_fonts_style($font_list, $dir, $uri) {
		if(is_array($font_list)) $this->fonts['list'] = $font_list;
		if(!empty($dir)) $this->fonts['dir'] = $dir;
		if(!empty($uri)) $this->fonts['uri'] = $uri;

		$this->fonts = array_merge([
            'list'  => [],
            'dir'   => '',
            'uri'   => ''
        ], $this->fonts);
	}

	public function add_style_from_file($css_file) {

		if(!file_exists($css_file)) return;
		$style = file_get_contents($css_file);

		if(!empty($style)) $this->add_advanced_style('_responsive', $style);
	}

	public function maybe_add_advanced_styles() {

		$advanced_style = '';

		foreach($this->admin_style as $style_data) {
			// if '_responsive' then insert CSS without processing
			if(stripos($style_data['name'], '_responsive') !== false) $advanced_style .= $style_data['style'];
			else $advanced_style .= sprintf('%1$s { %2$s}', $style_data['name'], $style_data['style']);
		}

		foreach($this->advanced_style as $style_data) {
			// if '_responsive' then insert CSS without processing
			if(stripos($style_data['name'], '_responsive') !== false) $advanced_style .= $style_data['style'];
			else $advanced_style .= sprintf('%1$s { %2$s}', $style_data['name'], $style_data['style']);
		}

		if(!empty($this->fonts)) {
			foreach($this->fonts['list'] as $page => $file) {
				if(is_page($page)) {
					$filename = $this->fonts['dir'].$file;
					if(file_exists($filename)) {
						$advanced_style .= preg_replace('/%%path%%/i', $this->fonts['uri'], file_get_contents($filename));
					}
				}
			}
		}

    	if(!empty(trim($advanced_style))) {
    		printf(
                '<style type="text/css" id="zu-advanced-styles">%1$s</style>',
                $this->without_minify ? $advanced_style : $this->minify_css($advanced_style)
            );
    	}
    }
}
