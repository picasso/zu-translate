// WordPress dependencies

const { useCallback, useEffect } = wp.element;

// Zukit dependencies

const { withPlugin } = wp.zukit.plugins;
const { useForceUpdater } = wp.zukit.data;

// Internal dependencies

import metadata from './metadata.js';
import LangControl from './../components/lang-control.js';
import { changeLang, getLang, useOnLangChange } from './../data/use-store.js';
import { setRawAttributes, switchRawAttributes, registerRootUpdater, syncBlocks } from './../data/raw-helpers.js';

// LangControlSetting Component

const rootClientId = 'rawRoot';

const LangControlSetting = ({
	forceUpdate: forceUpdateParent,
}) => {

	const forceUpdate = useForceUpdater();
	const editorLang = useOnLangChange(switchRawAttributes);

	// combine two functions for updates to one
	// const forceUpdateAll = useCallback(() => {
	// 	forceUpdate();
	// 	forceUpdateParent();
	// // 'forceUpdate' and 'forceUpdateParent' never change
	// // eslint-disable-next-line react-hooks/exhaustive-deps
	// }, []);

	useEffect(() => {
		// set the initial RAW attributes on mounting the component
		setRawAttributes();
		// register 'rootUpdater' for subsequent language synchronization
		registerRootUpdater();
	}, []);

	// switch the language, call the update of the component and its parent -
	// since the update does not happen by itself because we do not store the language value in the component state
	// (changing the content of the element to the value corresponding to the new language will occur in 'useOnLangChange' hook)
	const setLanguage = useCallback(value => {
		changeLang(value);
		forceUpdate();
		forceUpdateParent();
		syncBlocks(rootClientId);
	// 'forceUpdate' and 'forceUpdateParent' never change
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

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
