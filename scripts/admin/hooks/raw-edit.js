// WordPress dependencies

const { includes } = lodash;
// const { __ } = wp.i18n;
// const { addFilter } = wp.hooks;
const { createHigherOrderComponent } = wp.compose;
// const { usePrevious } = wp.compose;
const { InspectorControls } = wp.blockEditor;
const { useEffect, useCallback, useRef, useMemo } = wp.element; // cloneElement, useState, useEffect, useLayoutEffect
const { select } = wp.data; // , subscribe

// Zukit dependencies

const { useForceUpdater } = wp.zukit.data;

// Internal dependencies

import { isSupported, getTranslated, hasRaw, switchContent, createRawContent, maybeFixRawContent, updateRawContent } from './../utils.js';
import { changeLang, useOnLangChange, useLangHook } from './../data/use-store.js';
import { syncBlocks } from './../data/raw-helpers.js';
import LangControl from './../components/lang-control.js';

const activateDebug = true;

const BlockEditLang = (props) => {
	const {
		name,
		clientId,
		setAttributes,
		attributes,
	} = props;
	const {
		qtxRaw,
		qtxLang,
	} = attributes;

	// store 'qtxLang' and 'qtxRaw' on the reference since their update occurs in 'useEffect'
	const rawRef = useRef(null);
	if(rawRef.current === null) {
		rawRef.current = { lang: qtxLang, raw: qtxRaw, id: clientId };
	}
	// create a list of attributes and an array of their values ('translatedAtts' is string - see 'utils.js')
	const [translatedAtts, translatedValues] = getTranslated(name, attributes);
	// callback for replacing the values of all 'translated' attributes for the required language
	const replaceContent = useCallback(lang => {
		const { raw } = rawRef.current;
		const atts = switchContent(raw, lang, translatedAtts);
		rawRef.current.lang = lang;
		setAttributes({ qtxLang: lang, ...atts });
	}, [translatedAtts, setAttributes]);

	const onChangeLang = useCallback(lang => {
		const { id, lang: prevLang } = rawRef.current;
		changeLang(lang);
		forceUpdate();
		syncBlocks(id);
		if(activateDebug) Zubug.info(`{${id}} Language switched to [${prevLang} -> ${lang}]`);
	}, [forceUpdate]);

	const forceUpdate = useForceUpdater();
	// in the hook is checked if the language has changed, then we call 'replaceContent'
	const editorLang = useOnLangChange(replaceContent);
	// register 'forceUpdate' for subsequent language synchronization
	useLangHook(clientId, forceUpdate);

	// synchronize, create RAW if does not exist and maybe fix it - on mounting only
	useEffect(() => {
		// if we already have RAW - synchronize the first time 'qtxLang' attribute and 'editorLang'
		if(qtxLang !== editorLang && hasRaw(rawRef)) replaceContent(editorLang);
		// if RAW does not exist - create it
		if(!hasRaw(rawRef)) {
			const [ raw, update ] = createRawContent(editorLang, translatedValues, translatedAtts);
			rawRef.current.raw = raw;
			rawRef.current.lang = editorLang;
			setAttributes({ qtxLang: editorLang, qtxRaw: raw, ...update });
			if(activateDebug) Zubug.data({
				lang: qtxLang,
				raw,
				update,
				translatedValues,
				translatedAtts
			}, `Raw created {${rawRef.current.id}}`);
		} else {
			// fix if RAW was created for wrong amount of attributes
			const { raw, id } = rawRef.current;
			const fixedRaw = maybeFixRawContent(raw, editorLang, translatedValues);
			if(activateDebug) Zubug.data({
				raw,
				fixedRaw: fixedRaw !== false ? fixedRaw : null,
				translatedValues,
				translatedAtts
			}, `Raw ${fixedRaw !== false ? 'fixed' : 'existed'}: {${id}}`);
			if(fixedRaw !== false) rawRef.current.raw = fixedRaw;
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// after each change in one of the attributes that require the translation, we update 'qtxRaw'
	useEffect(() => {
		if(hasRaw(rawRef)) {
			const { raw, lang } = rawRef.current;
			const updatedRaw = updateRawContent(raw, lang, translatedValues);
			if(updatedRaw !== rawRef.current.raw) {
				rawRef.current.raw = updatedRaw;
				setAttributes({ qtxRaw: updatedRaw });
				if(activateDebug) Zubug.data({ updatedRaw, translatedValues }, `Raw updated: {${rawRef.current.id}}`);
			}
		}
	// we used a spread element in the dependency array -> we can't statically verify the correct dependencies
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [...translatedValues, setAttributes]);

	return useMemo(() => (
		<InspectorControls>
			<LangControl.Panel
				lang={ editorLang }
				onClick={ onChangeLang }
			/>
		</InspectorControls>
	), [editorLang, onChangeLang]);
}

// HOC in which we add a language editing panel if the block fits our requirements
const withRawEditControl = createHigherOrderComponent(BlockEdit => {
	return (props) => {
		const {
			name,
			clientId,
		} = props;

		const { getBlockOrder } = select('core/block-editor');
		// 'getBlockOrder' returns all block client IDs in the editor, check if our block is in this list
		// sometimes the blocks of those types that we support are created, but these blocks are not edited in the editor -
		// for example, blocks for visual preview of the editable block
		const isEditableBlock = includes(getBlockOrder(), clientId);
		if(!isEditableBlock && activateDebug) Zubug.info(`Block [${name}] with id {${clientId}} was skipped`);

		return (
			<>
				<BlockEdit { ...props }/>
				{ isSupported(name) && isEditableBlock && <BlockEditLang { ...props }/> }
			</>
		);
	};
}, 'withRawEditControl');
export default withRawEditControl;
