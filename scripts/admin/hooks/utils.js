// WordPress dependencies

const _ = lodash;

// Zukit dependencies

export const {
    externalData,
    getExternalData,
    // mergeClasses,
    // isNum,
    // toBool,
	// toRange,
	// getKey,
	// isWrongId,
	// getIds,
	// svgRef,

    toJSON,
    // uniqueValue,
    // compareVersions,
    simpleMarkdown,

    // getColor,
    getColorOptions,
    // hexToRGBA,
    // brandAssets,
	// emptyGif,
    //
    // registerCollection,
    // registerCategory,
 } = wp.zukit.utils;

 // Import debug object and make it available from global scope
  window.Zubug = { ...(wp.zukit.debug  || {}) };

// Internal dependencies

// = '[:en]In the "**Adaptive Columns**" mode, the gallery is trying to maintain a certain *width of the column* and in the event of a shortage of space, the number of columns will be reduced.[:ru]В режиме «** Adaptive Columns **» галерея пытается поддерживать определенную * ширину столбца * и в случае нехватки пространства, количество столбцов будет уменьшено.[:]',

import { qtranxj_split, qtranxj_get_split_blocks, qtranxj_split_blocks } from './qblocks.js';

const activateDebug = false;

externalData('zutranslate_blocks_data');
// перед вызовами 'getExternalData' нужно один раз вызвать 'externalData'
const supportedData = getExternalData('supported', {});

const delimiters = ['[]', '{}', '<!-- -->'];
// const blockName = 'core/paragraph';
const supportedBlocks = _.keys(supportedData);
// const blockDel = splitInHalf(delimiters[0]);


export function getTranslatedAtts(name) {
	return _.castArray(_.get(supportedData, [name, 'atts']));
}

export function getTranslatedValues(name, attributes) {
	const translatedKeys = getTranslatedAtts(name);
	const translatedAtts = _.pick(attributes, translatedKeys);
	return [_.join(translatedKeys, ','), _.values(translatedAtts)];
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

export function createRawContent(lang, values, translatedAtts) {
    if(values) {
        const separator = marker(testDelimters(), null, null, true);
        const rawItems = _.fill(_.range(0, values.length), '');
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

    // setAttributes({
    //     qtxLang: rawRef.current.lang,
    //     content: getLangContent(rawRef.current.raw, rawRef.current.lang),
    // });
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
