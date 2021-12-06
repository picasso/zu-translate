<?php

trait zusnippets_Featured {

    private $random_attachment_id = null;

	public function get_featured_from_posts($posts) {
		$ids = [];
		if(empty($posts)) return $ids;

		foreach($posts as $post) {
			$post_id = $post instanceof WP_Post ? $post->ID : $post;
			$attachment_id = $this->get_attachment_id($post_id);
			if(!empty($attachment_id)) $ids[] = $attachment_id;
		}
		return $ids;
	}

	public function get_featured_attachment_id($post_id = null) {
		// if there is no featured_attachment - use it from $this->random_attachment_id
		// if $post_id = -1 then simply return 'random_attachment_id'
		if($post_id == -1) return $this->random_attachment_id;

		$attachment_id = get_post_thumbnail_id($post_id);
		$attachment_id = empty($attachment_id) && !empty($this->random_attachment_id) ? $this->random_attachment_id : $attachment_id;
		return $attachment_id;
	}

	public function set_random_featured_attachment_id($post_id = null, $gallery_or_ids = null, $only_landscape = false) {
		$gallery = empty($gallery_or_ids) ? $this->get_post_gallery($post_id) : $gallery_or_ids;
		$ids = wp_parse_id_list($gallery['ids'] ?? $gallery);

		$this->random_attachment_id = null;

		if(!empty($ids) && is_array($ids)) {
			if($only_landscape) {
                // because if the ZuMedia plugin did not register the 'get_all_landscaped' method it will return null
				$landscaped = array_values(array_intersect($ids, $this->get_all_landscaped() ?? $ids));
				if(empty($landscaped)) $landscaped = $ids;
                $index = rand(0, count($landscaped) - 1);
				$this->random_attachment_id = (int) ($landscaped[$index] ?? 0);
			} else {
                $index = rand(0, count($ids) - 1);
				$this->random_attachment_id = (int) ($ids[$index] ?? 0);
			}
		}
		return $this->random_attachment_id;
	}
}
