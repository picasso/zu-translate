// WordPress dependencies

const { reduce, has } = lodash;
const { compose } = wp.compose;
const { withSelect, withDispatch } = wp.data;
const { useCallback, useEffect } = wp.element;

// Zukit dependencies

// const { SelectItemControl } = wp.zukit.components;
// const { toRange, isNum } = wp.zukit.utils;

// Internal dependencies

import metadata from './metadata.js';
import withSidebar from './../components/with-sidebar.js';
import LangControl from './../components/lang-control.js';
import { changeLang, setRawAttributes, switchRawAttributes, useForceUpdater, useOnLangChange } from './../data/use-store.js';

// LangControlSetting Edit Component

// innerBlocks

function collectAllRelatedBlocks(blocks) {
	return reduce(blocks, (collected, {clientId, innerBlocks, attributes}) => {
		if(has(attributes, 'qtxLang')) collected.push(clientId);
		if(innerBlocks.length) {
			const innerIds = collectAllRelatedBlocks(innerBlocks);
			collected.push(...innerIds);
		}
		return collected;
	}, []);
}

export function switchAllRelatedBlocks(lang, getBlocks, updateBlockAttributes, clientId = null) {
	const allBlocks = getBlocks();
	const blockIds = collectAllRelatedBlocks(allBlocks);
	Zubug.data({ allBlocks, blockIds });

	blockIds.forEach(blockClientId => {
		// do not update own attributes
		if(blockClientId !== clientId) {
			updateBlockAttributes(blockClientId, { qtxLang: lang } );
		}
	});
}

const LangControlSetting = (
// {
// 	getBlocks,
// 	updateBlockAttributes,
// }
) => {

	const forceUpdate = useForceUpdater();
	const editorLang = useOnLangChange(switchRawAttributes); //'() => {}); // switchRawAttributes

	// set the initial RAW attributes on mounting the component
	useEffect(() => {
		setRawAttributes();
	}, []);

	// переключаем язык, сохраняем последнее редактированное значение в raw
	// и меняем контент элемента на значение соответсвующее новому языку
	const setLanguage = useCallback(value => {
		// updateRawAttributes();
		changeLang(value);
		forceUpdate();
		// switchAllRelatedBlocks(value, getBlocks, updateBlockAttributes);
	}, [forceUpdate]);

	return (
		<LangControl
			lang={ editorLang }
			onClick={ setLanguage }
		/>
	);
}

export default compose([
	withSidebar(metadata),
	withSelect(select => {
		return { getBlocks: select('core/block-editor').getBlocks };
	}),
	withDispatch(dispatch => {
		// const { updateBlockAttributes } = dispatch('core/block-editor');
		return { updateBlockAttributes: dispatch('core/block-editor').updateBlockAttributes };
	}),
])(LangControlSetting);
