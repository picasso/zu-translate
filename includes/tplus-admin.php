<?php
//	
// 	How adapt for a new plugin:
//
// 		- replace 'TPLUS_' for 'YOUR_'
// 		- replace 'tplus_' for 'your_'
//			- replace 'tplus-' for 'your-'
//			- define set of 'defaults' in __construct
// 		- modify 'validate_options' to process these options
// 		- change content in function 'tplus_add_admin_meta_boxes' (generally in Normal Boxes)
// 		- change content in section 'Normal Blocks'
//			- change content in 'plugin_status' function
//			- change activation of 'Additional classes'
// 	

// * * $hook - the hook of the 'parent' (menu top-level page).
// * * $title - the browser window title of the page
// * * $menu - the page title as it appears in the menu
// * * $permissions - the capability a user requires to see the page
// * * $slug - a slug identifier for this page
// * * $body_callback - (optional) a callback that prints to the page, above the metaboxes.

class tplus_Admin {

	private $plugin_name = TPLUS_NAME;
	
	private $hook = 'options-general.php';
	private $title = '';
	private $menu = '';
	private $permissions = 'manage_options';
	private $slug = 'tplus-settings';
	private $hook_suffix = null;	
	private $body_callback = null;

	private $errors_id = 'tplus_errors';
	private $options_id;
	private $options;
	private $options_defaults;
	private $options_nosave;

	private $qtx = null;
	
	public function __construct($options_id) {
		
		$this->options_id = $options_id;
		$this->title = sprintf('%2$s %1$s', __('Options', 'tplus-plugin'), $this->plugin_name);
		$this->menu = $this->plugin_name;

		$this->options_defaults = [
			'qtxseo'			=> false,
			'flags'			=> false,
			'ls_frontend' 		=> true, 
			'ls_menu' 			=> true, 
			'ls_display' 		=> 'lang', 
			'error'			=> 0,
		];

		$this->options_nosave = ['source_menu', 'new_menu'];		// temporary fields which we do not want to save

		$option_value = function($name, $default = false) { return isset($_GET[$name]) && !empty($_GET[$name]) ? $_GET[$name] : $default; };
		
		$test_plugin = $option_value('tplus_test');
		$clear_errors = $option_value('tplus_clear_errors');

		//
		// Activation Hook ----------------------------------------------------------]
		//
		register_activation_hook(__TPLUS_FILE__, function() {

			if(!version_compare(PHP_VERSION, '7.0.0', '>=')) {
				add_action('update_option_active_plugins', function() { deactivate_plugins(plugin_basename(__TPLUS_FILE__));});
				wp_die(sprintf('%1$s required PHP at least 7.0.x. %1$s was deactivated. <a href="%2$s">Go Back</a>', $this->plugin_name, admin_url()));
			}

			if(!get_option($this->options_id)) add_option($this->options_id, $this->options_defaults);
			if(!get_option($this->errors_id)) add_option($this->errors_id, []);
		});
		
		register_deactivation_hook(__TPLUS_FILE__, function() {
			delete_option($this->options_id);
			delete_option($this->errors_id);
// 			wp_clear_scheduled_hook('tplus_cron');
		});
		add_filter('plugin_action_links_'.plugin_basename(__TPLUS_FILE__), [$this, 'admin_settings_link']);

		$this->get_options();
		if(!isset($this->options['error'])) $this->options['error'] = 0;
		
		add_action('admin_init', function() {
			register_setting($this->options_id, $this->options_id, [$this, 'validate_options']);
			register_setting($this->errors_id, $this->errors_id);		
		});
		
		add_action('admin_menu', [$this, 'admin_menu']);
		add_action('wp_ajax_tplus_option', [$this, 'ajax_turn_option']);
		add_action('admin_enqueue_scripts', [$this, 'admin_enqueue']);
		
		//
		// Show errors, if there are ------------------------------------------------]
		//
		add_action('admin_notices', [$this, 'show_errors']);
		
		//
		// Add metaboxes to the page ------------------------------------------------]
		//
		add_action('add_meta_boxes', function() {
			$settings_page = add_query_arg(['page' => $this->slug], admin_url($this->hook));
			tplus_add_admin_meta_boxes($settings_page, $this->hook_suffix, $this->options_id, $this->options, $this->errors_id);
		});
		
		//
		// Basic actions ------------------------------------------------------------]
		//
		if($test_plugin) $this->plugin_test();
		if($clear_errors) $this->empty_errors();
		
		//
		// Additional classes --------------------------------------------------------]
		//
		$this->qtx = new tplus_QTX($this->options);

	}
	
