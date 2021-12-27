// WordPress dependencies

// const { isFunction } = lodash;
// const { useCallback } = wp.element;

// Zukit dependencies

const { renderPage, toggleOption } = wp.zukit.render;
const { ZukitPanel, ZukitDivider } = wp.zukit.components;
// const { simpleMarkdown } = wp.zukit.utils;

// Internal dependencies

import { zutranslate } from './settings/data.js';
// import { pluginInacive } from './hooks/utils.js';
import ZutranslateBlockEditor from './settings/block-editor.js';

const { options: optionsData, gutenberg, inacive } = zutranslate; // switcher,

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
			/>
		</>
	);
};

renderPage('zutranslate', {
	edit: ZutranslateEdit,
	panels: zutranslate.panels,
});
