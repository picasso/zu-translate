// WordPress dependencies

// const $ = jQuery;
const { reduce, has } = lodash;

// const { __ } = wp.i18n;
const { compose } = wp.compose;
// const { PanelRow, TextControl, Dropdown, Button } = wp.components;
const { useSelect, withSelect, withDispatch } = wp.data;
const { useState, useCallback } = wp.element;

// Zukit dependencies

// const { SelectItemControl } = wp.zukit.components;
// const { toRange, isNum } = wp.zukit.utils;

// Internal dependencies

import metadata from './metadata.js';
import withSidebar from './../components/with-sidebar.js';
import LangControl from './../components/lang-control.js';
import { updateRawContent, getLangContent, getPostTitle, changePostTitle } from './../utils.js';
// isSupported, getTranslatedValues, hasRaw, switchContent, createRawContent,
// const classPrefix = 'components-zu-copy-plugin';

// function getEditorTitle() {
// 	return document.querySelector('.editor-post-title__input')?.value ?? null;
// }
//
// function setEditorTitle(title) {
// 	const titleInputRef = document.querySelector('.editor-post-title__input');
// 	const valueSetter = Object.getOwnPropertyDescriptor(titleInputRef, 'value').set;
// 	const prototype = Object.getPrototypeOf(titleInputRef);
// 	const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set;
// 	if(valueSetter && valueSetter !== prototypeValueSetter) {
// 		prototypeValueSetter.call(titleInputRef, title);
// 	} else {
// 		valueSetter.call(titleInputRef, title);
// 	}
// 	titleInputRef.dispatchEvent(new Event('input', { bubbles: true })); // textarea 'input'
// }

// Copyright Edit Component

// innerBlocks

function collectAllRelatedBlocks(blocks) {
	return reduce(blocks, (collected, {clientId, innerBlocks, attributes}) => {
		// const { clientId, }
		if(has(attributes, 'qtxLang')) collected.push(clientId);
		if(innerBlocks.length) {
			const innerIds = collectAllRelatedBlocks(innerBlocks);
			collected.push(...innerIds);
		}
		return collected;
	}, []);
}

function switchAllRelatedBlocks(lang, getBlocks, updateBlockAttributes, clientId = null) {
	const allBlocks = getBlocks();
	const blockIds = collectAllRelatedBlocks(allBlocks);
	Zubug.data({ allBlocks, blockIds });

	// reduce(allBlocks, (acc, {clientId, attributes}) => {
	// 	// const { clientId, }
	// 	if(has(attributes, 'qtxLang')) acc.push(clientId);
	// 	return acc;
	// }, []);

	blockIds.forEach(blockClientId => {
		// do not update own attributes
		if(blockClientId !== clientId) {
			// Update Row Block layout
			updateBlockAttributes(blockClientId, { qtxLang: lang } );
		}
	});
}

const LangControlSetting = ({
	getBlocks,
	updateBlockAttributes,
}) => {

	Zubug.data({ allBlocks: getBlocks() });

	const [title, lang] = useSelect(select => {
		const { getEditedPostAttribute } = select('core/editor'); // , getCurrentPost
		const title = getEditedPostAttribute('title_raw');
		const lang = getEditedPostAttribute('qtx_editor_lang');
		// const post = getCurrentPost();
		return [title, lang];
	}, []);

	// const blocks = useSelect(select => {
	// 	const { getBlocks } = select('core/block-editor');
	// 	return getBlocks;
	// }, []);

	const [ editLang, setEditLang ] = useState(lang);
	const [ rawTitle, setRawTitle ] = useState(title);

// Zubug.data({ rawTitle, editLang, lang2 });
	// const [author = '?', year = 2001] = split(meta, ':')

	// переключаем язык, сохраняем последнее редактированное значение в raw
	// и меняем контент элемента на значение соответсвующее новому языку
	const setLanguage = useCallback(value => {
		setEditLang(value);
		const editedTitle = getPostTitle();
		const newRaw = updateRawContent(rawTitle, editLang, [editedTitle]);
		if(newRaw !== rawTitle) setRawTitle(newRaw);
		const newTitle = getLangContent(newRaw, value);
		if(editedTitle !== newTitle) changePostTitle(newTitle);

		Zubug.data({ newRaw, newTitle });
		// return lang;
		// setMetaValue(`${value}:${year}`)
		switchAllRelatedBlocks(value, getBlocks, updateBlockAttributes);
	}, [rawTitle, editLang, getBlocks, updateBlockAttributes]);

	return (
		<LangControl
			lang={ editLang }
			onClick={ setLanguage }
		/>
	);
}

// export default withSidebar(metadata)(LangControlSetting);

export default compose([
	withSidebar(metadata),
	withSelect(select => {
		return {
			getBlocks: select('core/block-editor').getBlocks,
		};
	}),
	withDispatch(dispatch => {
		const { updateBlockAttributes } = dispatch('core/block-editor');
		return { updateBlockAttributes };
	}),
])(LangControlSetting);
