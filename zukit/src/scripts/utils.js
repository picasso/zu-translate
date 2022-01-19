// External dependencies

import classnames from 'classnames';

// WordPress dependencies

const _ = lodash;
const { __ } = wp.i18n;
const { Path, G, SVG } = wp.components;
const { getCategories, setCategories, registerBlockCollection } = wp.blocks;

let extData = null;
// Gets JSON data from PHP
export function externalData(key, defaultValues = null) {
	const { data = {} } =  window[key] || {};
	extData = _.isEmpty(defaultValues) ? data : _.defaults(data, defaultValues);
	return extData;
}
// Allows multiple access to external data after calling 'externalData' function
export function getExternalData(key = null, defaultValue = null) {
	if(_.isEmpty(extData)) window.console.warn('ZUKIT: utils.externalData(<your_key>) should be called before any getExternalData() call!')
	if(key === null) return extData;
	return _.get(extData, key, defaultValue);
}

// Just a more familiar name
export const mergeClasses = classnames;

// Checks if value can be converted to Number
export function isNum(n) {
	return !_.isNaN(parseFloat(n)) && isFinite(n);
}

// convert argument to Boolean value
// works for true, false, 0, 1, "true", "false", "TRUE", "FALSE", "0", "1", undefined
export function toBool(val, stringOrNull = false) {
	let num;
	const value = val != null && (!_.isNaN(num = +val) ? !!num : !!String(val).toLowerCase().replace(!!0,''));
	return stringOrNull ? (value ? String(value) : null) : value;
}

export function toRange(num, min, max, useMinOnErr = true) {
	let value = _.isNaN(+num) ? (useMinOnErr ? min : max) : num;
	return  _.clamp(_.round(value), min, max);
}

// Create key for react components from 'value' or other params
export function getKey(value, more) {
	const source = _.isString(value) || isNum(value) ? String(value) : String(more);
	let hash = 0, i;
	for(i = 0; i < source.length; i++) {
		hash = ((hash << 5) - hash) + source.charCodeAt(i);
		hash |= 0; // Convert to 32bit integer
	}
	return String(hash);
}

export function isWrongId(id) {
	return _.isNil(id) || (isNum(id) && parseInt(id, 10) === 0);
}

// Creates an 'ids' array from an array (which should have property 'id').
// Ensures the ids array contains numbers
export function getIds(items, asString = false) {
	// always ensure the ids array contains numbers.
	// And remove all elements with "empty" value (undefined, null)
	if(!items || items.length === 0) return asString ? '' : [];
	const ids = _.compact(_.map(items, (value) => value && value.id && parseInt(value.id, 10)));
	return asString ? _.join(ids, ',') : ids;
}

export function checkDependency(item, options, isAction = false, withPath = null) {
	let depends = isAction ? item : _.get(item, 'depends');

	// special case when we need to avoid the element with the key 'hasMoreActions'
	if(_.get(item, 'hasMoreActions') === true) return false;
	if(_.isNil(depends)) return true;
	if(depends === false) return false;

	depends = _.castArray(depends);

	// the first element of the array determines what the logical operator will be (comparison by AND or OR)
	// if the first element is not equal to '&&' or '||', then the comparison will be by OR
	const logicalOp = depends[0] === '&&' || depends[0] === '||';
	const logicalAND = depends[0] === '&&';

	return _.reduce(logicalOp ? _.drop(depends, 1) : depends, (acc, dependencyKey) => {
		const cleanKey = _.trimStart(dependencyKey, '!');
		let value = _.get(options, withPath ? `${withPath}.${cleanKey}` : cleanKey, false);
		value = _.startsWith(depends, '!') ? !value : value;
		return acc === null ? value : (logicalAND ? acc && value : acc || value);
	}, null);
}

// Convert object to JSON
export function toJSON(obj) {
	if(obj) {

		try {
			obj = JSON.stringify(obj);
		} catch(err) {
			obj = '{}';
		}
	}
	return obj || '{}';
}