	private function get_options() { 
		$this->options = get_option($this->options_id, []); 
		return $this->options; 
	}
	
	private function update_options() { 
		update_option($this->options_id, $this->options); 
	}
	
	public function validate_options($input) {
		
		$new_values = array_diff_key($input, array_flip($this->options_nosave));		// remove unwanted values
		
		//		if INT				- intval($input['?']);
		//		if BOOL 			- filter_var($input['?'], FILTER_VALIDATE_BOOLEAN);
		//		if Filename		- preg_replace('#[^A-z0-9-_\.\,\/]#', '', $input['?']);
		//		If Identificator	- preg_replace('#[^A-z0-9-_]#', '', $input['?']);
		
		$new_values['ls_display'] = in_array($input['ls_display'], ['lang', 'code']) ? $input['ls_display'] : 'lang';
		$new_values['ls_frontend'] = filter_var($input['ls_frontend'], FILTER_VALIDATE_BOOLEAN);
		$new_values['ls_menu'] = filter_var($input['ls_menu'], FILTER_VALIDATE_BOOLEAN);
		$new_values['qtxseo'] = filter_var($input['qtxseo'], FILTER_VALIDATE_BOOLEAN);
		$new_values['flags'] = filter_var($input['flags'], FILTER_VALIDATE_BOOLEAN);

		return $new_values;
	}
	
	public function ajax_nonce($create = false) { 
		$ajax_nonce = $this->slug.'_ajax_nonce';
		return $create ? wp_create_nonce($ajax_nonce) : $ajax_nonce; 
	}

	public function admin_enqueue() {		// admin

		$data = [
			'ajaxurl'                => admin_url('admin-ajax.php'),
			'admin_nonce'     	=> $this->ajax_nonce(true),
			'screen_id'				=> $this->hook_suffix,
		];
		
		wp_enqueue_style('tplus-style', plugins_url('css/tplus-admin.css', __TPLUS_FILE__), [], TPLUS_VERSION);		
		wp_enqueue_script('tplus-script', plugins_url('js/tplus-admin.min.js', __TPLUS_FILE__), ['jquery'], TPLUS_VERSION, true);
		wp_localize_script('tplus-script', 'tplus_custom', $data);
	}
	
	public function admin_settings_link($links) {
		$settings_link = sprintf('<a href="%1$s%2$s?page=%3$s">%4$s</a>', get_admin_url(), $this->hook, $this->slug, __('Settings', 'textdomain'));
		array_unshift($links, $settings_link);
		return $links;
	}
	
	//
	// Wordpress Admin Page ------------------------------------------------------]
	//

	public function admin_menu() {
		
		$this->hook_suffix = add_submenu_page(
			$this->hook, 
			$this->title, 
			$this->menu, 
			$this->permissions, 
			$this->slug, 
			[$this, 'render_admin_page']
		);
		add_action('load-'.$this->hook_suffix, [$this, 'admin_page_actions'], 9);
		add_action('admin_footer-'.$this->hook_suffix, [$this, 'admin_footer_scripts']);
	}

	public function admin_page_actions() {
		// * Actions to be taken prior to page loading. This is after headers have been set.
		// * call on load-$hook
		// * This calls the add_meta_boxes hooks, adds screen options and enqueues the postbox.js script.   

		do_action('add_meta_boxes_'.$this->hook_suffix, null);
		do_action('add_meta_boxes', $this->hook_suffix, null);

		// User can choose between 1 or 2 columns (default 2)
		add_screen_option('layout_columns', ['max' => 2, 'default' => 2]);

		// Enqueue WordPress' script for handling the meta boxes
		wp_enqueue_script('postbox'); 
	}

	public function admin_footer_scripts() {
	// 	Prints the jQuery script to initiliase the metaboxes
	// 	Called on admin_footer-
		print('<script> postboxes.add_postbox_toggles(pagenow);</script>');
	}

