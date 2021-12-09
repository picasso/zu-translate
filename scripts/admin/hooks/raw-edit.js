// WordPress dependencies

// const { pick, isNil, assign } = lodash;
const { __ } = wp.i18n;
// const { addFilter } = wp.hooks;
const { createHigherOrderComponent } = wp.compose;
const { PanelBody } = wp.components;
const { InspectorControls } = wp.blockEditor;
const { useEffect, useCallback, useRef } = wp.element; // cloneElement, useState, useEffect, useLayoutEffect
// const { select, subscribe } = wp.data; //

// Zukit dependencies

const { SelectItemControl } = wp.zukit.components;
// const { useRefInit } = wp.zukit.data;

// Internal dependencies

import { isSupported, getTranslatedValues, hasRaw, switchContent, updateRawContent } from './utils.js'; // hasTranslations,
import { assets, transformLangValue } from './assets.js';
// getTranslatedBlocks,

const rawPrefix = 'components-zu-raw-edit';

const withRawEditControls = createHigherOrderComponent(BlockEdit => {
	return (props) => {
		const {
			name,
			// clientId,
			isSelected,
			setAttributes,
			attributes,
		} = props;
		const {
			qtxRaw,
			qtxLang = 'en',
		} = attributes;

		// Zubug.useMU();

		const rawRef = useRef(null);
		if(rawRef.current === null) rawRef.current = { lang: qtxLang, raw: qtxRaw };

		const [translatedAtts, translatedValues] = getTranslatedValues(name, attributes);

		// конвертировать content в рав если требуется при маунтинг
		// useEffect(() => {
		// 	if(!hasRaw(rawRef) && hasTranslations(content)) {
		// 		const translated = getLangContent(content, rawRef.current.lang);
		// 		setAttributes({
		// 			qtxLang: rawRef.current.lang,
		// 			qtxRaw: content,
		// 			content: translated,
		// 		});
		// 		Zubug.data({ qtxLang: rawRef.current.lang, qtxRaw: content, content: translated }, 'created XT');
		// 	}
		// // we used a spread element in the dependency array -> we can't statically verify the correct dependencies
		// // eslint-disable-next-line react-hooks/exhaustive-deps
		// }, [...translatedValues, setAttributes]);

		// After each change in one of the attributes that require the translation, we update 'qtxRaw'
		useEffect(() => {
			Zubug.info('content updated', { rawRef });
			if(hasRaw(rawRef)) {
				const { raw, lang } = rawRef.current;
				const updatedRaw = updateRawContent(raw, lang, translatedValues);
				Zubug.info('Raw updated', { updatedRaw });
				rawRef.current.raw = updatedRaw;
				setAttributes({ qtxRaw: updatedRaw });
			}
		// we used a spread element in the dependency array -> we can't statically verify the correct dependencies
		// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [...translatedValues, setAttributes]);

		// Replace the values of all 'translated' attributes for the required language
		const replaceContent = useCallback(() => {
			const { raw } = rawRef.current;
			const lang = qtxLang === 'en' ? 'ru' : 'en';
			const atts = switchContent(raw, lang, translatedAtts);
			rawRef.current.lang = lang;
			setAttributes({ qtxLang: lang, ...atts });
		}, [qtxLang, translatedAtts, setAttributes]);

		return (
			<>
				<BlockEdit { ...props }/>
				{ isSelected && isSupported(name) &&
					<InspectorControls>
						<PanelBody title={ __('Language') }>
							<SelectItemControl
								className={ rawPrefix }
								withLabels
								options={ assets.langOptions }
								selectedItem={ qtxLang }
								onClick={ replaceContent }
								transformValue={ transformLangValue }
								// buttonStyle={ colorStyle }
							/>
						</PanelBody>
					</InspectorControls>
				}
			</>
		);
	};
}, 'withRawEditControls');

// <ToggleControl
// 	label={ qtxLang === 'ru' ? __('now Russian', 'zu') : __('now English', 'zu') }
// 	checked={ qtxLang === 'en' ? true : false }
// 	onChange={ replaceContent }
// />

// export default compose([
// 	withColors('quoteColor'),
// 	withNotices,
// ])(QuoteEdit);

export default withRawEditControls;
