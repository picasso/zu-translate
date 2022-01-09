<?php
trait zukit_Scripts {

    public $dir;
    public $uri;

    // We needed the ability to async or defer our scripts
    private $async_defer = [];

    protected function singleton_config_scripts() {
        $this->dir = get_stylesheet_directory();
        $this->uri = get_stylesheet_directory_uri();
        // maybe add attributes for asynchronously loading or deferring scripts.
        add_filter('script_loader_tag', [$this, 'modify_tag'], 10, 2);
    }

    // Scripts management -----------------------------------------------------]

    public function is_origin($get_root = false) {
        $root_dirname = dirname(self::$zukit_root);
        return $get_root ? $root_dirname : $root_dirname === ($this->dir.'/zukit');
	}

    public function zukit_dirname($subdir = null) {
        return dirname(self::$zukit_root).(empty($subdir) ? '' : '/'.ltrim($subdir, '/'));
	}

    public function get_zukit_filepath($is_style, $file, $absolute_marker = true) {
		$filename = sprintf($is_style ? '%2$s/%1$s.css' : '%2$s/%1$s.min.js', $file, $this->zukit_dirname('dist'));
		return $absolute_marker ? ('!'.$filename) : $filename;
	}

    public function get_filepath($is_style, $is_frontend, $file) {
        $dir = $is_frontend ? ($is_style ? 'css' : 'js') : ($is_style ? 'admin/css' : 'admin/js');
		return sprintf($is_style ? '/%2$s/%1$s.css' : '/%2$s/%1$s.min.js', $file, $dir);
	}

    public function get_full_filepath($file, $is_style = false, $is_frontend = false) {
        $filepath = $this->get_filepath($is_style, $is_frontend, $file);
		return $this->sprintf_dir($filepath);
	}

    public function get_version($filename = '', $refresh = false) {
        if(is_null($filename)) return null; // if set to null, no version is added
        return $refresh ? $this->filename_version($filename) : $this->version;
    }

    public function enqueue_style($file, $params = [], $handle_only = false) {
        return $this->style_or_script(true, true, array_merge($params, ['file' => $file, 'handle_only' => $handle_only]));
	}
    public function enqueue_script($file, $params = [], $handle_only = false) {
		return $this->style_or_script(false, true, array_merge($params, ['file' => $file, 'handle_only' => $handle_only]));
	}

	public function admin_enqueue_style($file, $params = []) {
		return $this->style_or_script(true, false, array_merge($params, ['file' => $file]));
	}
    public function admin_enqueue_script($file, $params = []) {
		return $this->style_or_script(false, false, array_merge($params, ['file' => $file]));
	}

    public function register_only($is_style, $is_frontend, $params) {
        $handle = $this->style_or_script($is_style, $is_frontend, array_merge($params, ['register_only' => true]));
        return $handle;
    }

    public function enqueue_only($is_style = null, $handle = null) {
        $handle = is_null($handle) ? $this->create_handle() : $handle;

        $style_handle = is_array($handle) ? ($handle[0] ?? null) : $handle;
        $script_handle = is_array($handle) ? ($handle[1] ?? null) : $handle;

        // if $is_style is null - then enqueue both (style and script)
        if($is_style === true || $is_style === null) wp_enqueue_style($style_handle);
        if($is_style === false || $is_style === null) wp_enqueue_script($script_handle);
    }

    protected function create_handle($file = null) {
        if(is_null($file)) $file = $this->prefix;
        $info = explode('.', pathinfo($file)['filename']);
        return $info[0];
    }

    public function modify_tag($tag, $handle) {
        if(in_array($handle, array_keys($this->async_defer))) {
            $attributes = sprintf(' %1$s></', $this->async_defer[$handle]);
            $tag = str_replace('></', $attributes, $tag);
         }
        return $tag;
    }

