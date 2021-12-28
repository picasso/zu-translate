// WordPress dependencies

// const { pick, isNil, assign } = lodash;
// const { __ } = wp.i18n;
// const { addFilter } = wp.hooks;
const { createHigherOrderComponent } = wp.compose;
// const { usePrevious } = wp.compose;
const { InspectorControls } = wp.blockEditor;
const { useEffect, useCallback, useRef, useMemo } = wp.element; // cloneElement, useState, useEffect, useLayoutEffect
// const { select, subscribe } = wp.data; //

// Zukit dependencies

const { useForceUpdater } = wp.zukit.data;

// Internal dependencies

import { isSupported, getTranslated, hasRaw, switchContent, createRawContent, updateRawContent } from './../utils.js';
import { changeLang, useOnLangChange } from './../data/use-store.js';
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

	const rawRef = useRef(null);
	if(rawRef.current === null) {
		rawRef.current = { lang: qtxLang, raw: qtxRaw };
	}

	const [translatedAtts, translatedValues] = getTranslated(name, attributes);

	// Replace the values of all 'translated' attributes for the required language
	const replaceContent = useCallback(lang => {
		const { raw } = rawRef.current;
		const atts = switchContent(raw, lang, translatedAtts);
		rawRef.current.lang = lang;
		setAttributes({ qtxLang: lang, ...atts });
		Zubug.data({ atts, lang, ref: rawRef.current, translatedAtts });
	}, [translatedAtts, setAttributes]);

	const onChangeLang = useCallback(lang => {
		changeLang(lang);
		forceUpdate();
		Zubug.info(`Language switched {${lang}}`);
	}, [forceUpdate]);

	const forceUpdate = useForceUpdater();
	const editorLang = useOnLangChange(replaceContent);


	// конвертировать content в рав если требуется при маунтинг
	useEffect(() => {
		// synchronize the first time 'qtxLang' attribute and 'editorLang'
		if(qtxLang !== editorLang) replaceContent(editorLang);
		
		if(!hasRaw(rawRef)) {
			const [ raw, update ] = createRawContent(qtxLang, translatedValues, translatedAtts);
			rawRef.current.raw = raw;
			setAttributes({ qtxLang, qtxRaw: raw, ...update });
			Zubug.data({ lang: qtxLang, raw, update, translatedValues, translatedAtts }, 'Raw created');
		} else {
			const { raw } = rawRef.current;
			const [ fixedRaw ] = createRawContent(qtxLang, translatedValues, translatedAtts, raw);
			Zubug.data({
				raw: rawRef.current.raw,
				fixedRaw: raw !== fixedRaw ? fixedRaw : null,
				translatedValues,
				translatedAtts
			}, raw !== fixedRaw ? 'Raw fixed!' : 'Raw existed!');
			if(raw !== fixedRaw) rawRef.current.raw = fixedRaw;
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// After each change in one of the attributes that require the translation, we update 'qtxRaw'
	useEffect(() => {
		// Zubug.info('attributes changed', translatedValues, rawRef);
		if(hasRaw(rawRef)) {
			const { raw, lang } = rawRef.current;
			const updatedRaw = updateRawContent(raw, lang, translatedValues);
			Zubug.data({ translatedValues, updatedRaw });
			if(updatedRaw !== rawRef.current.raw) {
				rawRef.current.raw = updatedRaw;
				setAttributes({ qtxRaw: updatedRaw });
				Zubug.data({ updatedRaw, translatedValues }, 'Raw updated');
			}
		}
	// we used a spread element in the dependency array -> we can't statically verify the correct dependencies
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [...translatedValues, setAttributes]);

	// const prevLang = usePrevious(qtxLang);
	// useEffect(() => {
	// 	if(qtxLang !== prevLang) replaceContent(qtxLang);
	// }, [qtxLang, prevLang, replaceContent]);

	return useMemo(() => (
		<InspectorControls>
			<LangControl.Panel
				lang={ editorLang }
				onClick={ onChangeLang }
			/>
		</InspectorControls>
	), [editorLang, onChangeLang]);
}

const withRawEditControl = createHigherOrderComponent(BlockEdit => {
	return (props) => {
		const {
			name,
			clientId,
		} = props;
		return (
			<>
				<BlockEdit { ...props }/>
				{ isSupported(name) && clientId && <BlockEditLang { ...props }/> }
			</>
		);
	};
}, 'withRawEditControl');
export default withRawEditControl;
