// @codekit-prepend "arrive.min.js"; 
// https://github.com/uzairfarooq/arrive/

(function($) { /* global qTranslateConfig, qtranxj_split */

	function is_modal() {
		return $('body').hasClass('modal-open') ? true : false;
	}

	function is_not_attachment() {
		
		var $body = $('body');
		return $body.hasClass('post-type-attachment') || $body.hasClass('upload-php') ? false : true;
	}

	function update_lang_element($elem) { 
		
		if($elem.data('qtx') === undefined) {
			var value = $elem.is('input') ? $elem.val() : $elem.html(); 
			$elem.data('qtx', value);
		}
		
		var blocks = qtranxj_split($elem.data('qtx'));
		$elem[$elem.is('input') ? 'val' : 'html'](blocks[qTranslateConfig.activeLanguage]);
	}

	function update_translation() {
		
		if(is_not_attachment() && !is_modal()) return;
		
		$('.attachment-details .settings').children().each(function() {
		
			update_lang_element($(this));
		});
	}

	$(document).arrive('.attachment-details', update_translation);

	$(document).ready( function() {
		
		update_translation();
		
	});  // end of $(document).ready
	
})(jQuery);

