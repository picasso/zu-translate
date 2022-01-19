<?php

// Plugin Admin Menu Trait ----------------------------------------------------]

trait zukit_AdminMenu {

	private static $default_menu_id = 'options-general.php';
	private static $menu_split_id = 'options-privacy.php';
	private static $menu_split_index = null;
	private static $menu_moved_index = null;
	private static $menu_inline_style = false;
	private static $menu_debug = false;
	private static $menu_disable = false;
	private static $menu_configs = 0;

	private static $detailed_log = false;
	private static $if_log = false;
	private static $if_class = null; //'zu_Plus';

	private $shift_gap = 20;
	protected $total_index_break = 220;		// max items count in submenu?

	public function admin_menu_config() {
		add_filter('custom_menu_order', [$this, 'admin_menu_modify']);
		self::$menu_configs += 1;
		if(!self::$menu_inline_style) {
			$this->snippets('add_admin_inline_style',
				'.wp-core-ui .wp-submenu .wp-menu-separator a',
				'border-top: 1px solid;
			     opacity: 0.2;
			     width: 100%;
			     display: inline-block !important;
				 pointer-events: none;
			     cursor: default;'
			);
			self::$menu_inline_style = true;
		}
	}

	// 	To modify menu and submenu - pass array with optional keys  ['reorder', 'rename', 'remove', 'separator']
	//		If presented each key should be an array with some of the following keys
	//		'menu'				- item-slug
	//		'new_index'			- new item position
	//		'after_index'		- item position will be after item with this slug
	//		'after_index2'		- item position will be after item with this slug + 1 (the space could be used for separator later)
	//		'before_index'		- item position will be before item with this slug
	//		'before_index2'		- item position will be before item with this slug - 1 (the space could be used for separator later)
	//		'new_name'			- new item name
	//		'parent'			- parent menu slug (if absent then 'options-general.php' will be used)

	protected function custom_admin_menu() { return []; }
	protected function custom_admin_submenu() { return []; }

	public function toggle_menu_debug($toggle) {
		self::$menu_debug = $toggle;
	}

	public function toggle_menu_disable($toggle) {
		self::$menu_disable = $toggle;
	}

	// Admin menu modify ------------------------------------------------------]

	private function get_split_index() {
		global $submenu;
		if(empty(self::$menu_split_index)) {
			if(!isset($submenu[self::$default_menu_id])) return null;
			$submenu_items = count($submenu[self::$default_menu_id]);
			self::$menu_split_index = $this->get_menu_index(true, self::$menu_split_id);
			$split_position = array_search(self::$menu_split_index, array_keys($submenu[self::$default_menu_id]));
			$moved_items = $submenu_items - $split_position - 1;
			// clean positions from $menu_split_index + 1
			$this->submenu_move(
				self::$menu_split_index + 1,
				self::$menu_split_index + $moved_items + $this->shift_gap + 1,
				$moved_items
			);
		}
		return true;
	}

	public function from_split_index($shift = 0) {
		return self::$menu_split_index + $shift;
	}

	public function from_moved_index($shift = 0) {
		return self::$menu_moved_index + $shift;
	}

