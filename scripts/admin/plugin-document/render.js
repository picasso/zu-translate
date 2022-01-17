// WordPress dependencies

const { useCallback, useEffect } = wp.element;
const { Button } = wp.components;

// Zukit dependencies

const { withPlugin } = wp.zukit.plugins;
const { useForceUpdater } = wp.zukit.data;

// Internal dependencies

import metadata from './metadata.js';
import LangControl from './../components/lang-control.js';
import { changeLang, getLang, useOnLangChange, syncBlocks, storeTest } from './../data/use-store.js';
import { setRawAttributes, switchRawAttributes, registerRootUpdater } from './../data/raw-helpers.js';

// LangControlSetting Component

const rootClientId = 'rawRoot';

const LangControlSetting = ({
	forceUpdate: forceUpdateParent,
}) => {

	const forceUpdate = useForceUpdater();
	// in the hook is checked if the language has changed, then we call 'switchRawAttributes'
	const editorLang = useOnLangChange(switchRawAttributes);

	useEffect(() => {
		// set the initial RAW attributes on mounting the component and add listeners
		setRawAttributes();
		// register 'rootUpdater' for subsequent language synchronization
		registerRootUpdater();
		return () => {
			// with argument equal to false all listeners will be removed
			setRawAttributes(false);
		}
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
		<>
		<LangControl
			lang={ editorLang }
			onClick={ setLanguage }
		/>
		<Button isSecondary onClick={ storeTest }>Test</Button>
		</>
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