// Creates a new value using the template '<text>-<index>' while avoiding values from 'forbiddenValues'
export const uniqueValue = (value, forbiddenValues, fallback = 'name') => {
	const formatted =  String(value).replace(/([^-|\d])(\d+)$/, '$1-$2');
	if(_.includes(forbiddenValues, formatted)) {
		let index = 0;
		const valueBody = String(formatted).replace(/-\d+$/, '').replace(/\d+$/, '') || fallback;
		while(++index > 0) {
			const testValue = `${valueBody}-${index}`;
			if(!_.includes(forbiddenValues, testValue)) return testValue;
		}
	}
	return formatted;
}

// Add error value (if present) to the message, converting any object to a string
export function messageWithError(message, value = null) {

	const mdMessage = simpleMarkdown(message, { raw: true, br: true, json: true });
	if(_.isNil(value)) return mdMessage;

	value = _.isArray(value) || _.isPlainObject(value) ? toJSON(value) : String(value);
	value = value
		.replace(/([{|}])/g, ' $1 ')
		.replace(/,\s*/g, ',  ')
		.replace(/"([^"]+)":/g, '<b>$1</b>: ');

	const noColon = /[?|!.]\s*$/.test(message);
	return mdMessage.replace(/[:|.]\s*$/g, '') + `${noColon ? '' : ':'} <span class="zukit-data">${value}</span>`;
}

// Returns SVG with a reference to an already loaded SVG set
export function svgRef(id, icon = false, moreClasses = '', iconsSize = 24) {

	return (
		<svg
			className={ classnames('zu-svg', { icon }, `icon-${id}`, moreClasses) }
			role="img"
			aria-labelledby="title"
			viewBox={ `0 0 ${iconsSize} ${iconsSize}` }
			preserveAspectRatio="xMidYMin slice"
		>
			<use href={ `#${id}` }/>
		</svg>
	);
}

export function hexToRGB(hex, asObject = false) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	const rgb = result ? {
		r: parseInt(result[1], 16),
		g: parseInt(result[2], 16),
		b: parseInt(result[3], 16)
	} : null;
	return rgb ? (asObject ? rgb : `rgb(${rgb.r},${rgb.g},${rgb.b})`) : null;
}

export function hexToRGBA(hex, alpha, asObject = false) {
	const rgb = hexToRGB(hex, true);
	if(rgb === null) return null;
	const rgba = _.set({ ...rgb }, 'a', alpha);
	return asObject ? rgba : `rgba(${rgba.r},${rgba.g},${rgba.b},${rgba.a})`;
}

// Compare version numbers with segments
// Return values:
// 		a number < 0 if a < b
//		a number > 0 if a > b
//		0 if a = b
export function compareVersions(a, b) {
    let i, diff;
    const regExStrip0 = /(\.0+)+$/;
    const segmentsA = String(a).replace(regExStrip0, '').split('.');
    const segmentsB = String(b).replace(regExStrip0, '').split('.');
    const l = Math.min(segmentsA.length, segmentsB.length);

    for(i = 0; i < l; i++) {
        diff = parseInt(segmentsA[i], 10) - parseInt(segmentsB[i], 10);
        if(diff) return diff;
    }
    return segmentsA.length - segmentsB.length;
}

