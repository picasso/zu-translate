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
	gutenberg: {
		label: 	__('Support WordPress Block Editor', 'zu-translate'),
		help:	__('Settings and list of supported blocks see below in the "**Block Editor Support**" section.', 'zu-translate'),
	},
	flags: {
		label: 	__('Show flags in buttons', 'zu-translate'),
		help:	__('Display country flag on language switching buttons in admin mode.', 'zu-translate'),
	},

	media_details: {
		label: 	__('Language Switcher in Media Details', 'zu-translate'),
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
	note: __('Only blocks **known to this plugin** will support language switching in the **Block Editor**.\nTo disable the block support - turn off the **checkbox** in front of the block name. You can also add other blocks - for this you need to know the **internal** name of the block (which includes the `namespace`) and the name of the attribute/attributes that contain the **content** of the block (*what requires translation*). You can learn these names by looking at the source code of the plugin/themes where these blocks are defined or by contacting the developer.\nUnfortunately, a *simpler* method has not yet been found.', 'zu-translate'),
	blockTitle: __('Supported blocks', 'zu-translate'),
	compress: __('Compress language data to reduce page size', 'zu-translate'),
	sync: {
		label: __('Synchronize language switching', 'zu-translate'),
		help: __('Switching a language in one block will lead to language switching in all editable blocks.', 'zu-translate'),
	},
	custom: {
		nameLabel: __('Block name', 'zu-translate'),
		nameHelp: __('The block name must contain a **namespace** and a **slash**, for example, `core/quote`', 'zu-translate'),
		attsLabel: __('Attribute names', 'zu-translate'),
		attsInput: __('Enter the name of the attribute', 'zu-translate'),
		attsInputHelp: __('Usually the attribute has the name `content`, but it is not always so (see note above)', 'zu-translate'),
		addBlock: __('Add block', 'zu-translate'),
	},
	resetAll: __('Reset Block Editor Settings', 'zu-translate'),
	errName: __('It does not look like a valid **block name**. Maybe you forgot the `namespace`? ', 'zu-translate'),
	errAtts: __('You need to specify at least one **attribute** for translation.', 'zu-translate'),
	errDups: __('Duplicates are not allowed. Are you mistaken in the name of the block?', 'zu-translate'),
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
