// WordPress dependencies

// const { isFunction } = lodash;
// const { useCallback } = wp.element;

// Zukit dependencies

const { renderPage, toggleOption } = wp.zukit.render;
const { ZukitPanel, ZukitDivider } = wp.zukit.components;

// Internal dependencies

import { zutranslate } from './settings/data.js';
import ZutranslateBlockEditor from './settings/block-editor.js';

const { options: optionsData, gutenberg, inacive } = zutranslate; // switcher,

const ZutranslateEdit = ({
		// id,
		// info,
		title,
		// panels,
		options,
		updateOptions,
		resetOptions,
		// setUpdateHook,
		ajaxAction,
		noticeOperations,
}) => {

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
			<ZutranslateBlockEditor
				data={ gutenberg }
				options={ options }
				updateOptions={ updateOptions }
				resetOptions={ resetOptions }
				noticeOperations={ noticeOperations }
				ajaxAction={ ajaxAction }
			/>
		</>
	);
};

renderPage('zutranslate', {
	edit: ZutranslateEdit,
	panels: zutranslate.panels,
});
