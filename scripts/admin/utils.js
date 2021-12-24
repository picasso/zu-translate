// WordPress dependencies

const _ = lodash;

// Zukit dependencies

export const { externalData, getExternalData, mergeClasses, toJSON, simpleMarkdown } = wp.zukit.utils;

// Import debug object and make it available from global scope
window.Zubug = { ...(wp.zukit.debug  || {}) };

// Internal dependencies

import { qtranxj_split, qtranxj_get_split_blocks, qtranxj_split_blocks } from './qblocks.js';

const activateDebug = false;

// перед вызовами 'getExternalData' нужно один раз вызвать 'externalData'
externalData('zutranslate_blocks_data');

const supportedData = getExternalData('supported', {});
export const editorLang = getExternalData('lang', 'en');

const delimiters = ['[]', '{}', '<!-- -->'];
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


export function hasRaw(ref) {
	return !!ref?.current?.raw;
}

export function isSupported(name) {
	return _.includes(supportedBlocks, name);
}

export function hasTranslations(text) {
	const blocks = qtranxj_get_split_blocks(text ?? '');
	// no language separator found - there are no translations
	return blocks?.length > 1;

	// if (!blocks || !blocks.length)
	// 	return result;
	// if (blocks.length === 1) {
}

export function getLangContent(raw, lang) {
	const blocks = _.isArray(raw) ? qtranxj_split_blocks(raw) : getTranslatedBlocks(raw);
	return blocks[lang] ?? '';
}

export function createRawContent(lang, values, translatedAtts, maybeFixRaw = false) {
    if(values) {
        const separator = marker(testDelimters(), null, null, true);
        const rawItems = _.fill(_.range(0, values.length), '');
		// if RAW was created for wrong amount of attributes
		if(maybeFixRaw) {
			const items = _.split(maybeFixRaw, separator);
			if(values.length !== items.length) {
				maybeFixRaw = fixRawContent(lang, values, separator, maybeFixRaw);
			}
			return [ maybeFixRaw, {} ];
		}
        const prevRaw = _.reduce(values, (foundRaw, value) => {
            return foundRaw === false ? (hasTranslations(value) ? value : false) : foundRaw;
        }, false);
        if(activateDebug) Zubug.data({ lang, values, prevRaw });
        if(prevRaw) {
            const index = _.indexOf(values, prevRaw);
            const atts = _.split(translatedAtts ?? '', ',');
            _.set(rawItems, index, prevRaw);
            return [
                _.join(rawItems, separator),
                { [atts[index]] : getLangContent(prevRaw, lang) },
            ];
        }
        const raw = _.join(rawItems, separator);
        return [ updateRawContent(raw, lang, values), {} ];
    }
    return [ null, {} ];
}

export function updateRawContent(raw, lang, values = null) {
    if(activateDebug) Zubug.data({ raw, values });
    if(values) {
        const del = testDelimters(raw);
        const separator = marker(del, null, null, true);
        const content = _.split(raw, separator);

        const rawItems = _.reduce(content, (newRaw, rawItem, index) => {
            const blocks = getTranslatedBlocks(rawItem);
            if(values[index] !== undefined) {
                blocks[lang] = values[index];
                const withMarkers = _.map(blocks, (text, ln) => marker(del, ln, text));
                newRaw[index] = _.join([...withMarkers, marker(del)], '');
            }
            return newRaw;
        }, []);
        if(activateDebug) Zubug.data({ del, separator, content, rawItems });
        return _.join(rawItems, separator);
    }
    return raw;
}

export function switchContent(raw, lang, translatedAtts) {
    const atts = _.split(translatedAtts, ',');
    const rawItems = splitRawContent(raw);
    return _.reduce(atts, (attributes, attr, index) => {
        const value = getLangContent(rawItems[index], lang);
        _.set(attributes, attr, value);
        if(activateDebug) Zubug.data({ lang, raw: rawItems[index], attr, value });
        return attributes;
    }, {});
}

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

export function addInputListener(selector, callback) {
	const el = document.querySelector(selector);
	// React chose to make 'onChange' behave like 'onInput' does
	// it does fire when there's a change, just not until the input also loses focus
    if(el) el.addEventListener('input', callback);
}

// internal helpers -----------------------------------------------------------]

// if RAW was created for wrong amount of attributes
function fixRawContent(lang, values, separator, currentRaw) {
	let raw = emptyRawContent(values.length, separator);
	_.forEach(values, (val, index) => {
		if(val !== '' && val !== undefined) {
			if(_.includes(currentRaw, val)) {
				const rawItems = _.split(raw, separator);
				rawItems[index] = currentRaw;
				raw = _.join(rawItems, separator);
			} else {
				raw = updateRawContent(raw, lang, values);
			}
		}
	});
	return raw;
}

function emptyRawContent(items) {
	const del = testDelimters('');
	const separator = marker(del, null, null, true);
	const blocks = getTranslatedBlocks('');
	const withMarkers = _.map(blocks, (text, ln) => marker(del, ln, text));
	const emptyRaw = _.join([...withMarkers, marker(del)], '');
	const rawItems = _.fill(_.range(0, items), emptyRaw);
    return _.join(rawItems, separator);
}

function splitRawContent(raw) {
    const del = testDelimters(raw);
    const separator = marker(del, null, null, true);
    return _.split(raw, separator);
}

function getTranslatedBlocks(raw) {
	return qtranxj_split(raw ?? '');
}

function splitInHalf(s) {
	const str = String(s);
	const middle = Math.floor(str.length / 2);
	return [str.substr(0, middle).trim(), str.substr(middle).trim()];
}

function testDelimters(s) {
    let blockDel = splitInHalf(delimiters[0]);
    if(_.isString(s)) {
        _.forEach(delimiters, d => {
            const del = splitInHalf(d);
            const regex = new RegExp(marker(del), 'gi');
            if(regex.exec(s) !== null) {
                blockDel = del;
                return false;
            }
        });
    }
    return blockDel;
}

function marker(del, lang = null, text = null, split = false) {
	return `${del[0]}${split ? ',' : ':'}${lang ?? ''}${del[1]}${text ?? ''}`;
}
