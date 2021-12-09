// WordPress dependencies

// const { isFunction } = lodash;
// const { useCallback } = wp.element;

// Zukit dependencies

const { renderPage, toggleOption } = wp.zukit.render;
const { ZukitPanel, ZukitDivider } = wp.zukit.components;
// const { simpleMarkdown } = wp.zukit.utils;

// Internal dependencies

import { zutranslate } from './data.js';
// import { pluginInacive } from './hooks/utils.js';
import ZutranslateBESupport from './besupport.js';

const ZutranslateEdit = ({
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

	const { options: optionsData, gutenberg, inacive } = zutranslate; // switcher,

	// const onNotifyChange = useCallback(value => {
	// 	updateOptions({ notify: value })
	// }, [updateOptions]);

	if(inacive) {
		return (
			<div className="__note">
				{ inacive }
			</div>
		);
	}

	return (
		<>
			<ZukitPanel title={ title }>
				{ toggleOption(optionsData, options, updateOptions) }
				<ZukitDivider/>
			</ZukitPanel>
			<ZutranslateBESupport
				data={ gutenberg }
				options={ options }
				updateOptions={ updateOptions }
			/>
		</>
	);
};

// <ListInputControl
// 	strict="email"
// 	label={ notify.label }
// 	inputLabel={ notify.input }
// 	help={ notify.help }
// 	value={ options.notify }
// 	onChange={ onNotifyChange }
// />

renderPage('zutranslate', {
	edit: ZutranslateEdit,
	panels: zutranslate.panels,
});
