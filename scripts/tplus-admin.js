// 	How adapt for a new plugin:
//
// 		- replace 'tplus_' for 'your_'
//			- replace 'tplus-' for 'your-'
//
/* global tplus_custom */
(function($) {
	
	'use strict';

	$(window).on('load', function() { 	
		setTimeout(function() { $('body').addClass('ready'); }, 200);
	});	

	// When the document is ready...
	$(document).ready(function() {
		
		if($('body').hasClass(tplus_custom.screen_id)) {		// only for plugin screen
			// Bind action links
			tplus_bind_links();
	
			// Setup required fields
			$('.tplus-field.tplus-field-required').each(function() {
	
				// Define the field <td>
				var $tplus_field_td = $(this);
	
				// Check the input
				$tplus_field_td.find('.tplus-input-required').on('keyup change',function() {
	
					if(String($(this).val()) !== '') {
	
						// If the input has a value, remove the error messages
						$tplus_field_td.removeClass('tplus-field-error').removeClass('tplus-field-is-blank');
	
					} else {
	
						// If the input doesn't have a value, show the error messages
						$tplus_field_td.addClass('tplus-field-error').addClass('tplus-field-is-blank');
	
					}
				});
			});
		}
	});

	///// FUNCTIONS /////

	function tplus_bind_dismiss_links() {
		$('.notice.is-dismissible .notice-dismiss').each(function() {
			var $link = $(this);
			$link.click(function() { tplus_turn_option('tplus_dismiss_error'); }); 
			if($link.hasClass('ajax-dismiss')) $link.click(function() { setTimeout(function() { $link.parent().remove(); }, 100); });
		});
	}

	function tplus_bind_links() {
		
		tplus_bind_dismiss_links();
		
		$('.tplus_ajax_option').each(function() {  
			var $ajax_link = $(this);
			var option_name = $ajax_link.data('tplus_option');
			
			if(option_name !== undefined && option_name.length !== 0) {
				$ajax_link.unbind().click(function(e) {
					e.preventDefault();
					tplus_turn_option(option_name);
				}); 
			}
		});
	}

	function tplus_ajax_data($selector) {
	    var form_data = $selector.serialize().split('&');
	    var data = {};
	
	    $.each(form_data, function(key, value) {
	        var row = value.split('=');
	        var key_name = decodeURIComponent(row[0]).replace(/^[^\[]+\[([^\]]+)\]/, '$1');
	        data[key_name] = decodeURIComponent(row[1]);
	    });
	
	    return data;
	}
	
	function tplus_turn_option(option_name) {

		var data = {
			action: 'tplus_option',
			option_name: option_name
		};

		// Try serialize data
		var $rel = $("[data-ajaxrel='" + option_name + "']");
		if($rel.length) {
			$.extend(data, tplus_ajax_data($rel.find('input, textarea, select')));			
		}
						
		// Send an AJAX call to switch the option
		$.ajax({
			url: tplus_custom.ajaxurl,
			type: 'POST',
			dataType: 'json',
			async: true,
			cache: false,
			data: data,
			success: function(response) { tplus_update_UI(option_name, response); },
			complete: function(/*  $jqXHR, $textStatus  */) { }
		});
	}

	function tplus_update_UI(option_name, response) {
		
		var result = $.extend({result:''}, response.data).result;
		if(String(result).length) {
			$('#poststuff').parents('.wrap').find('.notice-after').after(result);
			tplus_bind_dismiss_links();
		}
		
        switch (option_name) {
            case 'tplus_clear_revisions':
	                $('.tplus_revision_info').empty();
	                break;
                
            case 'tplus_clear_errors':
	                $('#tplus-errors-mb .inside').empty().append('<div class="form_desc">There\'re no errors.</div>');
	                break;

            default:
	                break;
        }
	}

})(jQuery);