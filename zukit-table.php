<?php

// Plugin Table Class ---------------------------------------------------------]

class zukit_Table {

	private $headers = [];
	private $align = ['left', 'center', 'right'];
	private $colors = [
		'red'		=> '#ff3358',
		'green'		=> '#5b9a68',
		'blue'		=> '#00aced',
		'violet'	=> '#bc2a8d',
		'orange'	=> '#fb8f3d',
	];

	private $config = ['align' => [], 'style' => [], 'className' => []];
	private $cells = [];
	private $row = [];
	private $rows = [];

	public function __construct($cells = []) {
		foreach($cells as $cell) {
			$this->cells[$cell] = $this->generate_cell(ucwords($cell));
		}

		$count = count($this->cells);
		$this->config['template'] = "repeat(${columns}, 1fr)";
		$this->config['align'] = array_fill(0, $count, null);
		$this->config['style'] = array_fill(0, $count, null);
		$this->config['className'] = array_fill(0, $count, '');

		foreach($this->cells as $cell => $content) {
			$this->config($cell, 'className', "cell__$cell");
		}
	}

	private function cell_index($cell) {
		return isset($this->cells[$cell]) ? array_search($this->cells[$cell], array_values($this->cells)) : false;
	}

	private function has($cell) {
		return isset($this->cells[$cell]);
	}

	private function align_cell($align = 'left') {
		return in_array($align, $this->align) ? $align : 'left';
	}

	private function params_for_cell($params) {
		$params = is_array($params) ? $params : [$params];
		$validated = [];
		foreach($params as $key => $value) {
			if($value === 'markdown') $validated[$value] = true;
			else if($key === 'link' && is_array($value) && zu_snippets()->validate_url($value[0])) {
				$validated['link'] = [
					'href'	=> $value[0],
					'title' => $value[1] ?? ''
				];
			} else {
				$validated[$key] = $value;
			}
		}
		return empty($validated) ? null : $validated;
	}

	private function color_cell(&$style) {
		if(isset($style['color'])) {
			$color = $style['color'];
			$style['color'] = in_array($color, array_keys($this->colors)) ? $this->colors[$color] : $color;
		}
	}

	private function style_cell($style, &$cell, $config_index = false) {
		if(is_array($style)) {
			$this->color_cell($style);
			if($config_index !== false) $this->config['style'][$config_index] = $style;
			else $cell['style'] = $style;
		}
	}

	private function generate_cell($content, $style = null, $align = null, $params = null) {
		$cell = ['content' => $content];
		if(!empty($align)) $cell['align'] = $this->align_cell($align);
		if(!empty($params)) $cell['params'] = $this->params_for_cell($params);
		$this->style_cell($style, $cell);
		return $cell;
	}

	private function empty_cell() {
		return $this->generate_cell('');
	}

	private function config($cells, $key, $value) {
		if(is_string($cells)) $cells = [$cells];
		foreach($cells as $cell) {
			$index = $this->cell_index($cell);
			if($index !== false) {
				if($key === 'style') $this->style_cell($value, $cell, $index);
				else if($key === 'className') $this->config[$key][$index] .= ' '.$value;
				else $this->config[$key][$index] = $value;
			}
		}
	}

	public function align($cells, $align = 'left') {
		$this->config($cells, 'align', $this->align_cell($align));
	}

	public function classes($cells, $className = null) {
		$this->config($cells, 'className', $className);
	}

	public function strong($cells) {
		$this->config($cells, 'className', '__zu_strong');
	}

	public function as_icon($cells) {
		$this->config($cells, 'className', '__zu_icon');
	}

	public function fit_content($cells) {
		$this->config($cells, 'className', '__zu_fitcontent');
	}

	public function minmax($cells, $min, $max = '1fr') {
		$this->config($cells, 'className', "__zu_minmax($min,$max)");
	}

	public function fix_width($cells, $styles = null) {
		$this->config($cells, 'className', '__zu_fixwidth');
		if(is_string($cells)) $cells = [$cells];
		if(is_string($styles)) $styles = [$styles];
		foreach($cells as $key => $cell) {
			$index = $this->cell_index($cell);
			$width = $styles[$key] ?? null;
			if($index !== false && $width) {
				$this->style_cell(['width' => $width], $cell, $index);
			}
		}
	}

