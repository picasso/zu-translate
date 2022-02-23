<?php
// NOTE: еще не портировано после перехода на 'Zukit'

// Ajax/REST API helpers ------------------------------------------------------]

trait zu_TranslateAjax {

	public function ajax_more($action, $value) {
		if($action === 'zutranslate_reset_supported') return $this->reset_supported_blocks();
		if($action === 'zutranslate_convert_classic') return $this->convert_classic($value);
		if($action === 'zutranslate_split_classic') return $this->split_classic($value);
		else return null;
	}

	// https://github.com/picasso/zukit/wiki/%5BBasics%5D-Ajax#extending-zudata
	protected function extend_zudata($key, $params) {
		$result = null;
		if($key === 'qtxt' && $this->is_multilang()) {
			// collect data for REST API
			$prop = $params['prop'] ?? null;
			$data = $this->get_REST_qtx();
			$result = empty($prop) ? $data : ($data[$prop] ?? []);
		}
		return $result;
	}

	private function get_REST_qtx() {
		return [];
		// $folders = $this->folders->get_folders();
		// foreach($folders as $key => $value) {
		// 	unset($folders[$key]['childs_count'], $folders[$key]['meta']);
		// 	$folders[$key]['landscaped'] = array_values(array_intersect(
		// 		$value['images'],
		// 		$this->get_all_landscaped()
		// 	));
		// }
		// return $folders;

		add_action('init', function() {
			$all_registered = WP_Block_Type_Registry::get_instance()->get_all_registered();
			zu_log($all_registered);
			$all_blocks = [];
			foreach($all_registered as $name => $data) {
				$all_blocks[$name] = [
					'title'	=> $data->title,
					'atts'	=> array_keys($data->attributes),
				];
			}
			zu_log($all_blocks);
		}, 99);
	}

	private function get_all_registered_blocks() {
		add_action('init', function() {
			$all_registered = WP_Block_Type_Registry::get_instance()->get_all_registered();
			// zu_log($all_registered);
			$all_blocks = [];
			foreach($all_registered as $name => $data) {
				$all_blocks[$name] = [
					'title'	=> $data->title,
					'atts'	=> array_keys($data->attributes),
				];
			}
			zu_log($all_blocks);
		}, 99);
	}

	private function reset_supported_blocks() {
		$this->assign_supported_blocks();
		return $this->create_notice('infodata', // combine 'info' with 'data'
			__('Block Editor settings are reset to defaults', 'zu-translate'),
			$this->supported_data
		);
	}

	// conversion helpers -----------------------------------------------------]

	private function convert_classic($convert_data) {
		[ $id, $postType, $primaryLang ] = $this->sanitize_data($convert_data);
		$posts = $this->get_selected_posts($id, $postType);
		$converted = [];
		foreach($posts as $post_id) {
			$result = $this->convert_classic_blocks($post_id, $primaryLang);
			if($result) $converted[] = $post_id;
		}
		return $this->create_action_notice($converted, $posts, false);
	}

	private function split_classic($convert_data) {
		[ $id, $postType ] = $this->sanitize_data($convert_data);
		$posts = $this->get_selected_posts($id, $postType);
		$converted = [];
		foreach($posts as $post_id) {
			$result = $this->split_classic_blocks($post_id);
			if($result) $converted[] = $post_id;
		}
		return $this->create_action_notice($converted, $posts, true);
	}

	private function sanitize_data($convert_data) {
        return is_array($convert_data) ? [
            intval($convert_data['id'] ?? 0),
            sanitize_text_field($convert_data['postType'] ?? 'post'),
			sanitize_text_field($convert_data['primaryLang'] ?? 'en'),
        ] : [0, 'post', 'en'];
    }

	private function get_selected_posts($id, $postType) {
		return $id > 0 ? [$id] : get_posts([
			'posts_per_page'	=> -1,
			'post_type'			=> $postType,
		    'fields'			=> 'ids',
		]);
	}

	private function create_action_notice($converted, $posts, $is_split) {
		$failed = empty($converted);
		$message = __('The following posts have been converted from **Classic Blocks**', 'zu-translate');
		if($is_split) $message = __('The following posts have been split from **Classic Blocks**', 'zu-translate');
		if($failed) $message = __('**Classic blocks** were not found in the following posts', 'zu-translate');
		return $this->create_notice($failed ? 'warning' : 'success',
			sprintf('%s `[ %s ]`',
				$message,
				implode(', ', $failed ? $posts : $converted)
			)
		);
	}
}