// Converts a string to a set of React components based on simple Markdown constructs
// replaces **text** with <strong>text</strong>
// replaces *text* with <em>text</em>
// NOTE: Attention! Doesn't work for two blocks not separated by anything:
// *text1**text2* - doesn't work!  *text1* *text2* - works!
// replaces `text` with <span>text</span>
// NOTE: Attention! Doesn't work for two blocks not separated by anything:
// `text1``text2` - doesn't work!  `text1` `text2` - works!
// replaces [text](link) with <a href="link">text</a>
// replaces newlines with <p> or <br/> if 'params.br' is true
// also replaces $link<index> constructs with elements from the 'params.links' array
export function simpleMarkdown(string, params) {

	if(!_.isString(string)) return string;

	const mod = _.defaults(params, {
		links: null,
		br: false,
		externalLink: true,
		raw: false,
		json: false,
		container: false,
	});

	let linkReplace = '<a href="$2" target="_blank" rel="external noreferrer noopener">$1</a>';
	if(mod.externalLink) linkReplace = linkReplace.replace('<a', '<a class="components-external-link"');

	// replace links
	let md = _.reduce(_.castArray(mod.links || []), (msg, link, index) => msg.replace(`$link${index + 1}`, link), string);
	// replace <strong>
	md = md.replace(/\*\*([^*]+)\*\*/gm, '<strong>$1</strong>');
	// replace <em>
	md = md.replace(/(^|[^*])\*([^*]+)\*/gm, '$1<em>$2</em>');
	// replace <span>
	md = md.replace(/(^|[^`])`([^`]+)`/gm, '$1<span class="__code">$2</span>');
	// replace <a>
	md = md.replace(/\[([^\]]+)\]\(([^)]+)\)/gm, linkReplace);

	// add <p></p> or <br/> if '\n' are found
	if(_.includes(md, '\n') || (mod.json && _.includes(md, '\\n'))) {
		const regex = mod.json ? /\\n/gm : /\n/gm;
		if(mod.br) md = md.replace(regex, '<br/>');
		else md = md.split(mod.json ? '\\n' : '\n').map(line => `<p>${line}</p>`).join('');
	}

	// return earlier if 'raw' output requested or no tags are found
	if(mod.raw) return md;
	if(md.match(/<[^<]+>/gm) === null) return string;

	const body = string2dom(md);
	const markdown = (<>{ _.map(body.childNodes, node2comp) }</>);

	return mod.container ? <span className="__markdown">{ markdown }</span> : markdown;
}

function string2dom(string) {
	const el = document.createElement('html');
	el.innerHTML = string;
	return _.find(el.childNodes, { nodeName: 'BODY' });
}

function styledIcon(icon) {
	const styled = {
		width: '1.4em',
		height: '1.4em',
		margin: '-0.2em 0.1em 0 0.2em',
		verticalAlign: 'middle',
		fill: 'currentColor',
	}
	const icons = {
		external: "M18.2 17c0 .7-.6 1.2-1.2 1.2H7c-.7 0-1.2-.6-1.2-1.2V7c0-.7.6-1.2 "+
		"1.2-1.2h3.2V4.2H7C5.5 4.2 4.2 5.5 4.2 7v10c0 1.5 1.2 2.8 2.8 2.8h10c1.5 0 2.8-1.2 "+
		"2.8-2.8v-3.6h-1.5V17zM14.9 3v1.5h3.7l-6.4 6.4 1.1 1.1 6.4-6.4v3.7h1.5V3h-6.3z",
	}
	return (
		<SVG
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			width="24"
			height="24"
			className="components-external-link__icon"
			role="img"
			aria-hidden="true"
			focusable="false"
			style={ styled }
		>
			<Path d={ _.get(icons, icon, '') }/>
		</SVG>
	);
}

function node2comp(node, index) {
	const tag = String(node.nodeName).toLowerCase();

	if(tag === 'strong') return <strong key={ index } className={ node.className || null }>{ node.textContent }</strong>;
	if(tag === 'em') return <em key={ index } className={ node.className || null }>{ node.textContent }</em>;
	if(tag === 'span') return <span key={ index } className={ node.className || null }>{ node.textContent }</span>;
	if(tag === 'br') return <br key={ index }></br>;
	if(tag === '#text') return node.textContent;
	if(tag === 'p') return  <p  key={ index } className={ node.className || null }>{ _.map(node.childNodes, node2comp) }</p>;
	if(tag === 'a') return (
		<a
			key={ index }
			className={ node.className || null }
			href={ node.href }
			rel={ node.rel }
			target={ node.target }
		>
			{ _.map(node.childNodes, node2comp) }
			{ _.includes(node.className, 'components-external-link') &&
				<>
					<span className="components-visually-hidden">(opens in a new tab)</span>
					{ styledIcon('external') }
				</>
			}
		</a>
	);
}

// Some useful data -----------------------------------------------------------]

export const emptyGif = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

const { colors: zukitRawColors = {}} = externalData('zukit_jsdata');
const defaultGetColor = '#cc1818';
const zukitInstanceColors = {};

// Returns one of predefined in SASS files colors
export function getColor(key, defaultColor = defaultGetColor) {
	return _.get(zukitRawColors, key, defaultColor);
}

// Creates custom color getter which returns either framework colors or plugin/theme colors
export function getColorGetter(dataKey) {
	const { colors: instanceColors } = externalData(dataKey);
	if(_.isEmpty(instanceColors)) return getColor;
	zukitInstanceColors[dataKey] = _.merge({}, zukitRawColors, instanceColors);
	return (key, defaultColor = defaultGetColor) => {
		return key === 'all' ? zukitInstanceColors[dataKey] : _.get(zukitInstanceColors, [dataKey, key], defaultColor);
	};
}

export function getColorOptions(colors, initialValue = [], mergeWithZukit = false) {
	const options = _.reduce(colors, (values, color, colorName)  => {
		values.push({
			slug: colorName,
			color: color,
			name: _.startCase(_.replace(colorName, '_', ' ')),
		});
		return values;
	}, initialValue);

	// if we need to merge with zukitColors, then remove all options with the same 'slug'
	// if 'mergeWithZukit' is array - use it as list of slugs to be excluded
	if(mergeWithZukit) {
		const slugs = _.concat(_.map(options, 'slug'), _.isArray(mergeWithZukit) ? mergeWithZukit :[]);
		const withoutSlugs = _.filter(zukitColors, val => !_.includes(slugs, val.slug));
		return _.concat(options, withoutSlugs);
	}
	return options;
}

// creates Zikit Color Options
const zukitColors = getColorOptions(zukitRawColors, [{ slug: 'none', color: 'white', name: 'None'}]);

// Brand assets ---------------------------------------------------------------]

export const brandAssets = {
	namespace: 'zu',
	slug: 'zu-blocks',
	color: getColor('violet'),
	icon: null,
	title: __('Zu Blocks', 'zukit'),
};

brandAssets.icon = (
<SVG
	width="24"
	height="24"
	viewBox="0 0 24 24"
	xmlns="http://www.w3.org/2000/svg"
>
	<G>
		<Path d={
			"M15.22,6.873 C15.22,6.873 14.383,8.096 13.914,12.049 C13.445,16.006 "+
			"17.266,15.5 17.266,15.5 Q19.264,15.312 19.264,13.224 C19.264,13.224 "+
			"19.172,6.516 19.264,6.873 C20.766,9.109 23.242,6.873 23.242,6.873 "+
			"L23.242,13.993 Q23.242,16.279 21.737,17.422 Q20.231,18.565 17.242,18.565 "+
			"Q14.42,18.27 12.914,17.127 C12.914,17.127 11.336,16.393 10.367,13.908 C9.107,10.676 11.242,6.873 11.242,6.873 z" }
			fill={ brandAssets.color }
		/>
		<Path d={
			"M7.448,14.858 C8.266,16.469 11.164,15.236 11.164,15.236 L17.242,18.565 "+
			"L0.758,18.565 L6.08,10.203 L1.47,10.203 C1.47,10.203 3.141,7.828 1.47,6.873 "+
			"C0.922,6.844 12.742,6.873 12.742,6.873 C12.742,6.873 6.256,12.508 7.448,14.858 z" }
			fill={ brandAssets.color }
		/>
	</G>
</SVG>
);

// Register ZU blocks category (or any other if 'categoryData' is presented)
export function registerCategory(categoryData = null) {
	const category = _.isEmpty(categoryData) ? {
		slug: brandAssets.slug,
		title: brandAssets.title,
		icon: brandAssets.icon,
	} : categoryData;

	setCategories([
		category,
		...getCategories().filter(({ slug }) => slug !== category.slug),
	]);
}

export function registerCollection(collectionData = null) {
	const collection = _.isEmpty(collectionData) ? {
		namespace: brandAssets.namespace,
		title: brandAssets.title,
		icon: brandAssets.icon,
	} : collectionData;

	if(typeof registerBlockCollection === 'function') {
		registerBlockCollection(collection.namespace, collection);
		return true;
	}
	return false;
}

// Subset of functions for 'zukit-blocks'
export const blocksSet = {
	registerCategory,
	registerCollection,
	externalData,
	getExternalData,
	mergeClasses,
	hexToRGB,
	hexToRGBA,
	isNum,
	isWrongId,
	toBool,
	toRange,
	getKey,
	getIds,
	getColor,
	getColorGetter,
	getColorOptions,
	toJSON,
	uniqueValue,
	svgRef,
	compareVersions,
	simpleMarkdown,
	emptyGif,
	brandAssets,
};
