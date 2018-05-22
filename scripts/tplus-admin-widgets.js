//
// executed for		/wp-admin/widgets.php
//
/* global qTranslateConfig */
jQuery(document).ready(
function($) {
	//if(typeof wpWidgets === 'undefined') return;
	if(!window.wpWidgets) return;
	
	var qtx = qTranslateConfig.js.get_qtx();

	var onWidgetUpdate = function( evt, widget ){
		widget.find("textarea[id^='widget-custom_html-'][id$='-content']").each(function(i,e) {
			qtx.refreshContentHook(e);
		});
	};

	$(document).on('widget-added', onWidgetUpdate);
	$(document).on('widget-updated', onWidgetUpdate);

	var onLanguageSwitchAfter = function(){
		$('#widgets-right .widget').each(function() { 
			window.wpWidgets.appendTitle(this); 
		});
		
		$('.CodeMirror').each(function() {
			var lang = qtx.getActiveLanguage();
			var $form = $(this).parents('form');
			var $content = $form.find('input[name$="[content][' + lang + ']"]');
			
			var $saved = $form.find('input[name="savewidget"]');
			var is_saved = $saved.val().toUpperCase() === 'Saved'.toUpperCase() ? true : false;

			this.CodeMirror.setValue($content.val());
			if(is_saved) $saved.val('Saved').prop('disabled', true);
		});
	};

	qtx.addLanguageSwitchAfterListener(onLanguageSwitchAfter);
});
