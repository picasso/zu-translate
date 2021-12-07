// WordPress dependencies

const { isFunction } = lodash;
const { useCallback } = wp.element;

// Zukit dependencies

const { renderPage, toggleOption } = wp.zukit.render;
const { ListInputControl, ZukitPanel, ZukitDivider } = wp.zukit.components;

// Internal dependencies

import { zutranslate } from './data.js';
import ZutranslateMailer from './mailer.js';
import ZutranslateRecaptcha from './recaptcha.js';

const EditZutranslate = ({
		// id,
		// info,
		title,
		// panels,
		options,
		updateOptions,
		// setUpdateHook,
		// ajaxAction,
		// noticeOperations,
}) => {

	const { options: optionsData, notify, mailer, recaptcha, tests } = zutranslate;

	// init 'tests' if found
	if(isFunction(tests)) tests();

	const onNotifyChange = useCallback(value => {
		updateOptions({ notify: value })
	}, [updateOptions]);

	return (
		<>
			<ZukitPanel title={ title }>
				{ toggleOption(optionsData, options, updateOptions) }
				<ZukitDivider/>
				<ListInputControl
					strict="email"
					label={ notify.label }
					inputLabel={ notify.input }
					help={ notify.help }
					value={ options.notify }
					onChange={ onNotifyChange }
				/>
			</ZukitPanel>
			<ZutranslateRecaptcha
				data={ recaptcha }
				options={ options }
				updateOptions={ updateOptions }
			/>
			<ZutranslateMailer
				data={ mailer }
				options={ options }
				updateOptions={ updateOptions }
			/>
		</>

	);
};

renderPage('zutranslate', {
	edit: EditZutranslate,
	panels: zutranslate.panels,
});
