// WordPress dependencies

// const $ = jQuery;
// const { split, map, padEnd, trimEnd } = lodash;

// const { __ } = wp.i18n;
// const { compose } = wp.compose;
// const { PanelRow, TextControl, Dropdown, Button } = wp.components;
const { useSelect } = wp.data;
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

const LangControlSetting = ({
	lang2,
	// meta,
	// setMetaValue,
}) => {

	const [title, lang] = useSelect(select => {
		const { getEditedPostAttribute } = select('core/editor'); // , getCurrentPost
		const title = getEditedPostAttribute('title_raw');
		const lang = getEditedPostAttribute('qtx_editor_lang');
		// const post = getCurrentPost();
		return [title, lang];
	}, []);

	const [ editLang, setEditLang ] = useState(lang);
	const [ rawTitle, setRawTitle ] = useState(title);

Zubug.data({ rawTitle, editLang, lang2 });
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
	}, [rawTitle, editLang]);

	return (
		<LangControl
			lang={ editLang }
			onClick={ setLanguage }
		/>
	);
}

export default withSidebar(metadata)(LangControlSetting);

// export default compose([
// 	withSidebar(metadata),
// ])(CopyrightEdit);
