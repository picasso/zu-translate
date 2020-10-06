<?php
trait zusnippets_Slugs {

	// Slug & Ancestor functions ----------------------------------------------]

    public function get_slug($post_id = null) {
		return basename(get_permalink($post_id));
	}

	public function is_child($post_id = null) {
		$post_id = empty($post_id) ? get_the_ID() : $post_id;
		return empty(get_post_ancestors($post_id)) ? false : true;
	}

	public function is_child_of_slug($slug, $post_id = null, $skip_attachments = true) {
		return ($this->is_child($post_id) && $this->get_top_ancestor_slug($post_id, $skip_attachments) == $slug) ? true : false;
	}

	public function post_id_from_slug($slug, $post_type = 'post') {

		$args = array(
			'name' 						=> $slug,
			'post_type' 				=> $post_type,
			'posts_per_page' 			=> -1,
			'cache_results' 			=> false,
			'update_post_meta_cache' 	=> false,
			'update_post_term_cache' 	=> false,
			'orderby' 					=> 'ID',
		);

		$posts = get_posts($args);
		return empty($posts) ? null : $posts[0]->ID;
	}

	public function get_top_ancestor($post_id = null, $skip_attachments = true) {

		if(empty($post_id)) $post_id = get_the_ID();
		if($skip_attachments && is_attachment()) return $post_id;
		$parents = get_post_ancestors($post_id);
		// Get the top Level page->ID count base 1, array base 0 so -1
		$parent_id = ($parents) ? $parents[count($parents)-1] : null;
		return empty($parent_id) ? $post_id : $parent_id;
	}

	public function get_top_ancestor_slug($post_id = null, $skip_attachments = true) {
		return $this->get_slug($this->get_top_ancestor($post_id, $skip_attachments));
	}
}
