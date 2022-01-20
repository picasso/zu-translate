// WordPress dependencies

const { forEach, isString } = lodash;

// Internal dependencies

import { getExternalData, getDebug } from './../utils.js';
import { whenNodeInserted} from './../when-node.js';
import { hasRawBlocks, getLangContent } from './../raw-utils.js';
import { getLang } from './use-store.js';

const enableDebug = getExternalData('debug.raw_helpers', false);
const debug = getDebug(enableDebug);

const rawElements = {
	sitename: [
		'.interface-interface-skeleton__actions',
		'.editor-post-publish-panel__prepublish .components-site-name',
	],
}

// Replace RAW elements with content in selected language ---------------------]

export function replaceRawElements() {
	forEach(rawElements, (selectors, element) => {
		const [root, selector] = isString(selectors) ? [null, selectors] : selectors;
		attachInsertedHooks(element, root, selector);
	});
}

function attachInsertedHooks(element, root, selector) {
	whenNodeInserted(root, selector, node => {
		let replaced = false;
		const value = node.innerHTML;
		if(hasRawBlocks(value)) {
			const editorLang = getLang();
			const shouldBeValue = getLangContent(value, editorLang);
			node.innerHTML = shouldBeValue ?? value;
			replaced = true;
		}
		debug.info(`-?Node Inserted for "{${element}}" - RAW {${replaced ? 'replaced' : 'not found'}}`);
	});
}
