<?php

// Plugin Admin Menu Trait ----------------------------------------------------]

trait zukit_AdminMenu {

	private static $default_menu_id = 'options-general.php';
	private static $menu_split_id = 'options-privacy.php';
	private static $menu_split_index = null;
	private static $menu_moved_index = null;

	private $shift_gap = 20;
	protected $total_index_break = 220;		// max items count in submenu?

	public function admin_menu_config() {
		add_filter('custom_menu_order', [$this, 'admin_menu_modify']);
		if($this->is_origin()) {
			$this->snippets('add_admin_inline_style',
				'.wp-core-ui .wp-submenu .wp-menu-separator a',
				'border-top: 1px solid;
			     opacity: 0.2;
			     width: 100%;
			     display: inline-block !important;
				 pointer-events: none;
			     cursor: default;'
			);
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
	protected function custom_menu_debug() { return false; }

	// Admin menu modify ------------------------------------------------------]

	private function get_split_index() {
		global $submenu;
		if(empty(self::$menu_split_index)) {
			if(!isset($submenu[self::$default_menu_id])) return null;

			$submenu_items = count($submenu[self::$default_menu_id]);
			self::$menu_split_index = $this->get_submenu_index(self::$menu_split_id);
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

		if($this->get_split_index() === null) return $menu_order;

		// modify main menu items
	    $modify = $this->custom_admin_menu();

		if(!empty($modify)) {
			if(isset($modify['reorder'])) {
			    foreach($modify['reorder'] as $menu_item) {
			    	$this->menu_reorder($menu_item['menu'], $this->get_new_index($menu_item));
			    }
			}

	    	if(isset($modify['rename'])) {
			    foreach($modify['rename'] as $menu_item) {
			    	$index = $this->get_menu_index($menu_item['menu']);
			    	if($index > 0) $menu[$index][0] = $menu_item['new_name'];
			    }
			}

	    	if(isset($modify['remove'])) {
			    foreach($modify['remove'] as $menu_item) {
			    	$index = $this->get_menu_index($menu_item['menu']);
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
			    foreach($modify['reorder'] as $menu_item) {
			    	$parent = $menu_item['parent'] ?? $default_id;
			    	$this->submenu_reorder($menu_item['menu'], $this->get_new_index($menu_item, $parent), $parent);
			    }
			}

	    	if(isset($modify['rename'])) {
			    foreach($modify['rename'] as $menu_item) {
			    	$parent = $menu_item['parent'] ?? $default_id;
			    	$index = $this->get_submenu_index($menu_item['menu'], $parent);
			    	if($index > 0) $submenu[$parent][$index][0] = $menu_item['new_name'];
			    }
			}

	    	if(isset($modify['remove'])) {
			    foreach($modify['remove'] as $menu_item) {
			    	$parent = $menu_item['parent'] ?? $default_id;
			    	$index = $this->get_submenu_index($menu_item['menu'], $parent);
			    	if($index > 0) {
				    	unset($submenu[$parent][$index]);
						ksort($submenu[$parent]);
					}
			    }
			}
			// add separators if needed
			if(isset($modify['separator'])) {
			    foreach($modify['separator'] as $menu_item) {
			    	$parent = $menu_item['parent'] ?? $default_id;
			    	$index = $this->get_new_index($menu_item, $parent);
			    	if($index > 0 && !isset($submenu[$parent][$index])) {
				    	$submenu[$parent][$index] = ['','read', 'separator'.$index, '', 'wp-menu-separator'];
						ksort($submenu[$parent]);
					}
			    }
			}
		}

		// output menu order for debug purpose
		if($this->custom_menu_debug()) {
			$this->debug_print();
			$this->debug_print(true);
		}

	    return $menu_order;
	}

	protected function get_new_index($menu_item, $submenu_parent = '') {
	    $new_index = $menu_item['new_index'] ?? -1;
	    if($new_index < 0) {
		    $base_key = array_values(array_intersect(array_keys($menu_item), [
				'before_index',
				'before_index2',
				'after_index',
				'after_index2'
			]));
		    $base_menu = empty($base_key) ? '' : $menu_item[$base_key[0]];
		    $base_index = empty($submenu_parent) ?
				$this->get_menu_index($base_menu)
				:
				$this->get_submenu_index($base_menu, $submenu_parent);
		    if($base_index < 0) return (PHP_INT_MAX - 1);
		    $index_shift = intval(filter_var($base_key[0], FILTER_SANITIZE_NUMBER_INT)) ? : 1;
			$new_index = strpos($base_key[0], 'before') === false ? $base_index + $index_shift : $base_index - $index_shift;
	    }
		return $new_index;
	}

	protected function get_menu_index($menu_item) {
		global $menu;

		$index = -1;
	    foreach($menu as $key => $details) {
	        if($details[2] == $menu_item) {
	            $index = $key;
	        }
	    }
	    return $index;
	}

	protected function menu_reorder($menu_item, $new_index) {
		global $menu;

		$index = $this->get_menu_index($menu_item);
	    if($index > 0) {
		    $menu[$new_index] = $menu[$index];
		    unset($menu[$index]);
			// Reorder the menu based on the keys in ascending order
		    ksort($menu);
	    }
	}

	protected function get_submenu_index($menu_item, $submenu_parent = null) {
		global $submenu;

		if(empty($submenu_parent)) $submenu_parent = self::$default_menu_id;

		$index = -1;
		// Get submenu key location based on slug
	    $subitems = $submenu[$submenu_parent] ?? [];
	    foreach($subitems as $key => $details) {
	        if($details[2] == $menu_item) {
	            $index = $key;
	        }
	    }
	    return $index;
	}

	protected function submenu_reorder($menu_item, $new_index, $submenu_parent) {
		global $submenu;

		$index = $this->get_submenu_index($menu_item, $submenu_parent);
	    if($index > 0) {
		    $submenu[$submenu_parent][$new_index] = $submenu[$submenu_parent][$index];
		    unset($submenu[$submenu_parent][$index]);
			// Reorder the menu based on the keys in ascending order
		    ksort($submenu[$submenu_parent]);
	    }
	}

	protected function submenu_move($from_index, $to_index, $count = 1, $add_separator = true, $submenu_parent = null) {
		global $submenu;

		if(empty($submenu_parent)) $submenu_parent = self::$default_menu_id;

		$first_was_separator = $count;
		while($count > 0) {
			if($to_index >= $this->total_index_break) break;

			if(isset($submenu[$submenu_parent][$from_index])) {
				$move_item = $submenu[$submenu_parent][$from_index];
				// чтобы предотвратить ситуацию когда два сепаратора идут друг за другом
				if($first_was_separator === $count) {
					$first_was_separator = ($move_item[4] ?? null) === 'wp-menu-separator' ? -2 : -1;
				}
				unset($submenu[$submenu_parent][$from_index]);
				while($to_index < $this->total_index_break) {
					if(isset($submenu[$submenu_parent][$to_index])) {
						$to_index++;
						continue;
					}
					if($add_separator && $first_was_separator !== -2) {
						$submenu[$submenu_parent][$to_index++] = ['','read', 'separator_moved_position', '', 'wp-menu-separator'];
						$add_separator = false;
						continue;
					}
					if(self::$menu_moved_index === null) self::$menu_moved_index = $to_index;
					$submenu[$submenu_parent][$to_index++] = $move_item;
					$count--;
					break;
				}
			}
			$from_index++;
		}

		// Reorder the menu based on the keys in ascending order
	    if(isset($submenu[$submenu_parent])) ksort($submenu[$submenu_parent]);
	}

	private function debug_print($is_menu = false) {
		global $menu, $submenu;

		$context = sprintf('*%s Order', $is_menu ? 'Menu' : 'Options Subnemu');
		$selected = $is_menu ? $menu : $submenu[self::$default_menu_id];

		$items = array_map(function($item) {
			$is_wrong = !(is_array($item) && count($item) > 2);
			return sprintf('%s',
				$is_wrong ? '?' : (
					empty($item[0]) ? '-----'.$item[2].'-----' : strip_tags($item[0])
				)
			);
		}, $is_menu ? $menu : $submenu[self::$default_menu_id]);
		$this->logc($context, $items, $selected);
	}
}
