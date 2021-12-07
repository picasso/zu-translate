<?php

// Ajax/REST API helpers ------------------------------------------------------]

trait zu_TranslateAjax {

	public function ajax_more($action, $value) {
		if($action === 'zumedia_reset_cached') return $this->reset_cached();
		elseif($action === 'zumedia_reset_cached_collections') return $this->reset_cached_collections();
		elseif($action === 'zumedia_flush_rewrite') return $this->flush_rewrite_rules();
		else return null;
	}

	// https://github.com/picasso/zukit/wiki/%5BBasics%5D-Ajax#extending-zudata
	protected function extend_zudata($key, $params) {

		$result = null;
		if($this->folders) {
			// collect data for REST API
			switch($key) {
				case 'folders':
					$folder_id = $params['folderId'] ?? null;
					$folders = $this->get_REST_folders();
					$result = empty($folder_id) ? $folders : ($folders[$folder_id] ?? []);
					break;

				case 'galleries':
					$post_id = $params['postId'] ?? null;
					if(!empty($folder_id)) {
						$result = $this->folders->get_galleries($post_id);
						$result['id'] = absint($post_id);
					} else {
						$result = $this->folders->get_galleries($post_id);
						unset($result['all']);
						foreach($result as $key => $value) {
							$result[$key]['id'] = $key;
						}
					}
					break;

				// NOTE: Not implemented, not tested... it is not clear if anyone needs it
				// case 'folder_by_image':
				// 	$image_id = $params['imageId'] ?? 0;
				// 	$result = $this->folders->get_folder_by_attachment_id($image_id);
				// 	break;
				//
				// case 'all_images_in_folder':
				// 	$folder_id = $params['folderId'] ?? 0;
				// 	$include_subfolders = $this->snippets('to_bool', $params['subfolders'] ?? true);
				// 	$result = $this->folders->get_all_images_in_folder($folder_id, $include_subfolders);
				// 	break;
			}
		}
		return $result;
	}

	private function get_REST_folders() {
		$folders = $this->folders->get_folders();
		foreach($folders as $key => $value) {
			unset($folders[$key]['childs_count'], $folders[$key]['meta']);
			$folders[$key]['landscaped'] = array_values(array_intersect(
				$value['images'],
				$this->get_all_landscaped()
			));
		}
		return $folders;
	}

	private function flush_rewrite_rules() {
		flush_rewrite_rules();
		return $this->create_notice('success', 'WordPress rewrite rules were removed and then recreated.');
	}
}
