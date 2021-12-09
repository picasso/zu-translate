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

// Internal dependencies

// = '[:en]In the "**Adaptive Columns**" mode, the gallery is trying to maintain a certain *width of the column* and in the event of a shortage of space, the number of columns will be reduced.[:ru]В режиме «** Adaptive Columns **» галерея пытается поддерживать определенную * ширину столбца * и в случае нехватки пространства, количество столбцов будет уменьшено.[:]',

import { qtranxj_split, qtranxj_get_split_blocks, qtranxj_split_blocks } from './qblocks.js';

externalData('zutranslate_settings');
// перед вызовами 'getExternalData' нужно один раз вызвать 'externalData'
const supportedData = getExternalData('supported', {});
export const pluginInacive = getExternalData('disabled', {});
export const qtxUrl = getExternalData('qtxlink', '');

const delimiters = ['[]', '{}', '<!-- -->'];
// const blockName = 'core/paragraph';
const supportedBlocks = _.keys(supportedData); // _.castArray(blockName);
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

export function updateRawContent(raw, lang, values = null) {
    if(values) {
        const del = testDelimters(raw);
        const separator = marker(del, null, null, true);
        const content = _.split(raw, separator);
        const rawItems = _.reduce(content, (newRaw, rawItem, index) => {
            const blocks = getTranslatedBlocks(rawItem);
            if(values[index]) {
                blocks[lang] = values[index];
                const withMarkers = _.map(blocks, (text, ln) => marker(del, ln, text));
                newRaw[index] = _.join([...withMarkers, marker(del)], '');
            }
            return newRaw;
        }, []);
        return _.join(rawItems, separator);
    }
    return raw;
}

export function switchContent(raw, lang, translatedAtts) {
    const atts = _.split(translatedAtts, ',');
    const rawItems = splitRawContent(raw);
    return _.reduce(atts, (attributes, attr, index) => {
        const content = getLangContent(rawItems[index], lang);
        _.set(attributes, attr, content);
        Zubug.data({ lang, raw: rawItems[index], content });
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
	return [str.substr(0, middle).trim(), str.substr(middle + 1).trim()];
}

function testDelimters(s) {
    let blockDel = splitInHalf(delimiters[0]);
    _.forEach(delimiters, d => {
        const del = splitInHalf(d);
        const regex = new RegExp(marker(del), 'gi');
        if(regex.exec(s) !== null) {
            blockDel = del;
            return false;
        }
    });
    return blockDel;
}

function marker(del, lang = null, text = null, split = false) {
	return `${del[0]}${split ? ',' : ':'}${lang ?? ''}${del[1]}${text ?? ''}`;
}
