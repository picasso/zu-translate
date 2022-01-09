// WordPress dependencies

const _ = lodash;

// Internal dependencies

import { qtranxj_split, qtranxj_get_split_blocks, qtranxj_split_blocks } from './qblocks.js';

const activateDebug = false;
const delimiters = ['[]', '{}', '<!-- -->'];

export function hasRaw(ref) {
	return !!ref?.current?.raw;
}

export function hasTranslations(text) {
	const blocks = qtranxj_get_split_blocks(text ?? '');
	// no language separator found - there are no translations
	return blocks?.length > 1;
}

export function getLangContent(raw, lang) {
	const blocks = _.isArray(raw) ? qtranxj_split_blocks(raw) : getTranslatedBlocks(raw);
	return blocks[lang] ?? '';
}

export function createRawContent(lang, values, translatedAtts, maybeFixRaw = false) {
	const del = getDefaultDelimter();
    const separator = getSeparator();
    const rawItems = emptyRawContent(values.length, false);
// _.fill(_.range(0, values.length), '');
	// if RAW was created for wrong amount of attributes
	if(maybeFixRaw) {
		const items = _.split(maybeFixRaw, separator);
		if(values.length !== items.length) {
			maybeFixRaw = fixRawContent(lang, values, separator, maybeFixRaw);
		}
		return [ maybeFixRaw, {} ];
	}
	// check if any of the attributes already contains a RAW block
    const prevRaw = _.reduce(values, (foundRaw, value) => {
        return foundRaw === false ? (hasTranslations(value) ? value : false) : foundRaw;
    }, false);
    if(activateDebug) Zubug.data({ lang, values, prevRaw });

	// if we already had RAW in some attribute, we reformat the RAW with this in mind
	// NOTE: the option when more than one attribute contained RAW is not processed
	// this seems to be impossible - before this plugin the RAW was not split by attributes
	// return the new RAW and attribute content for the current language
    if(prevRaw) {
        const index = _.indexOf(values, prevRaw);
        const atts = _.split(translatedAtts ?? '', ',');
		const newItems = updateRawContent(rawItems, lang, values, { del: testDelimters(prevRaw), separator, join: false })
        _.set(newItems, index, prevRaw);
        return [
            _.join(newItems, separator),
            { [atts[index]] : getLangContent(prevRaw, lang) },
        ];
    }

	// for the newly created RAW, save the current attribute values in the current language section
// const raw = _.join(rawItems, separator);
    return [ updateRawContent(rawItems, lang, values, { del, separator }), {} ];
}

export function updateRawContent(raw, lang, values, options = null) {
    if(activateDebug) Zubug.data({ raw, lang, values });
	if(lang === undefined) return raw;
    const del = _.get(options, 'del') ?? testDelimters(raw);
    const separator = _.get(options, 'separator') ?? getSeparator(del);
	const joinItems =  _.get(options, 'join', true);
    const items = _.isArray(raw) ? raw : _.split(raw, separator);

    const rawItems = _.reduce(items, (newRaw, rawItem, index) => {
        const blocks = getTranslatedBlocks(rawItem);
        if(values[index] !== undefined) {
            blocks[lang] = values[index];
            const withMarkers = _.map(blocks, (text, ln) => marker(del, ln, text));
            newRaw[index] = _.join([...withMarkers, marker(del)], '');
        }
        return newRaw;
    }, []);
    if(activateDebug) Zubug.data({ del, separator, items, rawItems });
    return joinItems ? _.join(rawItems, separator) : rawItems;
}

// fix if RAW was created for wrong amount of attributes
export function maybeFixRawContent(prevRaw, lang, values) {
	const separator = getSeparator();
	const items = _.split(prevRaw, separator);
	if(values.length !== items.length) {
		const fixedRaw = fixRawContent(lang, values, separator, prevRaw);
		return prevRaw !== fixedRaw ? fixedRaw : false;
	}
	return false;
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

// internal helpers -----------------------------------------------------------]

function emptyRawContent(itemCount, joinItems = true) {
	const del = getDefaultDelimter();
	const separator = getSeparator(del);
	const blocks = getTranslatedBlocks('');
	const withMarkers = _.map(blocks, (text, ln) => marker(del, ln, text));
	const emptyRaw = _.join([...withMarkers, marker(del)], '');
	const rawItems = _.fill(_.range(0, itemCount), emptyRaw);
    return joinItems ? _.join(rawItems, separator) : rawItems;
}

function splitRawContent(raw) {
    const del = testDelimters(raw);
    const separator = getSeparator(del);
    return _.split(raw, separator);
}

function getTranslatedBlocks(raw) {
	return qtranxj_split(raw ?? '');
}

// if RAW was created for wrong amount of attributes
function fixRawContent(lang, values, separator, currentRaw) {
	let raw = emptyRawContent(values.length);
	_.forEach(values, (val, index) => {
		if(val !== '' && val !== undefined) {
			if(_.includes(currentRaw, val)) {
				const rawItems = _.split(raw, separator);
				rawItems[index] = currentRaw;
				raw = _.join(rawItems, separator);
			} else {
				raw = updateRawContent(raw, lang, values, { separator });
			}
		}
	});
	return raw;
}

// 'delimter' is what separates blocks of text in different languages
function getDefaultDelimter() {
	return testDelimters();
}

// 'separator' is what separates RAW blocks for different attributes
function getSeparator(del) {
	return marker(del ?? getDefaultDelimter(), null, null, true);
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
