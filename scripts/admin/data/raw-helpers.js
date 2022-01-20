// WordPress dependencies

const { forEach, castArray, includes, noop } = lodash;
const { select } = wp.data;

// Internal dependencies

import { getExternalData, getDebug, getSessionLang, getInputValue, addInputListener } from './../utils.js';
// import { whenNodeInserted} from './../when-node.js';
import { getLangContent } from './../raw-utils.js';
import { supportedAtts, supportedKeys } from './raw-store.js';
import { getLang, getRaw, setRaw, updateRaw, addHook } from './use-store.js';
import { getEntityAttributes, updateEntityAttributes } from './edited-entity.js';
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
export function setRawAttributes(addListeners = true, langSetter = null) {
	const { getEditedPostAttribute } = select('core/editor');
	const initAttributes = getRaw('title') === undefined;
	forEach(supportedAtts, (selector, attr) => {
		if(addListeners) {
			let value = getRaw(attr);
			if(value === undefined) {
				value = getEditedPostAttribute(`${attr}_raw`);
				if(attr === 'title' && value === 'Auto Draft') value = '';
				setRaw(attr, value);
				addInputListener(selector, getListener(attr));
				// 'title' does not require 'inserted hook' as it is not removed from the page
				// when the attribute Panel is closed
				// if(attr !== 'title') attachInsertedHooks(attr, selector);
			} else {
				addInputListener(selector, getListener(attr));
				// if the language has been switched while editing blocks
				// then synchronize switching for newly created elements (for example, 'excerpt')
				// 'title' does not require synchronization as it is not removed from the page while editing blocks
				if(attr !== 'title') switchRawAttributes(null, attr);
				debug.info(`set for {${attr}} is ignored, current value = ${value}`);
			}
		} else {
			// with the third argument equal to false listener will be removed
			addInputListener(selector, getListener(attr), false);
		}
	});

	// do only once - when initializing the RAW store
	// sync language with 'sessionLang' and set element observers that require RAW replacement
	if(initAttributes) {
		if(sessionLang && langSetter) {
			const editorLang = getLang();
			if(sessionLang !== editorLang) {
				langSetter(sessionLang);
			}
		}

		replaceRawElements();
	}
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
// (if 'onlyAtts' is not null - select content for these attributes only)
export function switchRawAttributes(lang, onlyAtts = null) {
	const editorLang = lang ?? getLang();
	// const names = onlyAtts === null ? null : castArray(onlyAtts);
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

// listeners on changes and on DOM 'insert' -----------------------------------]

// we need to pre-create listeners for each attribute,
// since we cannot use arrow function directly when adding listener - later we won't be able to remove such listener
const listeners = {};

forEach(supportedKeys, attr => {
	listeners[attr] = () => updateRawAttributes(attr);
});

function getListener(attr) {
	return listeners[attr] ?? noop;
}

// const sidebarRoot = '.edit-post-sidebar > .components-panel';
//
// function attachInsertedHooks(attr, selector) {
// 	whenNodeInserted(sidebarRoot, selector, () => {
// 		debug.info(`-Node Inserted for {"${attr}"}`);
// 		// synchronize switching for newly created element
// 		switchRawAttributes(null, attr);
// 		// add the listener again (maybe the previous one was removed with the element or maybe not)
// 		// NOTE from Docs: if multiple identical EventListeners are registered on the same EventTarget
// 		// with the same parameters, the duplicate instances are discarded.
// 		addInputListener(selector, getListener(attr));
// 	});
// }
