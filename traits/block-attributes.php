<?php
trait zukit_BlockAttributes {

	protected function block_attributes() {

		// Examples -----------------------------------------------------------]

		// return [
		// 	[
		// 		'name'			=> 'my/excerpt',
		// 		'no_excerpt'	=> true,
		// 		'shortcode'		=> 'my_excerpt_shortcode',
		// 		'attributes'	=> [
		// 				'post_type'			=> [
		// 					'type'		=> 'string',
		// 					'default'   => 'page',
		// 				],
		// 				'ids'			=> [
		// 					'type'		=> 'string',
		// 					'default'   => '0',
		// 				],
		// 				'border'	=> [
		// 					'type'		=> 'string',
		// 					'default'   => 'normal',
		// 				],
		// 				'thumb'	=> [
		// 					'type'		=> 'boolean',
		// 					'default'   => true,
		// 				],
		// 		],
		// 	],
		// ];
	}

	// NOTE: смысл функции уже непонятен... видимо осталось с момента создания и потом структура данных изменилась...
	// удалить после проверок
	protected function shortcode_func($name) {
		$blocks = array_values(array_filter($this->attributes, function ($item) use ($name) { return ($item['name'] == $name); }));
		return empty($blocks) ? '' : $blocks[0]['shortcode'];
	}

	// NOTE: функция как бы не нужна... зачем создавать лишний коллбэк?
	protected function render_func($block) {
		$func_name = $block['render_callback'] ?? $block['shortcode'] ?? null;

		// $this->shortcode_func($name);
		if(!is_callable($func_name)) return null;

		$render_func = function($atts, $context) use($func_name) {
			$is_edit = isset($_GET['action']) && $_GET['action'] === 'edit';
			// _dbug($atts, $context, $is_edit);
			// _dbug($_GET);

			$shortcode = call_user_func($func_name, $atts, $context);

			// if(empty($shortcode)) return sprintf('Nothing to display. Select a %s', $atts['post_type']);
			// _dbug($shortcode);

			return $shortcode;
		};

		return $render_func;
	}

	protected function no_excerpt() {
		$names = [];
		if(empty($this->attributes)) return $names;

		foreach($this->attributes as $block) {
			if(isset($block['name']) && isset($block['no_excerpt']) && $block['no_excerpt']) $names[] = $block['name'];
		}
		return $names;
	}

	protected function register_blocks_with_attributes() {
		// Get all block attributes
		$this->attributes = $this->block_attributes() ?? [];

		if(empty($this->attributes)) return;

		foreach($this->attributes as $block) {
			$name = $block['name'] ?? null;
			if(empty($name)) continue;

			$args = [];
			$args['attributes'] = $block['attributes'] ?: [];

			$render_func = $this->render_func($block);
			if(!empty($render_func)) $args['render_callback'] = $render_func;

			if(empty($args['attributes']) && !isset($block['render_callback'])) continue;
			register_block_type($name, $args);
		}
	}
}
