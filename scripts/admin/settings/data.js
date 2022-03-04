// WordPress dependencies

// const { map, has } = lodash;
const { __ } = wp.i18n;

// Zukit dependencies

const { simpleMarkdown } = wp.zukit.utils;
const { externalDataSettings } = wp.zukit.render;

// Settings page strings and assets

const { disabled: pluginInacive, qtxlink: qtxUrl } = externalDataSettings('zutranslate', {});

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
	appearance: {
		label: 	__('Custom button appearance', 'zu-translate'),
		help:	__('Change the appearance of the buttons for language switching in admin mode.', 'zu-translate'),
	},
	large: {
		label: 	__('Large custom button size', 'zu-translate'),
		help:	__('Enlarge the size of the buttons (*for those who prefer more*).', 'zu-translate'),
		depends: 'appearance',
	},
	list: {
		label: 	__('Add "Language Switcher" to post/pages list', 'zu-translate'),
		help:	__('Ability to switch language on a list of posts/pages and support for **Quick Edit**.', 'zu-translate'),
	},
	// NOTE: not yet restored after refactoring
	// media_details: {
	// 	label: 	__('Language Switcher in Media Details', 'zu-translate'),
	// 	help:	__('When activated you will not be able to edit the fields when viewing the modal dialog, only on `Edit Media` page.', 'zu-translate'),
	// },
	// yseo: {
	// 	label: 	__('Include additional support for Yoast SEO Plugin?', 'zu-translate'),
	// 	help:	__('The Yoast SEO should be installed and activated.', 'zu-translate'),
	// },
};

// NOTE: not yet restored after refactoring
// 'Customization & settings for Language Switcher.'
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
	note: __('Only blocks **known to this plugin** will support language switching in the **Block Editor**.\nTo disable the block support - turn off the **checkbox** in front of the block name. You can also add other blocks - for this you need to know the **internal** name of the block (which includes the `namespace`) and the name of the attribute/attributes that contain the **content** of the block (**what requires translation**). You can learn these names by looking at the source code of the plugin/themes where these blocks are defined or by contacting the developer.\n*Unfortunately, a simpler method has not yet been found.*', 'zu-translate'),
	blockTitle: __('Supported blocks', 'zu-translate'),
	moreTitle: __('Add more blocks', 'zu-translate'),
	ignoreCptTitle: __('Ignore Custom Post Types', 'zu-translate'),
	// compress: __('Compress language data to reduce page size', 'zu-translate'),

	toggles: ['sync', 'initial', 'session', 'unsaved', 'nobackups'],
	sync: {
		label: __('Synchronize language switching', 'zu-translate'),
		help: __('Switching a language in one block will lead to language switching in all editable blocks.', 'zu-translate'),
	},
	initial: {
		label: 	__('Open language panel', 'zu-translate'),
		help:	__('Whether or not the language switching panel will start open.', 'zu-translate'),
	},
	session: {
		label: __('Support session language', 'zu-translate'),
		help: __('During one session, language switching on different pages will be synchronized.', 'zu-translate'),
	},
	unsaved: {
		label: __('Switch without changes', 'zu-translate'),
		help: __('Do not consider language switching as **unsaved** changes for the current edit session.', 'zu-translate'),
	},
	nobackups: {
		label: 	__('Remove Block Editor "backups"', 'zu-translate'),
		help:	__('Removes Wordpress *autosaves* and *backups* notices which could be very annoying.\nYou should understand what you are doing.', 'zu-translate'),
	},
	ignore_cpt: {
		label: __('Custom post types that will be ignored', 'zu-translate'),
		input: __('Enter the custom post type', 'zu-translate'),
		inputHelp: __('Usually the custom post type is one word, like `product` for **WooCommerce** plugin', 'zu-translate'),
		ignoreAll: {
			label: 	__('Ignore all custom post types', 'zu-translate'),
			help:	__('Support for the **Block Editor** will be activated only on built-in types - `post` and `page`.', 'zu-translate'),
		},
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

const convert = {
	convertLabel: __('Convert Classic Blocks', 'zu-translate'),
	convertHelp: __('Convert all **Classic Blocks** to Gutenberg blocks. Regular text will be replaced with `core/paragraph`, headings with `core/heading` and shortcodes with `core/shortcode` blocks.', 'zu-translate'),
	convertAction: __('Convert', 'zu-translate'),
	convertTitle: __('Select options for conversion', 'zu-translate'),
	convertTypeLabel: __('Select a type for conversion', 'zu-translate'),
	convertOnlySelected: __('Convert only selected posts', 'zu-translate'),
	convertSelect: __('Select the %s for conversion', 'zu-translate'),

	splitLabel: __('Split Classic Blocks', 'zu-translate'),
	splitHelp: __('All **Classic Blocks** found will be split by languages and the contents of the block for each language will be converted to the `Gutenberg` blocks and will be saved in a separate document.', 'zu-translate'),
	splitAction: __('Split', 'zu-translate'),
	splitTitle: __('Select options for split', 'zu-translate'),
	splitTypeLabel: __('Select a type for split', 'zu-translate'),
	splitOnlySelected: __('Split only selected posts', 'zu-translate'),
	splitSelect: __('Select the %s for split', 'zu-translate'),

	primaryLabel: __('Select a primary language', 'zu-translate'),
	primaryHelp: __('The contents of the block for this language will be used as a **basis** for conversion.', 'zu-translate'),
};

const panels = {
	gutenberg: {
		value: true,
		label: 	__('Block Editor Support', 'zu-translate'),
		// this allows the panel to be excluded when the option is false
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
	convert,
	inacive: pluginInacive ? simpleMarkdown(inacive, { br: true, links: qtxUrl }) : false,
}
