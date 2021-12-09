// WordPress dependencies

const { map } = lodash;

// Internal dependencies

// import { getColorOptions, getExternalData } from './utils.js';

const { language_config: config } = window.qTranslateConfig ?? {};

// creates Quote Colors Object
// const quoteColors = getColorOptions({},
// 	[{ slug: 'opacity', color: 'transparent', name: 'Semi-Transparent'}],
// 	['none']
// );

export function transformLangValue(value) {
	return (
		<span className="__lang">{ value }</span>
	);
}

const assets = {
	langOptions: map(config, (data, key) => ({ value: key, label: data.name })),
	// [{ value: 'block', label: 'Block' }, { value: 'line', label: 'Line' }],
	// colors: quoteColors,
};

export default assets;
