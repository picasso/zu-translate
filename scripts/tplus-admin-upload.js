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

	function select_lang_data($elem, lang) {
		
		var blocks = qtranxj_split($elem.data('qtx'));
		var $maybe_a = $elem.find('a');

		if($maybe_a.length) $maybe_a.text(blocks[lang]);
		else $elem.html(blocks[lang].replace(/(?:\r\n|\r|\n)/g, '<br />'));
	}
	
	function update_lang_elements(lang) {
		$('.qtx_alias,.qtx_span').each(function() {
			select_lang_data($(this), lang);
		});
	}
	
	function create_lang_buttons() { 
		
		var switch_html = '<div class="qtx-help">You should use <strong>"Edit more details"</strong> link to change values of Title, Caption, Description and others.</div>'+
									'<ul id="qtx-details" class="qtranxs-lang-switch-wrap widefat">';
		
		for(var lang in qTranslateConfig.language_config) {
			var li_class = 'qtranxs-lang-switch' + (qTranslateConfig.activeLanguage === lang ? ' active' : '');
			switch_html += '<li lang="' + lang + '" class="'+li_class+'"><span>'+qTranslateConfig.language_config[lang].name+'</span></li>';
		}
		
		switch_html += '</ul>';
		
		$('.attachment-details .details').append(switch_html);
		
		var $qtx_details = $('#qtx-details');
		
		$qtx_details.find('li').click(function(e) {
			e.preventDefault();
			e.stopImmediatePropagation();
			
			var $clicked = $(this);
			$clicked.parent().find('li').removeClass('active');
			$clicked.addClass('active');
			update_lang_elements($clicked.attr('lang'));			
		});
	}

	function fill_alias_lang(elem_class) { 
		
		var $elem = $('.'+elem_class);
		if($elem.data('qtx') === undefined) return;
		
		select_lang_data($elem, qTranslateConfig.activeLanguage);
	}

	function create_alias_location($location) {
		
		$location.after('<div class="qtx_alias input qtx_location_alias" data-qtx="'+$('.qtx-location').text()+'"></div>');
		fill_alias_lang('qtx_location_alias');
		$location.hide();
	}
	
	function create_alias_field($setting) {
		
		var names_to_process =  ['title', 'caption', 'description'];
		var name = $setting.data('setting');
		
		if(name === undefined) {
			var $span = $setting.find('span.value');
			if($span.length) {
				var span_class = 'qtx_' + $setting.find('span.name').text();
				span_class = span_class.split(' ').join('_').toLowerCase();
				
				$span.data('qtx', $span.text()).addClass(span_class).addClass('qtx_span');
				fill_alias_lang(span_class);
			}
		}
		
		if(names_to_process.indexOf(name) === -1) return;
		
		var qtx_name = 'qtx_' + name;
		var $input = $setting.find('input,textarea');
		var class_name = $input.is('textarea') ? 'qtx_alias textarea ' : 'qtx_alias input ';
		$setting.append('<div class="'+class_name+qtx_name+'" data-qtx="'+$input.val()+'"></div>');
		fill_alias_lang(qtx_name);
		$input.hide();
	}
	
	function update_translation() {
		
		if(!$('body').hasClass('qtx-media-enabled')) return;
		
		if(is_not_attachment() && !is_modal()) return;
		
		$('.attachment-details .settings').children().each(function() {

			create_alias_field($(this));	
		});

		create_lang_buttons();
		create_alias_location($('.compat-field-location input'));
		$('.compat-field-post_tag input').focus().blur();
	}

	$(document).arrive('.attachment-details', update_translation);

	$(document).ready( function() {
		
		update_translation();
		
	});  // end of $(document).ready
	
})(jQuery);

