<?php
trait zusnippets_Useful {

	// Useful functions -------------------------------------------------------]

	public function array_prefix($array, $prefix, $use_keys = false) {
		return array_map(
				function($v) use($prefix) { return $prefix.$v; },
				$use_keys ? array_keys($array) : $array
		);
	}

	public function array_prefix_keys($array, $prefix) {
		return array_combine(
			$this->array_prefix($array, $prefix, true),
			$array
		);
	}

	public function format_bytes($bytes, $precision = 0) {
	    $units = array('Bytes', 'Kb', 'Mb', 'Gb', 'Tb');

	    $bytes = max($bytes, 0);
	    $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
	    $pow = min($pow, count($units) - 1);

	    $bytes /= pow(1024, $pow);

	    return round($bytes, $precision) . ' ' . $units[$pow];
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
		if(!file_exists($filepath)) return '';

		$svg = file_get_contents($filepath);
		if($preserve_ratio && stripos($svg, 'preserveAspectRatio') === false) {
			$svg = preg_replace('/<svg([^>]+)>/i', '<svg${1} preserveAspectRatio="xMidYMin slice">', $svg);
		}

		if($strip_xml) {
			$svg = preg_replace('/.+<svg/ims', '<svg', $svg);
			$svg = preg_replace('/<svg[^>]+viewBox="([^\"]+)[^>]*/ims', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="$1"', $svg);
		}

		return $this->remove_space_between_tags($svg);
	}

	public function to_bool($value) {
		return filter_var($value, FILTER_VALIDATE_BOOLEAN);
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

	public function shortcode_atts_with_cast($atts, $pairs, $types, $shortcode = '') {
		return shortcode_atts($pairs, $this->cast($atts, $types), $shortcode);
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
