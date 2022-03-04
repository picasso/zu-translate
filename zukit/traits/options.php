<?php

// Plugin Options Trait -------------------------------------------------------]

trait zukit_Options {

	public function options($with_check = false) {
		if($with_check) {
			$options = get_option($this->options_key);
			// Check whether we need to install an option, used during installation of plugin
			if($options === false || $this->get('debug_defaults')) {
				if($options && $this->get('debug_defaults')) {
					$debug_options = $options['_debug'] ?? null;
					$panel_options = $options['_panels'] ?? null;
				}
				$options = $this->reset_options(false);
				// keep '_debug' and '_panels' option groups even on reset
				$options['_debug'] = $debug_options ?? null;
				$options['_panels'] = $panel_options ?? null;
			}
			$this->options = $options;
		}
		return $this->options;
	}

	public function update_options($options = null) {
		return update_option($this->options_key, $options ?? $this->options);
	}

	public function initial_options($with_addons = true) {
		$options = $this->get('options') ?? [];
		if($with_addons) $this->extend_from_addons($options);
		// remove non-existing options from add-ons
		return $this->snippets('array_without_null', $options);
	}

	public function reset_options($with_addons = true) {
		$options = $this->get('options') ?? [];
		$this->update_options($options);
		$this->options = $options;
		if($with_addons) $this->reset_addons();
		return $this->options;
	}

	// If we remove from the options belonging to the add-on, then after the operation
	// we do not update the options - add-on will take care of this
	public function del_option($key, $addon_options = null) {
		$result = true;
		$options = is_null($addon_options) ? $this->options : $addon_options;
		if(array_key_exists($key, $options)) {
			unset($options[$key]);
			if(is_null($addon_options)) {
				$this->options = $options;
				$result = $this->update_options();
			}
		}
		return $result === false ? false : $options;
	}

	// if 'key' contains 'path' - then resolve it before update
	// when $this->path_autocreated is true then if a portion of path doesn't exist, it's created
	// if we set value for the options belonging to the add-on, then after the operation
	// we do not update the options - add-on will take care of this
	// if 'rewrite_array' is true then when assigning 'value' which is an array, we just assign it to the 'key'
	// but if 'rewrite_array' is false, then instead of assignment, we merge the values using 'array_replace_recursive'
	public function set_option($key, $value, $rewrite_array = false, $addon_options = null) {
		// $value cannot be undefined or null!
		if(!isset($value) || is_null($value)) return $options;
		$result = true;
		$options = is_null($addon_options) ? $this->options : $addon_options;
		// sets a value in a nested array based on path (if presented)
		$pathParts = explode('.', $key);
		$pathCount = count($pathParts);
		if($pathCount === 1 && !$rewrite_array && is_array($value)) {
			$options[$key] = array_replace_recursive($options[$key] ?? [], $value);
		} else {
			if($pathCount === 1) {
				$options[$key] = $value;
			} else {
				$lastKey = $pathParts[$pathCount-1];
				$current = &$options;
				foreach($pathParts as $pathKey) {
					if($pathCount === 1) break;
					if(!is_array($current)) {
						if($this->path_autocreated) $current = [];
						else return false;
					}
					$current = &$current[$pathKey];
					$pathCount--;
				}
				if(!is_array($current)) {
					if($this->path_autocreated) $current = [];
					else return false;
				}
				if(!$rewrite_array && is_array($value)) {
					$current[$lastKey] = array_replace_recursive($current[$lastKey] ?? [], $value);
				} else {
					$current[$lastKey] = $value;
				}
			}
		}

		if(is_null($addon_options)) {
			$this->options = $options;
			$result = $this->update_options();
		}
		return $result === false ? false : $options;
	}

	// If 'key' contains 'path' - then resolve it before get
	public function get_option($key, $default = null, $addon_options = null) {
		$options = is_null($addon_options) ? $this->options : $addon_options;

		// gets a value in a nested array based on path (if presented)
		$pathParts = explode('.', $key);
		$pathCount = count($pathParts);
		$set = $options;
		if($pathCount > 1) {
			$key = $pathParts[$pathCount-1];
			foreach($pathParts as $pathKey) {
				if($pathCount === 1) break;
				if(!is_array($set)) return $default;
				$set = $set[$pathKey] ?? null;
				$pathCount--;
			}
		}

		if(!isset($set[$key])) return $default;
		// if default was not set, or we have a complex type, then return without any cast
		if(is_null($default) || is_array($default)) return $set[$key];
		// return and cast to default value type
		if(is_bool($default)) return filter_var($set[$key], FILTER_VALIDATE_BOOLEAN);
		if(is_int($default)) return intval($set[$key]);

		return strval($set[$key]);
	}

	public function is_option($key, $check_value = true, $addon_options = null) {
		// can be the array of keys and then they will be checked by condition '&&'
		$keys = is_array($key) ? $key : [$key];
		$is_option = true;
		foreach($keys as $k) {
			// if key starts with '!' then negate the value
			$negate = substr($k, 0, 1) === '!';
	        $clean_key = str_replace('!', '', $k);
			$value = $this->get_option($clean_key, $this->def_value($check_value), $addon_options);
			$is_option = $is_option && (($negate ? !$value : $value) === $check_value);
		}
		return $is_option;
	}

	private function def_value($type) {
		// return default value for given type
		if(is_bool($type)) return false;
		if(is_int($type)) return 0;
		if(is_string($type)) return '';
		return null;
	}
}
