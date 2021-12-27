// WordPress dependencies

// const { map, has } = lodash;
const { __ } = wp.i18n;

// Zukit dependencies

const { simpleMarkdown } = wp.zukit.utils;
const { externalDataSettings } = wp.zukit.render;

// Settings page strings and assets

const { disabled: pluginInacive, qtxlink: qtxUrl } = externalDataSettings('zutranslate', {});

// 'The plugin extend functionality of qTranslate-XT plugin.'
// 'Customization & settings for Language Switcher.'

const inacive = __('This plugin only *complements* the functionality of the **qTranslate-XT** plugin.\nThe [qTranslate-XT]($link1) version `3.10 or above` should be installed and activated (now it **was not found** among active plugins).', 'zu-translate');

const options = {
	flags: {
		label: 	__('Show flags in buttons?', 'zu-translate'),
		help:	__('Display country flag on language switching buttons in admin mode.', 'zu-translate'),
	},
	gutenberg: {
		label: 	__('Support qTranslate-XT for WordPress Block Editor', 'zu-translate'),
		help:	__('Only blocks known to this plugin will support switching languages in the Block Editor.', 'zu-translate'),
	},

	media_details: {
		label: 	__('Add Language Switcher in Media Details?', 'zu-translate'),
		help:	__('When activated you will not be able to edit the fields when viewing the modal dialog, only on `Edit Media` page.', 'zu-translate'),
	},
	// NOTE: not yet restored after refactoring
	// yseo: {
	// 	label: 	__('Include additional support for Yoast SEO Plugin?', 'zu-translate'),
	// 	help:	__('The Yoast SEO should be installed and activated.', 'zu-translate'),
	// },
};

// NOTE: not yet restored after refactoring
const switcher = {
	ls_frontend: {
		label: __('Swither on Front-End?', 'zu-translate'),
		help:	__('???', 'zu-translate'),
	},
	ls_menu: {
		label: __('Swither in Menu?', 'zu-translate'),
		help: __('The switcher should be added in menu to be displayed.', 'zu-translate'),
	},
	ls_display: {
		// [
		// 	'lang' 	=> 'Language Name',
		// 	'code' 	=> 'Language Code',
		// ],
		label: __('Display in Menu', 'zu-translate'),
		help: __('How the language will be dispayed in menu', 'zu-translate'),
	},
	// custom_css: {
	// 	label: 	__('Use plugin CSS?', 'zu-translate'),
	// 	help:	__('If switched off the plugin stylesheet won\'t be loaded.', 'zu-translate'),
	// },
};

const gutenberg = {
	note: __('Only blocks known to this plugin will support switching languages in the Block Editor.', 'zu-translate'),
	blockTitle: __('Supported blocks', 'zu-translate'),
	compress: __('Compress language data to reduce page size', 'zu-translate'),
	// themeOptions: [
	// 	{ value: 'light', label: __('Light Theme', 'zu-translate') },
	// 	{ value: 'dark', label: __('Dark Theme', 'zu-translate') },
	// ],
	resetAll: __('Reset Block Editor Settings', 'zu-translate'),
};

const panels = {
	gutenberg: {
		value: true,
		label: 	__('Block Editor Support', 'zu-translate'),
		// Это позволит исключить эту панель когда значение option is false
		depends: 'gutenberg',
	},
	switcher: {
		value: false,
		label: 	__('Language Switcher', 'zu-translate'),
	},
};

export const zutranslate = {
	options,
	panels,
	switcher,
	gutenberg,
	inacive: pluginInacive ? simpleMarkdown(inacive, { br: true, links: qtxUrl }) : false,
}