	public function render_admin_page() {
		
		add_filter('tplus_print_side_settings', [$this, 'plugin_status']);
		add_action('tplus_print_form', function() { tplus_form($this->options_id); }, 10, 1);
		add_action('tplus_print_title', function() {
			$title = sprintf('<span class="tplus_red _bold">%1$s</span>', $this->plugin_name);
			echo str_replace($this->plugin_name, $title, $this->title);
		});
		add_action('tplus_print_body', function() {
			$body_content = is_callable($this->body_callback) ? call_user_func($this->body_callback) : '';
			if(!empty($body_content)) printf('<div id="post-body-content">%1$s</div>', $body_content);		 
		});
		
		include_once(__TPLUS_ROOT__ . 'includes/tplus-admin-page.php');
	}

	//
	// AJAX & Tests --------------------------------------------------------------]
	//

	public function plugin_test() {
		return ['info'	=> sprintf('Plugin tested on %1$s', date('H:i <b>d.m.y</b> ', $this->current_timestamp()))];
	}

	public function plugin_status() {
		return sprintf('
			<div class="plugin-logo">%3$s</div>
			<p><strong>%1$s</strong> - version %2$s</p>
			<p><strong>qTranslate-X</strong> - version %4$s</p>', 
			$this->plugin_name, 
			TPLUS_VERSION,
			tplus_svg('logo'),
			defined('QTX_VERSION') ? QTX_VERSION : '??'
		);
	}
	
	public function ajax_turn_option() {

		$option_name = (isset($_POST['option_name']) && !empty($_POST['option_name'])) ? $_POST['option_name'] : null;
		$result = [];

		if($option_name) {
			
			switch($option_name) {
				case 'tplus_dismiss_error':
					$this->set_or_dismiss_error();
					break;

				case 'tplus_clear_errors':
					$msg = $this->empty_errors();
					break;
					
				case 'tplus_test':
					$msg = $this->plugin_test();
					break;
					
				case 'tplus_duplicate_menu':
					$msg = ajax_duplicate_menu();
					break;
					
				default:
			}
			
			if(!empty($msg)) $result['result'] = $this->report_error($msg, true, $option_name);
			$result[$option_name] = 'ok';

			wp_send_json_success($result);
		}
	}

	//
	// Errors --------------------------------------------------------------------]
	//

	public function current_timestamp() { 
		return intval(current_time('timestamp')); 
	}

	public function report_error($msg, $ajax = false, $function = '', $class = '') {

		$errors = get_option($this->errors_id, []);
		$message = is_array($msg) ? (isset($msg['error']) ? $msg['error'] : '') :  $msg;
		
		if(!empty($message)) {
			$errors[] = [
				$message, 
				$this->current_timestamp(), 
				trim(sprintf('%s %s %s', strtoupper($function), (empty($class) ? '' : 'of class '), $class))
			];
			update_option($this->errors_id, $errors);
			$this->set_or_dismiss_error($msg);
		}
		
		return $this->get_notice($msg, $ajax);
	}

	public function get_notice($msg, $ajax = false) {
		
		// notice-error – error message displayed with a red border
		// notice-warning – warning message displayed with a yellow border
		// notice-success – success message displayed with a green border
		// notice-info – info message displayed with a blue border

		$msg_template = 'Something went wrong. Please look at <a href="#tplus-errors-mb">ERRORS (%1$s)</a> section for more information.';
		$ajax_template = '<button type="button" class="notice-dismiss ajax-dismiss"><span class="screen-reader-text">Dismiss this notice.</span></button>';
		$msg_text = is_array($msg) ? array_values($msg)[0] : sprintf($msg_template, $msg);
		$msg_type = is_array($msg) ? array_keys($msg)[0] : 'error'; 
		return sprintf('<div class="notice notice-%2$s is-dismissible"><p>%1$s</p>%3$s</div>', 
			$msg_text, 
			str_replace('ok', 'success', $msg_type),
			$ajax ? $ajax_template : ''
		);
	}

	public function show_errors() {
		if($this->options['error']) {
			echo $this->get_notice($this->options['error']);
		}
	}

	private function set_or_dismiss_error($value = 0) {
		$this->get_options();
		$this->options['error'] = $value;
		$this->update_options();
	}

	private function empty_errors() {
		$this->set_or_dismiss_error();
		update_option($this->errors_id, []);
		return ['info'	=> sprintf('All errors have been successfully deleted on %1$s', date('H:i <b>d.m.y</b> ', $this->current_timestamp()))];
	}
}

