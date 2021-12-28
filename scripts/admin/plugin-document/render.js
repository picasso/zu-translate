// WordPress dependencies

// const { reduce, has } = lodash;
// const { compose } = wp.compose;
// const { withSelect, withDispatch } = wp.data;
const { useCallback, useEffect } = wp.element;

// Zukit dependencies

const { withPlugin } = wp.zukit.plugins;
const { useForceUpdater } = wp.zukit.data;

// Internal dependencies

import metadata from './metadata.js';
import LangControl from './../components/lang-control.js';
import { changeLang, getLang, setRawAttributes, switchRawAttributes, useOnLangChange } from './../data/use-store.js';

// LangControlSetting Component

const LangControlSetting = ({
	forceUpdate: forceUpdateParent,
	// getBlocks,
	// updateBlockAttributes,
}) => {

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
		forceUpdateParent();
		// switchAllRelatedBlocks(value, getBlocks, updateBlockAttributes);
	}, [forceUpdate, forceUpdateParent]);

	return (
		<LangControl
			lang={ editorLang }
			onClick={ setLanguage }
		/>
	);
}

const pluginProps = {
	...metadata,
	title: LangControl.Indicator,
	titleProps: () => ({ lang: getLang() }),
}

export default withPlugin(pluginProps)(LangControlSetting);

// NOTE: All experiments left here --------------------------------------------]

// function collectAllRelatedBlocks(blocks) {
// 	return reduce(blocks, (collected, {clientId, innerBlocks, attributes}) => {
// 		if(has(attributes, 'qtxLang')) collected.push(clientId);
// 		if(innerBlocks.length) {
// 			const innerIds = collectAllRelatedBlocks(innerBlocks);
// 			collected.push(...innerIds);
// 		}
// 		return collected;
// 	}, []);
// }
//
// function switchAllRelatedBlocks(lang, getBlocks, updateBlockAttributes, clientId = null) {
// 	const allBlocks = getBlocks();
// 	const blockIds = collectAllRelatedBlocks(allBlocks);
// 	Zubug.data({ allBlocks, blockIds });
//
// 	blockIds.forEach(blockClientId => {
// 		// do not update own attributes
// 		if(blockClientId !== clientId) {
// 			updateBlockAttributes(blockClientId, { qtxLang: lang } );
// 		}
// 	});
// }

// export default compose([
// 	withPluginNoMeta(metadata),
// 	withSelect(select => {
// 		return { getBlocks: select('core/block-editor').getBlocks };
// 	}),
// 	withDispatch(dispatch => {
// 		// const { updateBlockAttributes } = dispatch('core/block-editor');
// 		return { updateBlockAttributes: dispatch('core/block-editor').updateBlockAttributes };
// 	}),
// ])(LangControlSetting);
