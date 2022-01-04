// WordPress dependencies

const { forEach, castArray, includes, has, noop } = lodash;
const { select } = wp.data;

// Internal dependencies

import { getLangContent, getInputValue, changeInputValue, addInputListener } from './../utils.js';
import { getLang, getRaw, getHooks, setRaw, updateRaw, addHook } from './use-store.js';
import { supportedAtts, supportedKeys } from './raw-store.js';

const activateDebug = false;

// helpers for RAW attributes -------------------------------------------------]

// set the initial values for RAW attributes
// NB! set them only for the first time when values in 'store' are undefined
// all subsequent calls should be ignored - it's necessary as the document editing panel
// will be mounted and unmounted every time when switching to blocks editing
export function setRawAttributes(removeListeners = false) {
	const { getEditedPostAttribute } = select('core/editor');
	forEach(supportedAtts, (selector, attr) => {
		if(removeListeners) {
			// with the third argument equal to false listener will be removed
			addInputListener(selector, getListener(attr), false);
		} else {
			let value = getRaw(attr);
			if(value === undefined) {
				value = getEditedPostAttribute(`${attr}_raw`);
				if(attr === 'title' && value === 'Auto Draft') value = '';
				setRaw(attr, value);
				addInputListener(selector, getListener(attr));
			} else if(activateDebug) {
				Zubug.info(`set for {${attr}} is ignored, current value = ${value}`);
			}
		}
	});
}

// update RAW attributes before changing language
// (if 'onlyAtts' is not null - update RAW for these attributes only)
export function updateRawAttributes(onlyAtts = null) {
	onlyAtts = onlyAtts === null ? null : castArray(onlyAtts);
	forEach(supportedAtts, (selector, attr) => {
		if(onlyAtts === null || includes(onlyAtts, attr)) {
			const value = getInputValue(selector);
			updateRaw(attr, value);
		}
	});
}

// select content for the language from the RAW value and set it in the INPUT element
export function switchRawAttributes(lang) {
	const editorLang = lang ?? getLang();
	forEach(supportedAtts, (selector, attr) => {
		const rawValue = getRaw(attr);
		if(rawValue !== undefined) {
			const renderedValue = getLangContent(rawValue, editorLang);
			changeInputValue(selector, renderedValue, true);
		}
	});
}

// call all registered hooks besides associated with 'clientId'
// this will lead to switching language for blocks associated with these hooks
export function syncBlocks(clientId) {
	const hooks = getHooks();
	if(activateDebug) {
		Zubug.info(`Sync initiated from {${clientId}}`, { hookCount: Object.keys(hooks).length, hooks });
	}
	forEach(hooks, (hook, id) => {
		if(id !== clientId) {
			if(activateDebug) Zubug.info(`calling hook for {${id}}`);
			hook();
		}
	});
}

// because the document editing panel will be mounted and unmounted every time when switching to blocks editing
// we register the root hook only once and do not remove it on unmounting
export function registerRootUpdater() {
	const rootClientId = 'rawRoot';
	const hooks = getHooks();
	if(!has(hooks, rootClientId)) {
		addHook(rootClientId, switchRawAttributes);
	}
}

// we need to pre-create listeners for each attribute,
// since we cannot use arrow function directly when adding listener - later we won't be able to remove such listener
const listeners = {};

forEach(supportedKeys, attr => {
	listeners[attr] = () => updateRawAttributes(attr);
});

function getListener(attr) {
	return listeners[attr] ?? noop;
}
