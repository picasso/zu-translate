<?php

// Duplicate post -------------------------------------------------------------]

trait zu_TranslateDuplicate {

	private $title_suffix = 'CONVERTED';

	public function duplicate_post_as_draft($post, $content = null, $suffix = null, $status = 'draft') {
		// if post data exists, create the post duplicate
		if(isset($post) && $post !== null) {
			global $wpdb;

			$post_id = $post->ID;
			$current_user = wp_get_current_user();

			$args = [
				'post_title' 		=> $this->get_unique_title($post, $suffix),
				'post_author' 		=> $current_user->ID,
				'post_status' 		=> $status,

				'post_type' 		=> $post->post_type,
				'post_parent' 		=> $post->post_parent,
				'post_content' 		=> $content ?? $post->post_content,
				'post_excerpt' 		=> $post->post_excerpt,
				'post_password' 	=> $post->post_password,
				'comment_status' 	=> $post->comment_status,
				'ping_status' 		=> $post->ping_status,
				'to_ping' 			=> $post->to_ping,
				'menu_order'		=> $post->menu_order
			];

			// insert the post
			$new_post_id = wp_insert_post($args);

			 //	get all current post terms ad set them to the new post draft
			$taxonomies = get_object_taxonomies($post->post_type);
			if(!empty($taxonomies) && is_array($taxonomies)) {
				foreach($taxonomies as $taxonomy) {
					$post_terms = wp_get_object_terms($post_id, $taxonomy, ['fields' => 'slugs']);
					wp_set_object_terms($new_post_id, $post_terms, $taxonomy, false);
				}
			}

			// duplicate all post meta
			$post_meta_infos = $wpdb->get_results("SELECT meta_key, meta_value FROM $wpdb->postmeta WHERE post_id=$post_id");
			if(count($post_meta_infos) !== 0) {
				$sql_query = "INSERT INTO $wpdb->postmeta (post_id, meta_key, meta_value) ";
				foreach($post_meta_infos as $meta_info) {
					$meta_key = sanitize_text_field($meta_info->meta_key);
					$meta_value = addslashes($meta_info->meta_value);
					$sql_query_sel[] = "SELECT $new_post_id, '$meta_key', '$meta_value'";
				}
				$sql_query .= implode(" UNION ALL ", $sql_query_sel);
				$wpdb->query($sql_query);
			}
		}
	}

	private function get_unique_title($post, $suffix = null) {
		global $wpdb;

		$index = 0;
		$post_type = $post->post_type;
		$title_suffix = $suffix ?? $this->title_suffix;
		$title_blocks = qtranxf_split($post->post_title);
		// select the language to search for titles, preferably English, if not, then the first
		$languages = array_keys($title_blocks);
		$title_lang = in_array('en', $languages) ? 'en' : ($languages[0] ?? '?');

		$like_title = sprintf('%%%s [%s%%', $title_blocks[$title_lang] ?? $post->post_title, $title_suffix);
		$title_query = "SELECT post_title FROM $wpdb->posts WHERE post_type = '{$post_type}' AND post_title like '{$like_title}'";
		$results = $wpdb->get_results($title_query);
		if($results) {
			$titles = [];
			foreach($results as $postdata) {
				$title = $postdata->post_title;
				$result = preg_match('/\[' . $title_suffix . '[-]*([\d]*)/i', $postdata->post_title, $matches);
				$titles[] = (int) $matches[1] ?? 0;
			}
			while($index++ < 100) {
				if(in_array($index, $titles)) continue;
				break;
			}
		}
		foreach($title_blocks as $lang => $title) {
			$title_blocks[$lang] = sprintf('%s [%s%s]', $title, $title_suffix, $index > 0 ? "-{$index}" : '');
		}
		return qtranxf_join_b($title_blocks);
	}
}
