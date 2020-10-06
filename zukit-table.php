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
		$this->config['align'] = array_fill(0, $count, null);
		$this->config['style'] = array_fill(0, $count, null);
		$this->config['className'] = array_fill(0, $count, null);
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

	private function generate_cell($content, $style = null, $align = '') {
		$cell = ['content' => $content];
		if(!empty($align)) $cell['align'] = $this->align_cell($align);
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
				if($key === 'style')  $this->style_cell($value, $cell, $index);
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

	public function style($cells, $style = []) {
		$this->config($cells, 'style', $className);
	}

	public function cell($name, $content, $style = null, $align = '') {

		if($this->has($name)) {
			$this->row[$name] = $this->generate_cell(
				$content,
				$style,
				$align
			);
		}
	}

	public function iconcell($name, $dashicon, $svg = null, $tooltip = null, $style = null) {
		if($this->has($name)) {
			$icon = [];
			if(is_array($dashicon)) {
				$style = $svg ?? null;
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

	public function next_row() {
		$nextrow = [];
		foreach($this->cells as $cell => $val) {
			$nextrow[] = isset($this->row[$cell]) ? $this->row[$cell] : $this->empty_cell();
		}
		$this->rows[] = $nextrow;
		$this->row = [];
	}

	public function get() {
		return [
			'config'	=> $this->config,
			'headers'	=> array_values($this->cells),
			'rows'		=> $this->rows,
		];
	}
}
