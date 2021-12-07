// WordPress dependencies

// const { map, has } = lodash;
const { __ } = wp.i18n;

// Internal dependencies

// import { tests } from './tests.js';

const options = {
	use_recaptcha: {
		label: 	__('Use Google reCAPTCHA?', 'zu-contact'),
		help:	__('Loads Google recaptcha script if required.', 'zu-contact'),
	},
	// client_validate: {
	// 	label: 	__('Use client validation instead of server?', 'zu-contact'),
	// 	help:	__('Add scripts for validation on client (without AJAX).', 'zu-contact'),
	// },
	custom_css: {
		label: 	__('Use plugin CSS?', 'zu-contact'),
		help:	__('If switched off the plugin stylesheet won\'t be loaded.', 'zu-contact'),
	},
	me_or_us: {
		label: 	__('Use "Me" instead of "Us"?', 'zu-contact'),
		help:	__('If switched off - "Us" will be used in the form subheading.', 'zu-contact'),
	},
};

const notify = {
	label: 	__('Notify emails', 'zu-contact'),
	input: 	__('Enter an email to add to the list', 'zu-contact'),
	help:	__('List of emails to be notified when a form entry occurs.', 'zu-contact'),
};

const mailer = {
	server: __('Enter SMTP server name', 'zu-contact'),
	ssl: __('SSL Required', 'zu-contact'),
	ssl_help: __('When switched on - SSL encryption system will be used (TLS instead).', 'zu-contact'),
	port: __('Server port', 'zu-contact'),
	auth: __('Authentication Required', 'zu-contact'),
	auth_help: __('If authentication required you should provide Username and Password.', 'zu-contact'),
	username: __('Username (this is usually your email address)', 'zu-contact'),
	password: __('Password', 'zu-contact'),
	from: __('"From" email address (usually you should own the domain you are sending from)', 'zu-contact'),
	note: __('In order for the notifications to work, you need to have transactional emails configured in your copy of WordPress. This is usually done by your ISP, but if notifications are not sent, then I strongly recommend that you use one of the plugins that can be easily found on the Internet (for example, $links). As a last resort, you can configure access to the SMPT server manually using the fields below, but you must understand exactly what you are doing. To avoid possible conflicts with the plugin, I recommend to reset all SMPT server settings with "Reset Server Settings" button.', 'zu-contact'),
	or: __('or', 'zu-contact'),
	resetAll: __('Reset Settings', 'zu-contact'),
};

const recaptcha = {
	sitekey: __('Site key', 'zu-contact'),
	secret: __('Secret key', 'zu-contact'),
	note: __('For getting started, you need to register your site here: $links Choose the option "reCAPTCHA v2" which gives an "I’m not a robot" Checkbox. Once you entered all needed details you will get your Site key and Secret key.', 'zu-contact'),
	theme: __('The color theme of the widget', 'zu-contact'),
	size: __('The size of the widget', 'zu-contact'),
	themeOptions: [
		{ value: 'light', label: __('Light Theme', 'zu-contact') },
		{ value: 'dark', label: __('Dark Theme', 'zu-contact') },
	],
	sizeOptions: [
		{ value: 'compact', label: __('Compact Widget Size', 'zu-contact') },
		{ value: 'normal', label: __('Normal Widget Size', 'zu-contact') },
	],
	resetAll: mailer.resetAll,
};

const panels = {
	recaptcha_keys: {
		value: true,
		label: 	__('Google reCAPTCHA', 'zu-contact'),
		// Это позволит исключить эту панель когда значение option is false
		depends: 'use_recaptcha',
	},
	mailer: {
		value: false,
		label: 	__('Mail Server Settings', 'zu-contact'),
	},
};

export const zutranslate = {
	options,
	panels,
	notify,
	mailer,
	recaptcha,
	// 'undef' is used to silence eslint rule when 'tests' is defined
	// eslint-disable-next-line no-undef
	tests: (typeof tests !== 'undefined') ? tests : (typeof undef !== 'undefined') ? undef : null,
}
