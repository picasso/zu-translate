<?php
trait zusnippets_Useful {

	// Useful functions -------------------------------------------------------]

	public function format_bytes($bytes, $precision = 0, $approximately_sign = false, $template = null) {
	    $units = array('Bytes', 'KB', 'MB', 'GB', 'TB');
		$sign = $approximately_sign && $bytes !== 0 ? '~' : '';

	    $bytes = max($bytes, 0);
	    $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
	    $pow = min($pow, count($units) - 1);

	    $bytes /= pow(1024, $pow);
		$format = $template ?? '%s %s';

	    return $sign . sprintf($format, round($bytes, $precision), $units[$pow]);
	}

	public function insert_svg_from_file($path, $name, $params) {

		$params = array_merge([
            'preserve_ratio'	=> false,
            'strip_xml'			=> false,
            'subdir'			=> '',
		], $params);

        extract($params, EXTR_OVERWRITE);

		$filepath = sprintf(
			'%1$s/%3$s%4$s%2$s.svg',
			untrailingslashit($path),
			$name,
			trim($subdir, '/\\'),
			empty($subdir) ? '' : '/'
		);
		if(!file_exists($filepath)) {
			$this->logc('?SVG file not found!', [
				'path'		=> $path,
				'name'		=> $name,
				'params'	=> $params,
				'filepath'	=> $filepath,
			]);
			return '';
		}

		$svg = file_get_contents($filepath);
		if($preserve_ratio && stripos($svg, 'preserveAspectRatio') === false) {
			$svg = preg_replace('/<svg([^>]+)>/i', '<svg${1} preserveAspectRatio="xMidYMin slice">', $svg);
		}

		if($strip_xml) {
			$svg = preg_replace('/\n/m', '', $svg);
			$svg = preg_replace('/^.*?<svg/i', '<svg', $svg);
			$svg = preg_replace('/^<svg[^>]+viewBox="([^\"]+)[^>]*/', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="$1"', $svg);
		}
		return $this->remove_space_between_tags($svg);
	}

	// Checks the validity of the URL
	// With default parameters, URLs without protocol and domain are considered valid (relative URLs)
	// using arguments, you can specify whether the presence of the domain and the protocol is necessary
	public function validate_url($value, $maybe_without_domain = true, $maybe_without_protocol = true) {
		$protocol = preg_match('#^https?://#i', $value) ? preg_replace('#(^https?://)(.*)#i', '$1', $value) : '';
		$domain_missing = !preg_match('#((?:(?:(?:\w[\.\-\+]?)*)\w)+)((?:(?:(?:\w[\.\-\+]?){0,62})\w)+)\.(\w{2,6})#', $value);
		$site_url = ltrim(get_site_url(null, '', 'http'), 'http://');

		$test_url = sprintf('%1$s%2$s%3$s',
			$maybe_without_protocol && empty($protocol) ? 'https://' : $protocol,
			empty($protocol) && $maybe_without_domain && $domain_missing ? $site_url : '',
			str_replace($protocol, '', $domain_missing ? preg_replace('#^([^/])#', ' $1', $value) : $value)
		);
		return filter_var($test_url, FILTER_VALIDATE_URL) !== false;
	}

	public function to_bool($value, $null_on_failure = false) {
		return filter_var($value, FILTER_VALIDATE_BOOLEAN, $null_on_failure ? FILTER_NULL_ON_FAILURE : null);
	}

	public function to_float($value) {
		return filter_var($value, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
	}

	public function int_in_range($intval, $min, $max) {

		$intval = filter_var($intval,
		    FILTER_VALIDATE_INT,
		    array(
		        'options' => array(
		            'min_range' => $min,
		            'max_range' => $max
		        )
		    )
		);
		return $intval === false ? $min : $intval;
	}

	public function cast($values, $types) {
		if(is_array($types) && is_array($values)) {
			foreach($types as $key => $type) {
				if(array_key_exists($key, $values)) {
					if($type === 'bool') $values[$key] = $this->to_bool($values[$key]);
					else if($type === 'int') $values[$key] = absint($values[$key]);
					else if($type === 'float') $values[$key] = $this->to_float($values[$key]);
					else if(is_array($type)) $values[$key] = $this->int_in_range(
						$values[$key],
						$type[0] ?? 0,
						$type[1] ?? PHP_INT_MAX
					);
				}
			}
		}
		return $values;
	}

	// if keys are given that need to be converted to the boolean type
	public function cast_bool($values, $keys) {
		if(!empty($keys)) {
			if(is_string($keys)) $keys = [$keys];
			return $this->cast($values, array_fill_keys($keys, 'bool'));
		}
		return $values;
	}

	public function shortcode_atts_with_cast($pairs, $atts, $types, $shortcode = '') {
		$fixed_atts = $this->is_assoc_array($types) ? $this->cast($atts, $types) : $this->cast_bool($atts, $types);
		return shortcode_atts($pairs, $fixed_atts, $shortcode);
	}

	public function blank_data_uri_img() {
		return 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
	}

	public function translit($string) {
	    $rus = [
			'А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ё', 'Ж', 'З', 'И', 'Й', 'К', 'Л', 'М',
			'Н', 'О', 'П', 'Р', 'С', 'Т', 'У', 'Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Щ', 'Ъ',
			'Ы', 'Ь', 'Э', 'Ю', 'Я', 'а', 'б', 'в', 'г', 'д', 'е', 'ё', 'ж', 'з',
			'и', 'й', 'к', 'л', 'м', 'н', 'о', 'п', 'р', 'с', 'т', 'у', 'ф', 'х',
			'ц', 'ч', 'ш', 'щ', 'ъ', 'ы', 'ь', 'э', 'ю', 'я',
		];
	    $lat = [
			'A', 'B', 'V', 'G', 'D', 'E', 'E', 'Gh', 'Z', 'I', 'Y', 'K', 'L', 'M',
			'N', 'O', 'P', 'R', 'S', 'T', 'U', 'F', 'H', 'C', 'Ch', 'Sh', 'Sch',
			'Y', 'Y', 'Y', 'E', 'Yu', 'Ya', 'a', 'b', 'v', 'g', 'd', 'e', 'e',
			'gh', 'z', 'i', 'y', 'k', 'l', 'm', 'n', 'o', 'p', 'r', 's', 't',
			'u', 'f', 'h', 'c', 'ch', 'sh', 'sch', 'y', 'y', 'y', 'e', 'yu', 'ya',
		];
	    return str_replace($rus, $lat, $string);
	}
}
