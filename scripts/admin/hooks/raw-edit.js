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

import { isSupported, getTranslated, hasRaw, switchContent, createRawContent, updateRawContent } from './../utils.js';
import { changeLang, useOnLangChange, useLangHook } from './../data/use-store.js';
import { syncBlocks } from './../data/raw-helpers.js';
import LangControl from './../components/lang-control.js';

const activateDebug = false;

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
// Zubug.data({ atts, lang, ref: rawRef.current, translatedAtts });
	}, [translatedAtts, setAttributes]);

	const onChangeLang = useCallback(lang => {
		changeLang(lang);
		forceUpdate();
		syncBlocks(rawRef.current.id);
		if(activateDebug) Zubug.info(`{${rawRef.current.id}} Language switched to [${lang}]`);
	}, [forceUpdate]);

	const forceUpdate = useForceUpdater();
	const editorLang = useOnLangChange(replaceContent);
	// register 'forceUpdate' for subsequent language synchronization
	useLangHook(clientId, forceUpdate);

	// конвертировать content в рав если требуется при маунтинг
	useEffect(() => {
		// synchronize the first time 'qtxLang' attribute and 'editorLang'
		if(qtxLang !== editorLang) replaceContent(editorLang);

		if(!hasRaw(rawRef)) {
			const [ raw, update ] = createRawContent(qtxLang, translatedValues, translatedAtts);
			rawRef.current.raw = raw;
			setAttributes({ qtxLang, qtxRaw: raw, ...update });
			if(activateDebug) Zubug.data({ lang: qtxLang, raw, update, translatedValues, translatedAtts }, `Raw created {${rawRef.current.id}}`);
		} else {
			const { raw } = rawRef.current;
			const [ fixedRaw ] = createRawContent(qtxLang, translatedValues, translatedAtts, raw);
			if(activateDebug) Zubug.data({
				raw: rawRef.current.raw,
				fixedRaw: raw !== fixedRaw ? fixedRaw : null,
				translatedValues,
				translatedAtts
			}, raw !== fixedRaw ? `Raw fixed! {${rawRef.current.id}}` : `Raw existed! {${rawRef.current.id}}`);
			if(raw !== fixedRaw) rawRef.current.raw = fixedRaw;
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
				if(activateDebug) Zubug.data({ updatedRaw, translatedValues }, `Raw updated {${rawRef.current.id}}`);
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

		// Zubug.data({
		// 	clientId,
		// 	name,
		// 	parents: getBlockParents(clientId),
		// 	getBlock: getBlock(clientId),
		// 	RootClientId: getBlockHierarchyRootClientId(clientId),
		// 	allblock: getBlocks(),
		// 	ids: getBlockOrder(),
		// });

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
