<?php
// NOTE: еще не портировано после перехода на 'Zukit'

// Ajax/REST API helpers ------------------------------------------------------]

trait zu_TranslateAjax {

	public function ajax_more($action, $value) {
		if($action === 'zutranslate_action1') return $this->action1();
		elseif($action === 'zutranslate_action2') return $this->action1(true);
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
	}

	private function action1() {
		// flush_rewrite_rules();
		return $this->create_notice('success', 'WordPress rewrite rules were removed and then recreated.');
	}
}
