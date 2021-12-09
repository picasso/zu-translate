// WordPress dependencies

const { isNil, assign } = lodash;
// const { __ } = wp.i18n;
const { addFilter } = wp.hooks;
// const { useEffect, useCallback } = wp.element; // cloneElement, useState, useEffect, useLayoutEffect
const { select, subscribe } = wp.data; //

// Internal dependencies

import { isSupportedBlock } from './utils.js';
import withRawEditControls from './raw-edit.js';

function addRawAttribute(settings, name) {
	if(!isNil(settings.attributes)) {
		if(isSupportedBlock(name)) {
			// Zubug.data({ settings });
			settings.attributes = assign({}, settings.attributes, {
				qtxRaw: {
					type: 'string',
				},
				qtxLang: {
					type: 'string',
				},
			});
		}
	}
	return settings;
}

addFilter('blocks.registerBlockType', 'zu/paragraph', addRawAttribute);
addFilter('editor.BlockEdit', 'zu/paragraph', withRawEditControls);

// NOTE: All experiments left here --------------------------------------------]

const { isSavingPost } = select('core/editor');
let postSaved = true;

subscribe(() => {
    if(isSavingPost()) {
		postSaved = false;
		Zubug.info('{isSavingPost}');
    } else {
		if(!postSaved) {
            Zubug.info('~Post Saved~');
            postSaved = true;
        }
    }
});

// function applyExtraProps(extraProps, blockType, attributes) {
// 	const {
// 		content,
// 		rawContent,
// 		lang,
// 	} = attributes;
// 	if(isSupportedBlock(blockType?.name)) {
// 		Zubug.data({ extraProps, blockType, attributes });
// 	}
//
// 	const blocks = qtranxj_split(rawContent);
// 	blocks[lang] = content;
// 	const newLang = lang === 'en' ? 'ru' : 'en';
// 	Zubug.data({ lang, content,  blocks });
// 	extraProps.className join([...map(blocks, (text, l) => `[:${l}]${text}`), '[:]'], '')
//
// 	if(typeof hideOnMobile !== 'undefined' && hideOnMobile) {
// 		extraProps.className = extraProps.className + ' hide-on-mobile';
// 	}
// 	return extraProps;
// }
// addFilter('blocks.getSaveContent.extraProps', 'zu/paragraph', applyExtraProps);

// function getBlockAttributes(attributes, blockType, param3, param4) {
// 	if(isSupportedBlock(blockType?.name)) {
// 		const { content, rawContent, lang } = attributes;
// 		const translated = rawContent ? getLangContent(rawContent, lang) : content;
// 		attributes.content = translated;
// 		Zubug.data({ attributes, blockType, param3, param4 });
// 		return attributes;
// 	}
// 	return attributes;
// }
// addFilter('blocks.getBlockAttributes', 'zu/paragraph', getBlockAttributes);

// function getSaveElement(elem, blockType, attributes) {
// 	const blockName = blockType?.name;
// 	if(isSupportedBlock(blockName)) {
// 		// Zubug.info('called');
// 		if(attributes.isXT) {
// 			// const fallback = () => elem;
// 			const { rawContent } = attributes;
// 			const isEdit = !!rawContent;
// 			// // const save = get(blockSave, blockName) ?? fallback;
// 			Zubug.info(isSavingPost() ? '{isSavingPost}' : 'update?');
// 			if(isEdit) {
// 				attributes.content = rawContent;
// 				// attributes.rawContent = undefined;
// 				const newEl = cloneElement(elem, { attributes });
// 				Zubug.data({ content: attributes.content, rawContent: attributes.rawContent }, 'new Element');
// 				return newEl;
// 			}
// 		}
// 	}
// 	return elem;
// }
// addFilter('blocks.getSaveElement', 'zu/paragraph', getSaveElement);
