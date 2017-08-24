/* executed for
 /wp-admin/widgets.php */
/* global qTranslateConfig */
jQuery(document).ready(
function($){
	//if(typeof wpWidgets === 'undefined') return;
	if(!window.wpWidgets) return;
	
	var qtx = qTranslateConfig.js.get_qtx();

	var onWidgetUpdate = function( evt, widget ){
		widget.find("textarea[id^='widget-custom_html-'][id$='-content']").each(function(i,e){qtx.refreshContentHook(e);});
	};

	$( document ).on( 'widget-added', onWidgetUpdate );
	$( document ).on( 'widget-updated', onWidgetUpdate );

	var onLanguageSwitchAfter = function(){
		jQuery('#widgets-right .widget').each(function(){ window.wpWidgets.appendTitle(this); });
	};

	qtx.addLanguageSwitchAfterListener(onLanguageSwitchAfter);
});
