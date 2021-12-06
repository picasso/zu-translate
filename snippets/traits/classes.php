<?php
trait zusnippets_Classes {

    // Classes manipulations --------------------------------------------------]

	public function split_classes($classes, $as_is = false) {
		$classes = is_array($classes) ? $this->array_flatten($classes) : preg_split('/[\s,]+/', $classes);
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
			$my_classes = $this->prefix_an_clean_class($classes, $my_classes, $prefix);
			$classes[] = $this->merge_classes($my_classes);
			return array_filter($classes);
		});
	}

	public function add_admin_body_class($my_classes, $prefix = '') {
		add_filter('admin_body_class', function($classes) use ($my_classes, $prefix) {
			$classes = $this->split_classes($classes);
			$my_classes = $this->prefix_an_clean_class($classes, $my_classes, $prefix);
		    return $this->merge_classes(array_merge($classes, array_filter($my_classes)));
		});
	}

	private function prefix_an_clean_class($classes, $my_classes, $prefix) {
		$my_classes = $this->split_classes($my_classes);
		// add prefix to all classes
		if(!empty($prefix)) $my_classes = preg_filter('/^/', $prefix, $my_classes);
		// remove all already existing classes
		return $this->remove_classes($my_classes, $classes, false);
	}
}