// Options Class --------------------------------------------------------------]

class tplus_Options {

	private $options_id;
	private $errors_id;
	private $options;
	
	public function __construct($args) {

		$this->options_id = isset($args['args'][0]) ? $args['args'][0] : '';
		$this->options = isset($args['args'][1]) ? $args['args'][1] : []; 
		$this->errors_id  = isset($args['args'][2]) ? $args['args'][2] : '';
	}
	
	public function name($options_name) {
		return sprintf('%1$s[%2$s]', $this->options_id, $options_name);
	}

	public function value($name, $default = false) {
		return isset($this->options[$name]) ? $this->options[$name] : $default;
	}
	
	public function errors_id() {
		return $this->errors_id;
	}

	public function options_id() {
		return $this->options_id;
	}
}

// Helpers --------------------------------------------------------------------]

function tplus_svg($name, $preserve_ratio = false) {
	
	$filepath = sprintf('%1$s/images/%2$s.svg', tplus_get_my_dir(), $name);
	if(!file_exists($filepath)) return '';
	
	$svg = file_get_contents($filepath);
	if($preserve_ratio && stripos($svg, 'preserveAspectRatio') === false) $svg = preg_replace('/<svg([^>]+)>/i', '<svg${1} preserveAspectRatio="xMidYMin slice">', $svg);
	
	return $svg;	
}
		
function tplus_option($options, $name, $label, $option_desc = '', $option_type = 'checkbox', $option_array = null) {

	$option_name = $options->name($name);
	$option_value = $options->value($name, $option_type == 'checkbox' ? false : '');
	
	$tr = '<tr valign="top"><td class="field_label"><laber for="">%1$s</label></td><td class="tplus-field">%2$s</td></tr>';
	$option_check = '<input type="checkbox" name="%1$s" value="1" %2$s /><span class="field_desc">%3$s</span>';
	$option_text = '<input type="text" name="%1$s" value="%2$s" class="tplus-input tplus-input-text tplus-tooltip" /><span class="field_desc">%3$s</span>';
	$option_select = '<select name="%1$s">%2$s</select><span class="field_desc">%3$s</span>';
	
	if($option_type == 'hidden') return sprintf('<input type="hidden" name="%1$s" value="%2$s" />', $option_name, $option_value);
	
	if($option_type == 'select') {
		$option_template = $option_select;
		$select_value = '';
		foreach ($option_array as $key => $value) {
			$select_value .= sprintf(
				'<option value="%1$s" %2$s>%3$s</option>',
				$key,
				($option_value == $key) ? 'selected' : '',
				$value
			);
		}
		$option_value = $select_value;
		
	} else {
		$option_template = ($option_type == 'checkbox') ? $option_check : $option_text;
		$option_value = ($option_type == 'checkbox') ? ($option_value ? 'checked' : '') : $option_value;
	}
	return sprintf($tr, $label, sprintf($option_template, $option_name, $option_value, $option_desc));
}

function tplus_checkbox($options, $name, $label, $option_desc = '') { 
	return tplus_option($options, $name, $label, $option_desc); 
}

function tplus_text($options, $name, $label, $option_desc = '') { 
	return tplus_option($options, $name, $label, $option_desc, 'text'); 
}

function tplus_select($options, $name, $label, $option_array, $option_desc = '') { 
	return tplus_option($options, $name, $label, $option_desc, 'select', $option_array); 
}

function tplus_hidden($options, $name) { 
	return tplus_option($options, $name, '', '', 'hidden'); 
}

function tplus_button($options, $label, $icon, $color = 'blue', $in_table = true, $class = '') {

	$form_fields = $options->options_id();
	$tr = '<tr valign="top"><td class="field_label"></td><td class="tplus-field">%1$s</td></tr>';
	$basic_classes = ['button', 'button-primary', 'tplus-dashicons', 'tplus-button'];
	$output =	sprintf(
		'<button type="submit" %7$s name="tplus_%6$s_%1$s" class="%5$s tplus-button-%4$s" value="%2$s">
			<span class="dashicons dashicons-%3$s"></span> %2$s
		</button>',
				$form_fields,
				$label,
				$icon,
				$color,
				tplus_merge_classes(array_merge($basic_classes, [$class, $in_table ? 'tplus-button-right' : ''])),
				strtolower(str_replace(' ', '_', trim($label))),
				empty($form_fields) ? '' : sprintf('form="tplus-%1$s-form"', $form_fields)
	);

	$output = $in_table ? sprintf($tr, $output) : $output;
	return $output;
}