	public function admin_menu_modify($menu_order) {
	    global $menu, $submenu;

		if(self::$menu_disable) return $menu_order;

		// some internal debug logging
		self::$if_log = self::$if_class === static::class;
		if(empty(self::$menu_split_index) && self::$menu_debug) {
			// output origin submenu order for debug purpose
			$this->debug_print(false, false, true);
		}

		if($this->get_split_index() === null) return $menu_order;

		// modify main menu items
	    $modify = $this->custom_admin_menu();

		if(!empty($modify)) {
			if(isset($modify['reorder'])) {
				$prev_action = false;
			    foreach($modify['reorder'] as $menu_item) {
					// if the item only for 'onfail' and the previous result is successful, then skip it
					if(($menu_item['onfail'] ?? false) && $prev_action) continue;
			    	$prev_action = $this->menu_reorder($menu_item, false);
			    }
			}

	    	if(isset($modify['rename'])) {
			    foreach($modify['rename'] as $menu_item) {
			    	$index = $this->get_menu_index(false, $menu_item['menu']);
			    	if($index > 0) $menu[$index][0] = $menu_item['new_name'];
			    }
			}

	    	if(isset($modify['remove'])) {
			    foreach($modify['remove'] as $menu_item) {
			    	$index = $this->get_menu_index(false, $menu_item['menu']);
			    	if($index > 0) {
				    	unset($menu[$index]);
						ksort($menu);
					}
			    }
			}
		}

		// modify submenu items
	    $modify = $this->custom_admin_submenu();

		if(!empty($modify)) {
			$default_id = self::$default_menu_id;

			if(isset($modify['reorder'])) {
				$prev_action = false;
			    foreach($modify['reorder'] as $menu_item) {
					// if the item only for 'onfail' and the previous result is successful, then skip it
					if(($menu_item['onfail'] ?? false) && $prev_action) continue;
			    	$prev_action = $this->menu_reorder($menu_item, true);
				}
			}

	    	if(isset($modify['rename'])) {
			    foreach($modify['rename'] as $menu_item) {
			    	$parent = $menu_item['parent'] ?? $default_id;
			    	$index = $this->get_menu_index(true, $menu_item['menu'], $parent);
			    	if($index > 0) $submenu[$parent][$index][0] = $menu_item['new_name'];
			    }
			}

	    	if(isset($modify['remove'])) {
			    foreach($modify['remove'] as $menu_item) {
			    	$parent = $menu_item['parent'] ?? $default_id;
			    	$index = $this->get_menu_index(true, $menu_item['menu'], $parent);
			    	if($index > 0) {
				    	unset($submenu[$parent][$index]);
						ksort($submenu[$parent]);
					}
			    }
			}
			// add separators if needed
			if(isset($modify['separator'])) {
zu_log_if(self::$if_log, $modify['separator'], $this->menu_items($submenu[$default_id]));
			    foreach($modify['separator'] as $position => $menu_item) {
					// старый формат - массив массивов, т.е. массив для каждого элемента
					// новый формат - массив, где ключ это позиция, а значение - привязка к элементу
					if(is_string($menu_item)) $menu_item = [$position => $menu_item];
					// else [, $position] = $this->key_and_pos($menu_item);
			    	$parent = $menu_item['parent'] ?? $default_id;
			    	$sep_index = $this->get_new_index($menu_item, $parent, true);
			    	if($sep_index > 0 && $sep_index < $this->total_index_break) {
// zu_log_if(self::$if_log, $position, $sep_index, $this->menu_items($submenu[$parent]));
// 						$skip_separator = $this->skip_separator($submenu[$parent], $sep_index, $position);
// zu_log_if(self::$if_log, 'skip_separator results', $skip_separator);
// 						if($skip_separator) continue;
						$name = sprintf('sep-%s-%s-%s', $sep_index, $position, array_values($menu_item)[0]);
						$separator = ['','read', $name, '', 'wp-menu-separator'];
						$update = $this->array_insert($submenu[$parent], $sep_index, $separator);
// 						$submenu[$parent] = $update;
						$submenu[$parent] = $this->fix_separators($update);
zu_log_if(self::$if_log, 'after separator inserted', $this->menu_items($update));
					}
			    }
			}
		}

		// output menu order for debug purpose
		if(--self::$menu_configs === 0 && self::$menu_debug) {
			$this->debug_print(true);
			$this->debug_print(true, true);
		}
	    return $menu_order;
	}

	/// REFACTORED /////////////////////////////////////////////////////////////

