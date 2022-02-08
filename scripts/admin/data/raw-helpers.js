// WordPress dependencies

const { isEmpty, forEach, castArray } = lodash;

// Internal dependencies

import { getExternalData, getDebug, getSessionLang } from './../utils.js';
import { getLangContent } from './../raw-utils.js';
import { supportedKeys } from './raw-store.js';
import { getLang, getRaw, setRaw, updateRaw, addHook } from './use-store.js';
import { initEditedAttribute, getEntityAttributes, updateEntityAttributes } from './edited-entity.js';
import { replaceRawElements } from './raw-replace.js';

const supportSession = getExternalData('session', false);
const sessionLang = supportSession ? getSessionLang() : null;
const enableDebug = getExternalData('debug.raw_helpers', false);
const debug = getDebug(enableDebug);

// helpers for RAW attributes -------------------------------------------------]

// set the initial values for RAW attributes
// NB! set them only for the first time when values in 'store' are undefined
// all subsequent calls should be ignored - it's necessary as the document editing panel
// will be mounted and unmounted every time when switching to blocks editing
// NB! for the first time (when values are undefined) also synchronize the displayed value with the current language
// since the current language may differ from the server language if the 'session' support is active
export function setRawAttributes(rootLangSetter = null) {
	const initAttributes = getRaw('title') === undefined;
	forEach(supportedKeys, attr => {
		let value = getRaw(attr);
		if(value === undefined) {
			value = initEditedAttribute(attr, updateRaw);
			debug.info(`-^{?init} RAW for [${attr}]`, value);
			if(attr === 'title' && value === 'Auto Draft') value = '';
			setRaw(attr, value);
		}
	});
	// do only once - when initializing the RAW store
	if(initAttributes) {
		let syncWasCalled = false;
		const editorLang = getLang();
		// sync language with 'sessionLang'
		if(sessionLang && rootLangSetter) {
			debug.info(`-^{#lang check} session/editor [${sessionLang}/${editorLang}]`);
			if(sessionLang !== editorLang) {
				rootLangSetter(sessionLang);
				syncWasCalled = true;
			}
		}
		// if not yet called 'rootLangSetter' - call with 'withoutOriginator' is true
		// this will lead to the regular blocks saved with another language
		// will be synchronized with the current language of the editor
		if(!syncWasCalled) rootLangSetter(editorLang, true);

		// set element observers that require RAW replacement
		replaceRawElements();
	}
}

// select content for the language from the RAW value and update 'Entity'
// (if 'onlyAtts' is not null - select content for these attributes only)
export function switchRawAttributes(lang, onlyAtts = null) {
	const editorLang = lang ?? getLang();
	const attributes = getEntityAttributes(onlyAtts === null ? null : castArray(onlyAtts));
	const edits = {};
	forEach(attributes, (value, attr) => {
		const rawValue = getRaw(attr);
		if(rawValue !== undefined) {
			const shouldBeValue = getLangContent(rawValue, editorLang);
			if(value !== shouldBeValue) {
				edits[attr] = shouldBeValue;
				debug.info(`-^{switch} RAW [${attr}] for lang {${editorLang}}`, shouldBeValue);
			}
		}
	});
	updateEntityAttributes(edits);
}

// copy content for the language from the RAW value and update 'Entity'
// (if 'overwrite' is true - then overwrite the current value, otherwise replace only empty values)
export function copyRawAttributes(lang, overwrite = false) {
	const attributes = getEntityAttributes(null);
	const edits = {};
	forEach(attributes, (value, attr) => {
		const rawValue = getRaw(attr);
		if(rawValue !== undefined) {
			if(isEmpty(value) || overwrite) {
				const copyValue = getLangContent(rawValue, lang);
				edits[attr] = copyValue;
				updateRaw(attr, copyValue);
				debug.info(`-^{copy} RAW [${attr}] from lang {${lang}}`, copyValue);
			}
		}
	});
	updateEntityAttributes(edits);
	return !isEmpty(edits);
}


// because the document editing panel will be mounted and unmounted every time when switching to blocks editing
// we register the root hook only once and do not remove it on unmounting ('addHook' has check)
export function registerRootUpdater(rootId) {
	addHook(rootId, switchRawAttributes);
}