function tplus_button_side($options, $label, $icon, $color = 'blue') {
	return tplus_button($options, $label, $icon, $color, false, 'tplus-side-button');
}

function tplus_button_link($button_option, $label, $icon, $color = 'blue', $in_table = false, $side_button = true) {
	global $_settings_page;

	$tr = '<tr valign="top"><td class="field_label"></td><td class="tplus-field">%1$s</td></tr>';
	$basic_classes = ['button', 'button-primary', 'tplus-dashicons', 'tplus-button', 'tplus_ajax_option'];
	$output =	sprintf(
		'<a href="%1$s" class="%5$s tplus-button-%4$s" data-tplus_option="%6$s">
			<span class="dashicons dashicons-%3$s"></span> 
			<span class="tplus-link-text">%2$s</span>
		</a>',
		add_query_arg($button_option, 1, $_settings_page),
		$label,
		$icon,
		$color,
		tplus_merge_classes(array_merge($basic_classes, [$in_table ? 'tplus-button-right' : '', $side_button ? 'tplus-side-button' : ''])),
		$button_option
	);
	
	$output = $in_table ? sprintf($tr, $output) : $output;
	return $output;
}

function tplus_fields($form_items, $form_desc = '', $ajax_rel = '') {
	return sprintf(
			'<div class="form_desc">%1$s</div>
			<table class="form-table tplus-form-general"%3$s>%2$s</table>',
			$form_desc,
			is_array($form_items) ? implode('', $form_items) : $form_items,
			empty($ajax_rel) ? '' : sprintf(' data-ajaxrel="%1$s"', $ajax_rel)
		);
}

function tplus_form($options_id) {

	printf('<form id="tplus-%1$s-form" method="post" action="options.php">', $options_id);
	settings_fields($options_id);
	wp_nonce_field('closedpostboxes', 'closedpostboxesnonce', false);
	wp_nonce_field('meta-box-order', 'meta-box-order-nonce', false);
}

// Meta Box Configuration -----------------------------------------------------]

function tplus_add_admin_meta_boxes($settings_page, $settings_id, $options_id, $options, $errors_id) {
	global $_settings_page;
	
	$_settings_page = $settings_page;
	$args = [$options_id, $options, $errors_id];

	// Normal Boxes --------------------------------------------------------------]
	
	add_meta_box(
		'tplus-options-mb', 
		__('Options', 'tplus-plugin'), 
		'tplus_print_options_meta_box', 
		$settings_id, 
		'normal',
		'high',
		$args
	);

	add_meta_box(
		'tplus-switcher-mb', 
		__('Language Switcher', 'tplus-plugin'), 
		'tplus_print_switcher_meta_box', 
		$settings_id, 
		'normal',
		'high',
		$args
	);
	
	add_meta_box(
		'tplus-duplicate-mb', 
		__('Duplicate Menu', 'tplus-plugin'), 
		'tplus_print_duplicate_meta_box', 
		$settings_id, 
		'normal',
		'high',
		$args
	);

	// Advanced & Side Boxes -----------------------------------------------------]
	
	add_meta_box(
		'tplus-errors-mb', 
		__('Errors (last 20 messagges)', 'tplus-plugin'), 
		'tplus_print_errors_meta_box', 
		$settings_id, 
		'advanced',
		'low',
		$args
	);

	add_meta_box(
		'tplus-side-mb', 
		__('Plugin Status', 'tplus-plugin'), 
		'tplus_print_status_side_meta_box', 
		$settings_id, 
		'side',
		'high',
		$args		
	);
      
	add_meta_box(
		'tplus-debug-mb', 
		__('Debug Actions', 'tplus-plugin'), 
		'tplus_print_debug_side_meta_box', 
		$settings_id, 
		'side',
		'low',
		$args		
	);
}

// Normal Blocks --------------------------------------------------------------]

