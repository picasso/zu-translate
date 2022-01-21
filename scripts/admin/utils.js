// WordPress dependencies

const _ = lodash;
const { select } = wp.data;

// Zukit dependencies

export const { externalData, getExternalData, mergeClasses, emptyGif, toJSON, simpleMarkdown } = wp.zukit.utils;

// Import debug object and make it available from global scope
window.Zubug = { ...(wp.zukit.debug  || {}) };

// Internal dependencies

// import { qtranxj_split, qtranxj_get_split_blocks, qtranxj_split_blocks } from './qblocks.js';

// перед вызовами 'getExternalData' нужно один раз вызвать 'externalData'
externalData('zutranslate_blocks_data');

const supportedData = getExternalData('supported', {});
// const delimiters = ['[]', '{}', '<!-- -->'];
const supportedBlocks = _.keys(supportedData);

export const getDebug = (enable) => enable ? Zubug : _.transform(_.keys(Zubug), (acc, key) => acc[key] = _.noop, {});

export function getTranslatedAtts(name) {
	return _.castArray(_.get(supportedData, [name, 'atts']));
}

export function getTranslated(name, attributes) {
	const translatedKeys = getTranslatedAtts(name);
	const translatedAtts = _.reduce(translatedKeys, (values, attr) => {
		values.push(_.get(attributes, attr, ''));
        return values;
    }, []);
	// _.pick(attributes, translatedKeys);
	return [_.join(translatedKeys, ','), translatedAtts];
}

export function isSupported(name) {
	return _.includes(supportedBlocks, name);
}

// selector which returns an array containing all block client IDs in the editor.
// Optionally accepts a root client ID of the block list for which
// the order should be returned, defaulting to the top-level block order.
const { getBlockOrder } = select('core/block-editor');
// recursively collect all IDs of 'editable blocks' on the page.
export function getEditorBlocks(ids = null) {
	if(_.isNil(ids)) ids = getBlockOrder();
	return _.reduce(ids, (blocks, id) => {
		const innerIds = getBlockOrder(id);
		const nestedIds = innerIds.length ? getEditorBlocks(innerIds) : innerIds;
		return [...blocks, ...nestedIds];
	}, ids);
}


// const { getEditedEntityRecord, getEntityRecordEdits } = select('core');
// editEntityRecord
// deleteEntityRecord
// const { hasChangedContent, hasNonPostEntityChanges } = select('core/editor');
// isEditedPostEmpty
// isEditedPostDirty
// isAutosavingPost
// isCleanNewPost
// isEditedPostAutosaveable
// Actions

// DOM manipulations ----------------------------------------------------------]

export function getInputValue(selector) {
	return document.querySelector(selector)?.value ?? null;
}

export function changeInputValue(selector, value, textarea = false) {
    const el = document.querySelector(selector);
    if(el) {
        const prototype = textarea ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set;
        nativeInputValueSetter.call(el, value);
        const ev = new Event('input', { bubbles: true});
        el.dispatchEvent(ev);
    }
}

export function addInputListener(selector, callback, addListener = true) {
	const el = document.querySelector(selector);
	// React chose to make 'onChange' behave like 'onInput' does
	// it does fire when there's a change, just not until the input also loses focus
	// that's why we are adding a listener to the 'input' event and not to the 'change' event
    if(el) {
		if(addListener) el.addEventListener('input', callback);
		else el.removeEventListener('input', callback);
	}
}

// Language Session Storage ---------------------------------------------------]

// Function which returns true if the current environment supports browser
// sessionStorage, or false otherwise.
const hasSessionStorageSupport = _.once(() => {
	try {
		// Private Browsing in Safari 10 and earlier will throw an error when
		// attempting to set into sessionStorage. The test here is intentional in
		// causing a thrown error as condition bailing from local autosave.
		window.sessionStorage.setItem('__zuTranslateTestSessionStorage', '');
		window.sessionStorage.removeItem('__zuTranslateTestSessionStorage');
		return true;
	} catch(error) {
		return false;
	}
});

// the edit language corresponds to the current LSB selection
// or the main admin language for single mode
const keyEditLanguage = 'qtranslate-xt-admin-edit-language';

export function getSessionLang() {
    return hasSessionStorageSupport() ? sessionStorage.getItem(keyEditLanguage) : null;
}

export function storeSessionLang(lang) {
	if(hasSessionStorageSupport()) {
		try {
			sessionStorage.setItem(keyEditLanguage, lang);
		} catch(e) {
			console.warn(`Failed to store "${keyEditLanguage}"=${lang} with sessionStorage`, e);
		}
	}
}
