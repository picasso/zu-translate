<?php

// Plugin Admin Menu Trait ----------------------------------------------------]

trait zukit_AdminMenu {

	protected $default_menu_id = 'options-general.php';
	protected $menu_split_id = 'options-privacy.php';
	protected $total_index_break = 220;		// max items count in submenu?
	protected $menu_split_index = 0;

	public function admin_menu_config() {
		add_filter('custom_menu_order', [$this, 'admin_menu_modify']);
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
	//		'parent'			- parent menu slug (if absent then  'options-general.php' will be used)

	protected function custom_admin_menu() { return []; }
	protected function custom_admin_submenu() { return []; }

	// Admin menu modify ------------------------------------------------------]

	public function admin_menu_modify($menu_order) {
	    global $menu, $submenu;

		$default_menu_id = $this->default_menu_id;
		$menu_split_id = $this->menu_split_id ;
		// _dbug($submenu[$default_menu_id]);

		if(empty($this->menu_split_index)) {
			$menu_id = $default_menu_id;

			if(!isset($submenu[$menu_id])) return $menu_order;

			$submenu_items = count($submenu[$menu_id]);
			$this->menu_split_index = $this->get_submenu_index($menu_split_id);
			$split_position = array_search($this->menu_split_index, array_keys($submenu[$menu_id]));
			$moved_items = $submenu_items - $split_position - 1;

			// clean positions from $this->menu_split_index + 1
			$this->submenu_move($this->menu_split_index + 1, $this->menu_split_index + $moved_items + 11, $moved_items);
		}

		// modify main menu items
	    $menu_modify = $this->custom_admin_menu();

		if(isset($menu_modify['reorder'])) {
		    foreach($menu_modify['reorder'] as $menu_item) {
		    	$this->menu_reorder($menu_item['menu'], $this->get_new_index($menu_item));
		    }
		}

    	if(isset($menu_modify['rename'])) {
		    foreach($menu_modify['rename'] as $menu_item) {
		    	$index = $this->get_menu_index($menu_item['menu']);
		    	if($index > 0) $menu[$index][0] = $menu_item['new_name'];
		    }
		}

    	if(isset($menu_modify['remove'])) {
		    foreach($menu_modify['remove'] as $menu_item) {
		    	$index = $this->get_menu_index($menu_item['menu']);
		    	if($index > 0) {
			    	unset($menu[$index]);
					ksort($menu);
				}
		    }
		}

		// modify submenu items
	    $submenu_modify = $this->custom_admin_submenu();

		if(isset($submenu_modify['reorder'])) {
		    foreach($submenu_modify['reorder'] as $menu_item) {
		    	$submenu_parent = $menu_item['parent'] ?? $default_menu_id;
		    	$this->submenu_reorder($menu_item['menu'], $this->get_new_index($menu_item, $submenu_parent), $submenu_parent);
		    }
		}

    	if(isset($submenu_modify['rename'])) {
		    foreach($submenu_modify['rename'] as $menu_item) {
		    	$submenu_parent = $menu_item['parent'] ?? $default_menu_id;
		    	$index = $this->get_submenu_index($menu_item['menu'], $submenu_parent);
		    	if($index > 0) $submenu[$submenu_parent][$index][0] = $menu_item['new_name'];
		    }
		}

    	if(isset($submenu_modify['remove'])) {
		    foreach($submenu_modify['remove'] as $menu_item) {
		    	$submenu_parent = $menu_item['parent'] ?? $default_menu_id;
		    	$index = $this->get_submenu_index($menu_item['menu'], $submenu_parent);
		    	if($index > 0) {
			    	unset($submenu[$submenu_parent][$index]);
					ksort($submenu[$submenu_parent]);
				}
		    }
		}

		// add separators if needed

		if(isset($submenu_modify['separator'])) {
		    foreach($submenu_modify['separator'] as $menu_item) {
		    	$submenu_parent = $menu_item['parent'] ?? $default_menu_id;
		    	$index = $this->get_new_index($menu_item, $submenu_parent);
		    	if($index > 0 && !isset($submenu[$submenu_parent][$index])) {
			    	$submenu[$submenu_parent][$index] = ['','read', 'separator'.$index, '', 'wp-menu-separator'];
					ksort($submenu[$submenu_parent]);
				}
		    }
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

		if(empty($submenu_parent)) $submenu_parent = $this->default_menu_id;

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

		if(empty($submenu_parent)) $submenu_parent = $this->default_menu_id;

		while($count-- > 0) {
			if($to_index >= $this->total_index_break) break;

			if(isset($submenu[$submenu_parent][$from_index])) {
				$move_item = $submenu[$submenu_parent][$from_index];
				unset($submenu[$submenu_parent][$from_index]);
				while($to_index < $this->total_index_break) {
					if(isset($submenu[$submenu_parent][$to_index])) {
						$to_index++;
						continue;
					}
					if($add_separator) {
						$submenu[$submenu_parent][$to_index++] = ['','read', 'separator_moved', '', 'wp-menu-separator'];
						$add_separator = false;
						continue;
					}
					$submenu[$submenu_parent][$to_index++] = $move_item;
					break;
				}
			}
			$from_index++;
		}

		// Reorder the menu based on the keys in ascending order
	    if(isset($submenu[$submenu_parent])) ksort($submenu[$submenu_parent]);
	}
}