function tplus_print_options_meta_box($post, $args) {

	$options = new tplus_Options($args);
	
	$items = [];
	$items[] = tplus_checkbox($options, 'flags', 'Show flags in buttons?');
	$items[] = tplus_checkbox($options, 'qtxseo', 'Include support for Yoast SEO Plugin?', 'The Yoast SEO should be activated.');

	$desc = 'The plugin extend functionality of qTranslate-X plugin.';

	echo tplus_fields($items, $desc);
	printf('<div class="tplus_mobile_only">%1$s</div>', tplus_button($options, __('Save Options', 'tplus-plugin'), 'admin-tools', 'blue'));
}

function tplus_print_switcher_meta_box($post, $args) {

	$options = new tplus_Options($args);
	
	$items = [];
	$items[] = tplus_checkbox($options, 'ls_frontend', 'Swither on Front-End?');
	$items[] = tplus_checkbox($options, 'ls_menu', 'Swither in Menu?', 'The switcher should be added in menu to be displayed.');

	$desc = 'Customization & settings for Language Switcher.';
	echo tplus_fields($items, $desc);
}

function tplus_print_duplicate_meta_box($post, $args) {

	$options = new tplus_Options($args);
	$duplicate = new tplus_Duplicate();
	$duplicate->print_metabox($options);
}

// Advanced Blocks ------------------------------------------------------------]

function tplus_print_errors_meta_box($post, $args) {

	$options = new tplus_Options($args);
	$errors = get_option($options->errors_id());
	$lines = '<div class="form_desc">There\'re no errors.</div>';
	
	if(!empty($errors)) {
		
		$lines = '<table class="tplus-plugin tplus-plugin-list" cellspacing="0" cellpadding="0" border="0">
						<thead>
							<tr>
								<th class="index"></th>
								<th class="status"></th>
								<th class="function">Function</th>
								<th class="name">Error Description</th>
								<th class="time">Time</th>
							</tr>
						</thead>
						<tbody>';
							
		$err_count = count($errors);							
		foreach(array_reverse($errors) as $key => $error) 
			$lines .= sprintf(
				'<tr class="view">
					<td class="index">%3$s</td>
					<td class="status"><div class="status-circle disabled"></div></td>
					<td class="function">%4$s</td>
					<td class="name">%2$s</td>
					<td class="time">%1$s</td>
				</tr>',
				date('H:i <b>d.m.y</b> ', intval($error[1])),
				$error[0],
				$err_count - $key,
				empty($error[2]) ? 'unknown' : $error[2]
			);
		$lines .= '</tbody></table>';
	} 

	echo $lines;
}
	
// Side Blocks ----------------------------------------------------------------]

function tplus_print_status_side_meta_box($post, $args) {
	
	$options = new tplus_Options($args);
	echo apply_filters('tplus_print_side_settings', '');	
	echo tplus_button_side($options, __('Save Options', 'tplus-plugin'), 'admin-tools');
}

function tplus_print_debug_side_meta_box($post, $args) {
	
	$options = new tplus_Options($args);
	$revisions = get_option('tplus_revisions');
	if(!empty($revisions)) {
		$output = '<h3>Revisions</h3>';
		foreach($revisions as $key => $value) {
			$output .= sprintf('<p class="tplus_revision_info">%1$s - <code>%2$s</code></p>', $key, $value);
		}
	}
	
	printf('<div class="form_desc">%1$s</div>', empty($output) ? '' : $output);

	if(!empty($revisions)) echo tplus_button_link('tplus_clear_revisions', __('Clear Revisions', 'tplus-plugin'), 'calendar-alt', 'gold');
	
	echo tplus_button_link('tplus_clear_errors', __('Clear Errors', 'tplus-plugin'), 'trash', 'red');
	echo tplus_button_link('tplus_test', __('Test', 'tplus-plugin'), 'dashboard', 'green');
}

/*
	$items .= tplus_hidden($options, 'restart', 1);

	$items .= tplus_text($options, 'lang', 'File to watch on Dropbox', 'File to check on Dropbox. <strong>Path should start with "/".</strong>');
	
	$items .= tplus_select($options, 'interval', 'Check your Dropbox folder:', [	
		300 => 'Every five minutes', // 300
		600 => 'Every ten minutes', 
		1800 => 'Every thirty minutes', 
		3600 => 'Every hour', 
		7200 => 'Every two hours']
	);

	$users = get_users();
	$select_users = array();
	foreach($users as $user) $select_users[$user->ID] = $user->user_login;
	$items .= tplus_select($options, 'author', 'Default Author', $select_users);

*/

	