// WordPress dependencies

const _ = lodash;

// Zukit dependencies

export const { externalData, getExternalData, mergeClasses, emptyGif, toJSON, simpleMarkdown } = wp.zukit.utils;

// Import debug object and make it available from global scope
window.Zubug = { ...(wp.zukit.debug  || {}) };

// Internal dependencies

// import { qtranxj_split, qtranxj_get_split_blocks, qtranxj_split_blocks } from './qblocks.js';


// перед вызовами 'getExternalData' нужно один раз вызвать 'externalData'
externalData('zutranslate_blocks_data');

const supportedData = getExternalData('supported', {});
// export const editorLang = getExternalData('lang', 'en');

// const delimiters = ['[]', '{}', '<!-- -->'];
const supportedBlocks = _.keys(supportedData);


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

// the edit language corresponds to the current LSB selection
// or the main admin language for single mode
const keyEditLanguage = 'qtranslate-xt-admin-edit-language';

export function getSessionLang() {
    return sessionStorage.getItem(keyEditLanguage);
}

export function storeSessionLang(lang) {
    try {
        sessionStorage.setItem(keyEditLanguage, lang);
    } catch(e) {
        console.warn(`Failed to store "${keyEditLanguage}"=${lang} with sessionStorage`, e);
    }
}
