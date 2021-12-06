<?php
trait zusnippets_Curve {

	private $curves = [
		'downleftinverse'	=> [
			'M100,0 L100,%1$s L0,%1$s L0,0 L100,0 z M100,0 L0,0 C20,135 50,0 100,0 z',
			1, 0
		],
		'upright'	=> [
			'M0 %1$s C 50 0 80 -%2$s 100 %1$s Z',
			1, 0.33
		],
		'upleft'	=> [
			'M0 %1$s C 20 -%2$s 30 0 100 %1$s Z',
			1, 0.33
		],
		'downleft'	=> [
			'M0 0 C 20 %1$s 50 0 100 0 Z',
			2, 0
		],
		'downright'	=> [
			'M0 0 C 50 0 80 %1$s 100 0 Z',
			2, 0
		],
		'lessdownleft'	=> [
			'M0 0 C 20 %1$s 50 0 100 0 Z',
			1.33, 0
		],
		'lessdownright'	=> [
			'M0 0 C 50 0 80 %1$s 100 0 Z',
			1.33, 0
		],
	];

	// SVG curves -------------------------------------------------------------]

	public function curve($look = 'upright', $curve_height = 100, $params = []) {
		$height = intval(str_replace('px', '', $curve_height));
		$template = $this->curves[$look] ?? $this->curves['upright'];
		$path = sprintf($template[0] ?? '', intval($height * ($template[1] ?? 1)), intval($height * ($template[2] ?? 1)));

		$params = $this->array_with_defaults($params, [
			'raw'					=> false,
            'defaultClassName'		=> 'curve',
			'className'				=> null,
			'id'					=> null,
			'preserveAspectRatio'	=> 'none',
			'style'					=> [],
			'width'					=> '100%',
		]);
        extract($params, EXTR_OVERWRITE);

		$style = array_merge([
			'padding'	=> 0,
			'margin'	=> 0,
			'position'	=> 'relative',
			'top'		=> '-1px',
			'fill'		=> 'currentColor',
			'stroke'	=> 'transparent',
		], $style);
		$style = $this->build_style($style);
		$inverseClass = in_array($look, ['downleft', 'downright', 'lessdownleft', 'lessdownright']) ? 'inverse' : null;

		$curve = zu_sprintf(
			'<svg xmlns="http://www.w3.org/2000/svg"
				version="1.1"
				width="%1$s"
				height="%2$spx"
				style="%3$s"
				viewBox="0 0 100 %2$s"
				preserveAspectRatio="%4$s"
			>
				<path d="%5$s"></path>
			 </svg>',
			$width,
			$height,
			$style,
			$preserveAspectRatio,
			$path
		);
		return $raw ? $curve : zu_sprintf(
			'<div%1$s class="%2$s" style="height:%3$spx">%4$s</div>',
			empty($id) ? '' : sprintf(' id="%1$s"', $id),
			$this->merge_classes([$defaultClassName, $className, $inverseClass]),
			$height, //($height - 1),
			$curve
		);
	}

	public function add_curve($name, $template, $ratios = [1, 0]) {
		$this->curves[$name] = $this->array_flatten([$template, $ratios]);
	}
}
