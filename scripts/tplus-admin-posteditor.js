(function($) { /* global qTranslateConfig, qtranxj_split */

	var indicate_Language_fields = ['wpcf-terms', 'postexcerpt'];
	var last_score = null, last_content_score = null;
	var ALT_is_pressed = false;

// QTX Functions --------------------------------------------------------------]

function tplus_updateSelect(lang) { // old variant of SELECT in Types
	
	$('.wpcf-form-select').children().each(function() {
		
		var $this = $(this);
		if($this.data('qtx') === undefined) $this.data('qtx', $this.html());
		
		var blocks = qtranxj_split($this.data('qtx'));
		$this.html(blocks[lang]);
	});
}

function tplus_updateList(lang) {
	
	$('.tplus_lang_childs').children().each(function() {
		
		var $this = $(this);
		var blocks = qtranxj_split($this.data('qtx'));
		$this.html(blocks[lang]);
	});
}

function tplus_languageName(lang) {
	
	return qTranslateConfig.language_config[lang].name;
}

function tplus_updateLanguageName(lang) {
	
	var lang_name = tplus_languageName(lang);
	$('.tplus_lang').each(function() {
		$(this).text(lang_name);
	});
}

function tplus_setupCopyButtons() {
	
	$.each(qTranslateConfig.qtx.getLanguages(), function(key) {
		if(key !== qTranslateConfig.activeLanguage) {
			tplus_updateCopyButtons(key);
		}
	});
}

function tplus_updateCopyButtons(prev_lang) {
	
	var $copy_button = $('.tplus_copy_content');
	
	$copy_button.text('Copy From ' + tplus_languageName(prev_lang));
	$copy_button.data('copy_lang', prev_lang);
}

function tplus_setContent(content) {
	
	if(typeof window.tinyMCE !== 'undefined' && window.tinyMCE.get('content')) {
		
		var editor = window.tinyMCE.get('content');
		editor.setContent($.trim(content), { format : 'html' });
	} else {
		
		$( '#content').val($.trim( content));
	}
}

function tplus_copyFromLanguage(copy_lang, full_copy) {
	
	var sel = 'input[name="qtranslate-fields[content][' + copy_lang + ']"]';
	full_copy = (full_copy !== undefined && full_copy === true) ? (ALT_is_pressed ? false : true) : false;
	
	tplus_setContent($(sel).val());

	if(full_copy) {
		sel = 'input[name="qtranslate-fields[post_title][' + copy_lang + ']"]';
		$('#title').val( $(sel).val() ).focus();
		sel = 'input[name="qtranslate-fields[excerpt][' + copy_lang + ']"]';
		$('#excerpt').val( $(sel).val() ).focus();
// 				sel = 'input[name="qtranslate-fields[wpcf][program][' + copy_lang + ']"]';
// 				$('#wpcf-program').val( $(sel).val() ).focus();
		
	} 
}

function tplus_langSwitchAfter(lang, prev_lang) {
	
	tplus_updateLanguageName(lang);
	tplus_updateSelect(lang);
	tplus_updateList(lang);
	tplus_updateCopyButtons(prev_lang);

	// reset checking WPSEO
	
	last_score = null;
	last_content_score = null;
}

function tplus_indicateLanguage(name) {
	
	$('.wpt-field').each(function() {
		var	$field = $(this),
				field_name = $(this).data('wpt-id');
		
		$.each(indicate_Language_fields, function(index, value) { 
		
			if(field_name === value) {
				$field.find('label.wpt-form-label').append('<span class="tplus_lang">' + name + '</span>');
			}
		});
	});
	
	$('.postbox').each(function() {
		var	box_id = $(this).attr('id'),
				$box = $(this);
		
		$.each(indicate_Language_fields, function(index, value) { 
		
			if(box_id === value) {
				$box.find('.hndle').append('<span class="tplus_lang">' + name + '</span>');
			}
		});
	});
	
	var $attachment_details = $('.wp_attachment_details.edit-form-section');
	if($attachment_details.length) {
		$attachment_details.before('<span class="tplus_lang tplus_attachment">' + name + '</span>');
	}
}

function tplus_updateCopyContent(content) {
	
	var titles = [ 'Copy From', 'Copy Content Only From'];
	var title_from = content ? titles[0] : titles[1];
	var title_to = content ? titles[1] : titles[0];
	
	$('.tplus_copy_content').each(function() {  
		var $copy_button = $(this);
		var title = $copy_button.text();
		
		title = title.replace(title_from, title_to);
		$copy_button.text(title);
		$copy_button.toggleClass('alt-pressed', content);
	});
}

function tplus_altKeyPressed() {
    
    var vAnotherKeyWasPressed = false;			//Flag to check if another key was pressed with alt
    var ALT_CODE = 18;									//ALT keycode const

    //When some key is pressed
    $(window).keydown(function(event) {
        var vKey = event.keyCode ? event.keyCode : event.which ? event.which : event.charCode;  //Identifies the key
        vAnotherKeyWasPressed = vKey !== ALT_CODE;		//The last key pressed is alt or not? 
        ALT_is_pressed = vKey === ALT_CODE;
        if(!vAnotherKeyWasPressed && ALT_is_pressed) tplus_updateCopyContent(true);

    });

    //When some key is left
    $(window).keyup(function(event) {
	    ALT_is_pressed = false;
	    tplus_updateCopyContent(false);

        //Identifies the key
        var vKey = event.keyCode ? event.keyCode : event.which ? event.which : event.charCode;

        //If the key left is ALT and no other key is pressed at the same time...
        if (!vAnotherKeyWasPressed && vKey === ALT_CODE) return false;
    });
}


// QTX SEO Functions ----------------------------------------------------------]

function tplus_wpseo_is_used() {
	var qtx_seo = $('body').hasClass('qtx-seo-enabled') ? true : false;
	return (qtx_seo && $('#wpseo-meta-section-content').length > 0) ? true :false;
}

function tplus_wpseo_detect_changes() {

	var score_selector = '#wpseo-meta-section-content .wpseo_keyword_tab a';
	var content_score_selector = '#wpseo-meta-section-content .wpseo_generic_tab a';
	
	setInterval(function () {
	   var new_score = $(score_selector).data('score');
	   var new_content_score = $(content_score_selector).data('score');
	   
	   if(new_score !== last_score) {
	      last_score = new_score;
	      tplus_wpseo_update_seo_value(last_score, '#qtx_seo_score');
	   }
	   if(new_content_score !== last_content_score) {
	      last_content_score = new_content_score;
	      tplus_wpseo_update_seo_value(last_content_score, '#qtx_seo_content_score');
	   }
	}, 500);
}

function tplus_qtranxj_concat(blocks) {
	
	var result = '';
	for(var lang in qTranslateConfig.language_config) {
		result += '[:' + lang + ']';
		if(typeof blocks[lang] !== "undefined") result += $.trim(blocks[lang]);
	}
	result += '[:]';
	return $.trim(result);
}

function tplus_wpseo_update_seo_value(score, score_selector) {
		
		var $qtx_seo_score = $(score_selector);
		if($qtx_seo_score.length) {
			var blocks = qtranxj_split($qtx_seo_score.val());

			blocks[qTranslateConfig.activeLanguage] = score;

/* maybe not needed after reset of last_score !!!

			for(var lang in blocks) { 
				if((typeof(blocks[lang]) === 'undefined') || $.trim(blocks[lang]) === '') blocks[lang] = score;  // when we have the same score for a new language 'tplus_wpseo_detect_changes' does not work
			}
*/
			
			var result = tplus_qtranxj_concat(blocks);

			$qtx_seo_score.val(result);
		}
}

// When the document is ready... ----------------------------------------------]
	
	$(document).ready( function() {
		
		tplus_altKeyPressed();

		// Move info about last edit --------------------------------------------------]

// 		$('#minor-publishing').append($('#last-edit').css({ display: 'inline-block', padding: '20px'}).detach());

		// Process languages ----------------------------------------------------------]
			
			// qTranslateConfig.qtx.addLanguageSwitchBeforeListener(tplus_langSwitchBefore);
			qTranslateConfig.qtx.addLanguageSwitchAfterListener(tplus_langSwitchAfter);
			
			// Add label to indicate language
			tplus_indicateLanguage(tplus_languageName(qTranslateConfig.activeLanguage));
			
			// Update text in select and list according to language
			tplus_updateSelect(qTranslateConfig.activeLanguage);
			tplus_updateList(qTranslateConfig.activeLanguage);
			
			// Create Copy Language for non Page Builder pages
			$('#post-body-content .qtranxs-lang-switch-wrap:first-child').append('<a class="tplus_copy_content" id="tplus-copy-lang" title="Press ALT to copy Content Only"></a>'); 
			
			tplus_setupCopyButtons();

			$('#tplus-copy-lang').unbind().click(function(e) {
				e.preventDefault();
				e.stopImmediatePropagation();
				tplus_copyFromLanguage($(this).data('copy_lang'), true);
			});


		// WPSEO support for QTX ------------------------------------------------------]

		if(tplus_wpseo_is_used()) tplus_wpseo_detect_changes();
		
	}); // end of $(document).ready
	
})(jQuery);