	public function style($cells, $style = []) {
		$this->config($cells, 'style', $style);
	}

	public function cell($name, $content, $style = null, $align = null, $params = null) {
		if($this->has($name)) {
			$this->row[$name] = $this->generate_cell(
				$content,
				$style,
				$align,
				$params
			);
		}
	}

	public function cell_with_params($name, $content, $params) {
		if($this->has($name)) {
			$this->row[$name] = $this->generate_cell(
				$content,
				null,
				null,
				$params
			);
		}
	}

	public function icon_cell($name, $dashicon, $svg = null, $tooltip = null, $style = null) {
		if($this->has($name)) {
			$icon = [];
			if(is_array($dashicon)) {
				$style = $dashicon['style'] ?? null;
				$tooltip = $dashicon['tooltip'] ?? null;
				$svg = $dashicon['svg'] ?? null;
				$dashicon = $dashicon['dashicon'] ?? null;
			}

			if($tooltip) $icon['tooltip'] = $tooltip;
			if($dashicon) $icon['dashicon'] = $dashicon;
			if($svg) $icon['svg'] = $svg;
			$this->row[$name] = $this->generate_cell(
				$icon,
				$style
			);
		}
	}

	public function markdown_cell($name, $content, $align = null, $style = null) {
		if($this->has($name)) {
			$this->row[$name] = $this->generate_cell(
				$content,
				$style,
				$align,
				'markdown'
			);
		}
	}

	public function link_cell($name, $href, $title = '', $align = null, $style = null) {
		if($this->has($name)) {
			$this->row[$name] = $this->generate_cell(
				$title,
				$style,
				$align,
				['link' => [$href, $title]]
			);
		}
	}

	public function dynamic_cell($name, $params = [], $defaultContent = null, $className = null) {
		if($this->has($name)) {
			$this->row[$name] = $this->generate_cell(
				$defaultContent,
				null,
				null,
				[
					'dynamic'	=> array_merge($params, array_key_exists('id', $params ?? []) ? [] : ['id' => $name]),
					'className'	=> $className,
				]
			);
		}
	}

	public function cell_with_class($name, $content, $className) {
		if($this->has($name)) {
			$this->row[$name] = $this->generate_cell(
				$content,
				null,
				null,
				['className' => $className]
			);
		}
	}

	public function next_row() {
		$nextrow = [];
		foreach($this->cells as $cell => $val) {
			$nextrow[] = isset($this->row[$cell]) ? $this->row[$cell] : $this->empty_cell();
		}
		$this->rows[] = $nextrow;
		$this->row = [];
	}

	public function get($with_headers = true) {
		$this->update_grid_template();
		return array_filter([
			'config'	=> $this->config,
			'headers'	=> $with_headers ? array_values($this->cells) : null,
			'rows'		=> $this->rows,
		]);
	}

	private function update_grid_template() {
		$grid = [];
		foreach($this->config['className'] as $index => $className) {
			$column = strpos($className, '__zu_icon') !== false ? 'minmax(auto, 80px)' : '1fr';
			if(strpos($className, '__zu_fixwidth') !== false) {
				$column = $this->config['style'][$index]['width'] ?? '1fr';
				unset($this->config['style'][$index]['width']);
			}
			if(strpos($className, '__zu_fitcontent') !== false) {
				$column = 'max-content';
				$className = str_replace('__zu_fitcontent', '', $className);
				$this->config['className'][$index] = $className;
			}
			if(strpos($className, '__zu_minmax') !== false) {
				$regex = '/__zu_(minmax[^)]+\))/';
				$column = preg_match($regex, $className, $matches) ? $matches[1] : '1fr';
				$className = trim(preg_replace($regex, '', $className));
				$this->config['className'][$index] = $className;
			}
			$this->config['className'][$index] = preg_replace('/\s+/', ' ', $className);
			$grid[] = $column;
		}
		$this->config['template'] = implode(' ', $grid);
	}
}