	protected function submenu_move($from_index, $to_index, $count = 1, $add_separator = true, $parent = null) {
		global $submenu;

		if(empty($parent)) $parent = self::$default_menu_id;

		$first_was_separator = $count;
		while($count > 0) {
			if($to_index >= $this->total_index_break) break;

			if(isset($submenu[$parent][$from_index])) {
				$move_item = $submenu[$parent][$from_index];
				// чтобы предотвратить ситуацию когда два сепаратора идут друг за другом
				// if($first_was_separator === $count) {
				// 	$first_was_separator = ($move_item[4] ?? null) === 'wp-menu-separator' ? -2 : -1;
				// }
				unset($submenu[$parent][$from_index]);
				while($to_index < $this->total_index_break) {
					if(isset($submenu[$parent][$to_index])) {
						$to_index++;
						continue;
					}
					if($add_separator) { // && $first_was_separator !== -2) {
						$submenu[$parent][$to_index++] = ['','read', 'sep-moved-position', '', 'wp-menu-separator'];
						$add_separator = false;
						continue;
					}
					if(self::$menu_moved_index === null) self::$menu_moved_index = $to_index;
					$submenu[$parent][$to_index++] = $move_item;
					$count--;
					break;
				}
			}
			$from_index++;
		}
		// reorder the menu based on the keys in ascending order
	    if(isset($submenu[$parent])) ksort($submenu[$parent]);
	}

	// get menu or submenu key location based on slug
	protected function get_menu_index($is_submenu, $item, $parent = null) {
		global $submenu, $menu;
		$index = -1;
		$items = $is_submenu ? $submenu[$parent ?: self::$default_menu_id] ?? [] : $menu;
	    foreach($items as $key => $details) {
	        if($details[2] === $item) return $key;
	    }
	    return $index;
	}

	protected function get_new_index($menu_item, $parent = null, $for_separator = false) {
	    $new_index = $menu_item['index'] ?? $menu_item['new_index'] ?? -1;
	    if($new_index < 0) {
			[$item_key, $item_position] = $this->key_and_pos($menu_item);
		    $start_index = $this->get_menu_index(!empty($parent), $item_key, $parent);
		    if($start_index < 0) return (PHP_INT_MAX - 1);
		    $shift = intval(filter_var($item_position, FILTER_SANITIZE_NUMBER_INT)) ?: 1;
			$new_index = $start_index + $shift * (strpos($item_position, 'before') === false ? 1 : -1);
			if($for_separator && strpos($item_position, 'before') !== false) $new_index = $start_index;
	    }
		return $new_index;
	}

	protected function menu_reorder($menu_item, $is_submenu) {
		global $menu, $submenu;
		$parent = $is_submenu ? $menu_item['parent'] ?? self::$default_menu_id : null;
		$index = $this->get_menu_index($is_submenu, $menu_item['menu'], $parent);
		$new_index = $this->get_new_index($menu_item, $parent);

	    if($index > 0 && $new_index < $this->total_index_break && $index !== $new_index) {
			$item = $is_submenu ? $submenu[$parent][$index] : $menu[$index];
			if($is_submenu) unset($submenu[$parent][$index]);
			else unset($menu[$index]);
			$update = $this->array_insert($is_submenu ? $submenu[$parent] : $menu, $new_index, $item);
			if($is_submenu) $submenu[$parent] = $update;
			else $menu = $update;

			if(self::$detailed_log) {
				$calledClass = static::class;
				zu_logc("!Submenu Reorder [$calledClass]", $index, $new_index, $this->menu_items($update));
			}
			return true;
	    }
		return false;
	}

	// сложная функция которая вставляет новый элемент в массив на указанную позицию и
	// при это старается не менять текущие индексы. Если указанное место в массиве уже
	// занято, то тогда все элементы от этого места сдвигаются на одни вниз (и их индексы тоже)
	private function array_insert($array, $index, $value) {
		if(isset($array[$index])) {
			$keys = array_keys($array);
			$before_items = array_search($index, $keys);
			$before = array_slice($array, 0, $before_items, true);
			$after = array_slice($array, $before_items, null, true);
			$akeys = array_reverse(array_keys($after));
			foreach($akeys as $a_index) {
				$after[$a_index + 1] = $after[$a_index];
				unset($after[$a_index]);
			}
			$array = array_replace($before, $after, [$index => $value]);
		} else {
			$array[$index] = $value;
		}
		// reorder based on the keys in ascending order
		ksort($array);
		return $array;
	}

