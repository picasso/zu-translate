<?php  
//	
// 	How adapt for a new plugin:
//
// 		- replace 'tplus_' for 'your_'
//
?>
<div class="wrap">
	<?php screen_icon(); ?>
	<h2 class="notice-after"><?php do_action('tplus_print_title'); ?></h2>
	<?php
		// Show error messages
		settings_errors();
		do_action('tplus_print_error_settings');
		
		// Oputput form
		do_action('tplus_print_form');
	?>
		<div id="poststuff">
			<div id="post-body" class="metabox-holder columns-<?php echo 1 == get_current_screen()->get_columns() ? '1' : '2'; ?>">
				<?php do_action('tplus_print_body'); ?> 
				<div id="postbox-container-1" class="postbox-container">
				<?php do_meta_boxes('', 'side', null); ?>
				<?php do_action('tplus_print_side');	?> 
				</div> <!-- #postbox-container-1 -->
				
				<div id="postbox-container-2" class="postbox-container plugin-mb">
				<?php do_meta_boxes('', 'normal', null);  ?>
				<?php do_meta_boxes('', 'advanced', null); ?>
				</div> <!-- #postbox-container-2 -->	     					
			</div> <!-- #post-body -->
		</div> <!-- #poststuff -->
	</form>			
	<?php do_action('tplus_print_footer'); ?>
</div><!-- .wrap -->



