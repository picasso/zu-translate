// @codekit-prepend "when-node.js";

jQuery(document).on('qtxLoadAdmin:edit', function(event, qtx) {

	// eslint-disable-next-line no-undef
	const config = typeof qTranslateConfig !== 'undefined' ? qTranslateConfig : {};

	const $wrap = jQuery('#wpbody-content > .wrap');

	// find the title, set the RAW value from '.hidden' section and add a hook
	// after the hook is added, the title value will be set in accordance with the active language automatically
	function addTitleHook($td) {
		const $title = $td.find('a.row-title');
		const raw = $td.find('.hidden .post_title').text();
		$title.text(raw);
		qtx.addDisplayHook($title.get(0));
	}

	// add hooks to each title in the list
	jQuery('#the-list td.column-primary').each(function() {
		addTitleHook(jQuery(this));
	});

	// we have to call 'setupLanguageSwitch' since 'qtx' does not export the 'onTabSwitch' function
	// if this function was available for integration, it was much easier
	// NOTE: when available - replace with: 	qtx.addLanguageSwitchListener(onTabSwitch);
	qtx.setupLanguageSwitch();

	// create a language switcher without a 'Copy from' button
	const prev = config.hide_lsb_copy_content;
	config.hide_lsb_copy_content = true;
	const langSwitchWrap = qtx.createSetOfLSBwith('');
	config.hide_lsb_copy_content = prev;

	// add wrapper with flexbox layout
	$wrap.find('.wp-header-end').before(langSwitchWrap);
	let beforeEnd = true;
	const $flexItems = $wrap.children().filter(function() {
		if(jQuery(this).hasClass('wp-header-end')) beforeEnd = false;
		return beforeEnd;
	});
	$flexItems.wrapAll('<div class="qtranxs-flex"></div>')

	// when '.inline-editor' will be opened (inserted into DOM)
	window.whenNodeInserted(null, '.inline-editor.quick-edit-row', function(el) {
		const $editor = jQuery(el);
		const input = $editor.find('[name=post_title]').get(0);
		// remove the old hook and add a new
		qtx.refreshContentHook(input);
		// receive the ID editable post - it will be needed later
		const postId = String($editor.attr('id')).replace('edit-', '');
		// we need to move 'qtranslate-edit-language' input because qTranslate is mistaken with its placement
		jQuery('.submit.inline-edit-save').append(jQuery('input[name="qtranslate-edit-language"]'));
		// if the user clicks the 'Update' button, the title element will be updated and we will lose our hook.
		// that's why we create it again when the '.inline-editor' will be closed (removed from DOM)
		// previous hook will be removed automatically on first switching because saved node will lose 'parentNode'
		window.whenNodeRemoved(null, '.inline-editor.quick-edit-row', function() {
			addTitleHook(jQuery('#post-' + postId + ' td.title.page-title'));
		});
	});
});
