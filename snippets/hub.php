<?php
include_once('traits/slugs.php');
include_once('traits/thumbnails.php');
include_once('traits/lang.php');
include_once('traits/inline.php');
include_once('traits/minify.php');
include_once('traits/date.php');
include_once('traits/content.php');
include_once('traits/loader.php');
include_once('traits/useful.php');

class zukit_Snippets extends zukit_Singleton {

	use zusnippets_Content,
		zusnippets_Date,
		zusnippets_InlineStyle,
		zusnippets_Lang,
		zusnippets_Loader,
		zusnippets_Minify,
		zusnippets_Slugs,
		zusnippets_Thumbnails,
		zusnippets_Useful;

	protected function construct_more() {
		$this->prefix = 'zu_snippets';
        $this->version = '1.1.1';
		$this->init_advanced_style();
	}

	// Classes manipulations --------------------------------------------------]

	public function split_classes($classes, $as_is = false) {
		$classes = is_array($classes) ? $classes : preg_split('/[\s,]+/', $classes);
		$classes = array_map('trim', $classes);
		return $as_is ? $classes : array_unique(array_filter($classes));
	}

	public function merge_classes($classes, $join = true) {
		$classes = $this->split_classes($classes, $join ? false : true);
		return $join ? implode(' ', $classes) : $classes;
	}

	public function remove_classes($classes, $remove = [], $join = true) {
		$classes = $this->split_classes($classes);
		foreach($remove as $test) if(in_array($test, $classes)) unset($classes[array_search($test, $classes)]);
		return $join ? implode(' ', $classes) : $classes;
	}

	public function add_body_class($my_classes, $prefix = '') {
		add_filter('body_class', function($classes) use ($my_classes, $prefix) {
			$my_classes = $this->split_classes($my_classes);
			// add prefix to all classes
			if(!empty($prefix)) $my_classes = preg_filter('/^/', $prefix, $my_classes);
			// remove all already existing classes
			$my_classes = $this->remove_classes($my_classes, $classes, false);

			$classes[] = $this->merge_classes($my_classes);
			return $classes;
		});
	}

	public function add_admin_body_class($my_classes) {
		add_filter('admin_body_class', function($classes) use ($my_classes) {
			$classes = $this->split_classes($classes);
			$my_classes = $this->remove_classes($my_classes, $classes, false);
		    return $this->merge_classes(array_merge($classes, $my_classes));
		});
	}
}

// Common Interface to helpers ------------------------------------------------]

if(!function_exists('zu_snippets')) {
	function zu_snippets() {
		return zukit_Snippets::instance();
	}
}

// A special version of the 'sprintf' function that removes the extra spaces
// from the format string resulting from the 'human-readable' HTML template

if(!function_exists('zu_sprintf')) {
	function zu_sprintf($format, ...$params) {
		// remove multiple space inside tags
		if(preg_match_all('/(<[^>]+?>)/', $format, $matches)) {
			  foreach($matches[1] as $tag) {
			      $tag_compressed = preg_replace('/\s+/', ' ', $tag);
			      $format = str_replace($tag, $tag_compressed, $format);
			  }
		  }
		// remove empty space between tags
		$format = preg_replace('/>\s+</', '><', $format);
		// remove empty space after format directive and before opening tag
		$format = preg_replace('/\$s\s+</', '$s<', $format);
		// remove empty space after closing tag and before format directive
		$format = preg_replace('/>\s+\%/', '>%', $format);

		array_unshift($params, $format);
		return call_user_func_array('sprintf', $params);
	}

	function zu_printf(...$params) {
		$output = call_user_func_array('zu_sprintf', $params);
		print($output);
	}
}
