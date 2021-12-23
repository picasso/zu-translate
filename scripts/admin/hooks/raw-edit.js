// WordPress dependencies

// const { pick, isNil, assign } = lodash;
// const { __ } = wp.i18n;
// const { addFilter } = wp.hooks;
const { createHigherOrderComponent } = wp.compose;
const { usePrevious } = wp.compose;
const { InspectorControls } = wp.blockEditor;
const { useEffect, useCallback, useRef } = wp.element; // cloneElement, useState, useEffect, useLayoutEffect
// const { select, subscribe } = wp.data; //

// Zukit dependencies

// const { SelectItemControl } = wp.zukit.components;
// const { useRefInit } = wp.zukit.data;

// Internal dependencies

import { isSupported, getTranslatedValues, hasRaw, switchContent, createRawContent, updateRawContent } from './../utils.js';
import LangControl from './../components/lang-control.js';

const BlockEditLang = (props) => {
	const {
		name,
		// clientId,
		setAttributes,
		attributes,
	} = props;
	const {
		qtxRaw,
		qtxLang = 'en',
	} = attributes;

	// Zubug.useMU();

	const prevLang = usePrevious(qtxLang);
	const rawRef = useRef(null);
	if(rawRef.current === null) {
		rawRef.current = { lang: qtxLang, raw: qtxRaw };
		// Zubug.data({ lang: qtxLang, raw: qtxRaw }, 'Raw loaded');
	}
	const [translatedAtts, translatedValues] = getTranslatedValues(name, attributes);

	// конвертировать content в рав если требуется при маунтинг
	useEffect(() => {
		if(!hasRaw(rawRef)) {
			const [ raw, update ] = createRawContent(qtxLang, translatedValues, translatedAtts);
			rawRef.current.raw = raw;
			setAttributes({ qtxLang, qtxRaw: raw, ...update });
			Zubug.data({ lang: qtxLang, raw, update }, 'Raw created');
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// After each change in one of the attributes that require the translation, we update 'qtxRaw'
	useEffect(() => {
		// Zubug.info('attributes changed', translatedValues, rawRef);
		if(hasRaw(rawRef)) {
			const { raw, lang } = rawRef.current;
			const updatedRaw = updateRawContent(raw, lang, translatedValues);
			if(updatedRaw !== rawRef.current.raw) {
				rawRef.current.raw = updatedRaw;
				setAttributes({ qtxRaw: updatedRaw });
				Zubug.data({ updatedRaw }, 'Raw updated');
			}
		}
	// we used a spread element in the dependency array -> we can't statically verify the correct dependencies
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [...translatedValues, setAttributes]);

	// Replace the values of all 'translated' attributes for the required language
	const replaceContent = useCallback(lang => {
		const { raw } = rawRef.current;
		// const lang = qtxLang === 'en' ? 'ru' : 'en';
		const atts = switchContent(raw, lang, translatedAtts);
		rawRef.current.lang = lang;
		setAttributes({ qtxLang: lang, ...atts });
		Zubug.info(`Language switched {${lang}}`);
	}, [translatedAtts, setAttributes]);

	useEffect(() => {
		if(qtxLang !== prevLang) replaceContent(qtxLang);
	}, [qtxLang, prevLang, replaceContent]);

	return (
		<InspectorControls>
			<LangControl.Panel
				lang={ qtxLang }
				onClick={ replaceContent }
			/>
		</InspectorControls>
	);
}

const withRawEditControls = createHigherOrderComponent(BlockEdit => {
	return (props) => {
		const {
			name,
			// isSelected,
		} = props;
		return (
			<>
				<BlockEdit { ...props }/>
				{ isSupported(name) && <BlockEditLang { ...props }/> }
			</>
		);
	};
}, 'withRawEditControls');
export default withRawEditControls;