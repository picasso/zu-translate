// WordPress dependencies

const { forEach, castArray } = lodash; // , noop, includes
// const { select } = wp.data;

// Internal dependencies

import { getExternalData, getSessionLang } from './../utils.js'; // , getInputValue getDebug, 
import { getLangContent } from './../raw-utils.js';
import { supportedKeys } from './raw-store.js'; // , supportedAtts
import { getLang, getRaw, setRaw, updateRaw, addHook } from './use-store.js';
import { initEditedAttribute, getEntityAttributes, updateEntityAttributes } from './edited-entity.js';
import { replaceRawElements } from './raw-replace.js';

const supportSession = getExternalData('session', false);
const sessionLang = supportSession ? getSessionLang() : null;
// const enableDebug = getExternalData('debug.raw_helpers', false);
// const debug = getDebug(enableDebug);

// helpers for RAW attributes -------------------------------------------------]

// set the initial values for RAW attributes
// NB! set them only for the first time when values in 'store' are undefined
// all subsequent calls should be ignored - it's necessary as the document editing panel
// will be mounted and unmounted every time when switching to blocks editing
// NB! for the first time (when values are undefined) also synchronize the displayed value with the current language
// since the current language may differ from the server language if the 'session' support is active
export function setRawAttributes(langSetter = null) {
	const initAttributes = getRaw('title') === undefined;
	forEach(supportedKeys, attr => {
		let value = getRaw(attr);
		if(value === undefined) {
			value = initEditedAttribute(attr, updateRaw);
			if(attr === 'title' && value === 'Auto Draft') value = '';
			setRaw(attr, value);
		}
	});
	// do only once - when initializing the RAW store
	if(initAttributes) {
		// sync language with 'sessionLang'
		if(sessionLang && langSetter) {
			const editorLang = getLang();
			if(sessionLang !== editorLang) {
				langSetter(sessionLang);
			}
		}
		// set element observers that require RAW replacement
		replaceRawElements();
	}
}

// select content for the language from the RAW value and set it in the INPUT element
// (if 'onlyAtts' is not null - select content for these attributes only)
export function switchRawAttributes(lang, onlyAtts = null) {
	const editorLang = lang ?? getLang();
	const attributes = getEntityAttributes(onlyAtts === null ? null : castArray(onlyAtts));
	const edits = {};
	forEach(attributes, (value, attr) => {
		const rawValue = getRaw(attr);
		if(rawValue !== undefined) {
			const shouldBeValue = getLangContent(rawValue, editorLang);
			if(value !== shouldBeValue) edits[attr] = shouldBeValue;
		}
	});
	updateEntityAttributes(edits);
}

// because the document editing panel will be mounted and unmounted every time when switching to blocks editing
// we register the root hook only once and do not remove it on unmounting
export function registerRootUpdater(rootId) {
	addHook(rootId, switchRawAttributes);
}