    private function style_or_script($is_style, $is_frontend, $params) {

        $params = array_merge([
            'file'          => null,
            'deps'          => [],
            'handle'        => null,
            'bottom'        => true,
            'data'          => null,
            'register_only' => false,
            'handle_only'   => false,
            'absolute'      => false,
            'async'         => false,
            'defer'         => false,
            'refresh'       => $this->debug,
            'media'         => 'all',
		], $params);

        extract($params, EXTR_OVERWRITE);

        if(is_null($handle)) $handle = $this->create_handle($file);
        if(is_null($file)) $file = $this->prefix;

        // if we use absolute path then $file should start with '!' or $absolute should be 'true'
        $is_absolute = $absolute === true || substr($file, 0, 1) === '!';
        $file = str_replace('!', '', $file);

        extract($this->get_filepath_and_src($is_absolute, $is_style, $is_frontend, $file), EXTR_OVERWRITE);

		if(is_null($filepath) || file_exists($filepath)) {
            // return $handle without enqueue or register
            if($handle_only) return $handle;
            // generate script/style version
			$version = $this->get_version($filepath, $refresh);
            // force $deps to be an array
            $deps = is_string($deps) ? [$deps] : $deps;
            if($register_only) {
                if($is_style) wp_register_style($handle, $src, $deps, $version, $media);
    			else wp_register_script($handle, $src, $deps, $version, $bottom);
            } else {
                if($is_style) wp_enqueue_style($handle, $src, $deps, $version, $media);
    			else wp_enqueue_script($handle, $src, $deps, $version, $bottom);
            }

            // by wrapping our $data values inside an inner array we prevent integer
            // and boolean values to be interpreted as strings
            // https://wpbeaches.com/using-wp_localize_script-and-jquery-values-including-strings-booleans-and-integers/
            if(!$is_style && !empty($data)) {
                $jsdata_name = $data['jsdata_name'] ?? $this->prefix_it('jsdata', '_');
                if(isset($data['jsdata_name'])) unset($data['jsdata_name']);
                wp_localize_script($handle, $jsdata_name, ['data' => $data]);
            }

            // async and defer functionality for WordPress
            if(!$is_style && ($async || $defer)) {
                $this->async_defer[$handle] = implode(' ', array_keys(array_filter(compact('async', 'defer'))));
            }

            // $this->logc('?SCRIPT TEST', basename($filepath), [
            //     '$handle'       => $handle,
            //     '$data'         => $data,
            //     '$refresh'      => $refresh,
            //     '$version'      => $version,
            //     '$deps'         => $deps,
            //     '$bottom'       => $bottom,
            // ]);

		} else {
            $this->logc('!No file found to enqueue!', basename($src), [
                'kind'          => $is_style ? 'CSS' : 'JS',
                'is_frontend'   => $is_frontend,
                'is_absolute'   => $is_absolute,
                '$params'       => $params,
                '$file'         => $file,
                '$filepath'     => $filepath,
                '$src'          => $src,
                '$handle'       => $handle,
                '$refresh'      => $refresh,

                'async_defer'   => $this->async_defer,
                'prefix'        => $this->prefix,
                'dir'           => $this->dir,
            ]);

            $handle = false;
        }
		return $handle;
	}

    private function get_filepath_and_src($is_absolute, $is_style, $is_frontend, $file) {

        $filepath = $src = null;
        // if path starts with 'http' or 'https' then treat it as external
        if(substr($file, 0, 4) === 'http') {
            $filepath = null;
            $src = $file;
        } else {
            if($is_absolute) {
                $filename = str_replace($this->dir, '', $file);
                if(substr($file, 0, 5) === 'zukit') {
                    $filepath = $this->get_zukit_filepath($is_style, $file, false);
                    $src = plugin_dir_url(self::$zukit_root).str_replace(plugin_dir_path(self::$zukit_root), '', $filepath);
                }
            } else {
                $filename = $this->get_filepath($is_style, $is_frontend, $file);
            }

            $filepath = empty($filepath) ? $this->dir.$filename : $filepath;
            $src = empty($src) ? $this->uri.$filename : $src;
        }

        return [
            'filepath'  => $filepath,
            'src'       => $src,
        ];
    }

    private function filename_version($filename) {
    	if(file_exists($filename)) return filemtime($filename);
    	return sprintf('%s', time());
    }
}
