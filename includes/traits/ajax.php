<?php
// NOTE: еще не портировано после перехода на 'Zukit'

// Ajax/REST API helpers ------------------------------------------------------]

trait zu_TranslateAjax {

	public function ajax_more($action, $value) {
		if($action === 'zutranslate_reset_supported') return $this->reset_supported_blocks();
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

	private function reset_supported_blocks() {
		$this->assign_supported_blocks();
		return $this->create_notice('infodata', // combine 'info' with 'data'
			__('Block Editor settings are reset to defaults', 'zu-translate'),
			$this->supported_data
		);
	}
}