	private function fix_separators($menu) {
		$prev_separator = false;
		foreach($menu as $index => $item) {
			$has_separator = ($item[4] ?? null) === 'wp-menu-separator';
			if($has_separator && $prev_separator) $menu[$index] = null;
			else $prev_separator = $has_separator;
		}
		return array_filter($menu);
	}

// 	private function skip_separator($menu, $index, $position) {
// zu_log_if(self::$if_log, 'skip_separator [current]', $index, $position, $this->has_separator($menu, $index));
// 		$has_item = $this->has_separator($menu, $index);
// 		// if(is_null($has_item) && $position === 'before') return false;
// 		if($has_item) return true;
//
// 		$keys = array_keys($menu);
// 		if($has_item === false || (is_null($has_item) && $position === 'before')) {
// 			$prev_index = $this->search_separator($keys, $index, true);
// zu_log_if(self::$if_log, 'skip_separator [prev]', $keys, $prev_index, $this->has_separator($menu, $prev_index));
// 			if($this->has_separator($menu, $prev_index)) return true;
// 		}
// 		if($has_item === false || (is_null($has_item) && $position === 'after')) {
// 			$next_index = $this->search_separator($keys, $index, false);
// zu_log_if(self::$if_log, 'skip_separator [next]', $keys, $next_index, $this->has_separator($menu, $next_index));
// 			if($this->has_separator($menu, $next_index)) return true;
// 		}
// 		return false;
// 	}
//
// 	private function has_separator($menu, $index) {
// 		$item = $menu[$index] ?? [];
// 		return ($item[4] ?? null) === 'wp-menu-separator' ? true : (count($item) ? null : false);
// 	}
//
// 	private function search_separator($keys, $index, $back) {
// 		$item_index = false;
// 		$last_index = $keys[count($keys)-1];
// 		while($index && $index < $last_index && !$item_index) {
// 			$index += $back ? -1 : 1;
// 			$item_index = array_search($index, $keys);
// 		}
// 		return $item_index ? $keys[$item_index] : false;
// 	}

	private function key_and_pos($item) {
		$index = $this->snippets('array_pick_keys', $item, [
			'before',
			'after',
			// устаревшие ключи
			'before_index',
			'before_index2',
			'after_index',
			'after_index2',
		]);
		$key = array_values($index)[0] ?? null;
		$position = array_keys($index)[0] ?? null;
		return [$key, preg_replace('/_index[\d]*$/', '', $position)];
	}

	private function debug_print($with_selected = false, $is_menu = false, $is_origin = false) {
		global $menu, $submenu;
		$context = sprintf('*%s Order', $is_origin ? 'Initial' : ($is_menu ? '"Menu"' : '"Options Subnemu"'));
		$detailed = $is_menu ? $menu : $submenu[self::$default_menu_id];
		$items = $this->menu_items($is_menu ? $menu : $submenu[self::$default_menu_id]);
		if($is_origin) {
			$submenu_items = $items;
			$menu_items = $this->menu_items($menu);
			zu_logc($context, $submenu_items, $menu_items);
		} else {
			if($with_selected && !$is_menu && !$is_origin) zu_logc('*Split Index', self::$menu_split_index);
			if($with_selected) zu_logc($context, $items, $detailed);
			else zu_logc($context, $items);
		}
	}

	private function menu_items($menu) {
		return array_map(function($item) {
			$is_wrong = !(is_array($item) && count($item) > 2);
			return sprintf('%s',
				$is_wrong ? '?' : (
					empty($item[0]) ? '-----'.$item[2].'-----' : strip_tags($item[0])
				)
			);
		}, $menu ?? []);
	}
}
