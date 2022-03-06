// WordPress dependencies

// const { get } = lodash;

// Zukit dependencies

const { renderPage, toggleOption } = wp.zukit.render;
const { ZukitPanel } = wp.zukit.components;

// Internal dependencies

import { zutranslate } from './settings/data.js';
import ZutranslateBlockEditor from './settings/block-editor.js';
import ZutranslateAdvanced from './settings/advanced.js';
import ZutranslateConvert from './settings/convert.js';

const { options: optionsData, gutenberg, advanced, inacive, convert: convertData } = zutranslate; // switcher,

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
			</ZukitPanel>
			<ZutranslateBlockEditor
				data={ gutenberg }
				options={ options }
				updateOptions={ updateOptions }
				resetOptions={ resetOptions }
				noticeOperations={ noticeOperations }
				ajaxAction={ ajaxAction }
			/>
			<ZutranslateAdvanced
				data={ advanced }
				options={ options }
				updateOptions={ updateOptions }
				resetOptions={ resetOptions }
				noticeOperations={ noticeOperations }
			/>
			<ZutranslateConvert
				data={ convertData }
				ajaxAction={ ajaxAction }
			/>
		</>
	);
};

renderPage('zutranslate', {
	edit: ZutranslateEdit,
	panels: zutranslate.panels,
});
