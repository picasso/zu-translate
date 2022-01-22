// WordPress dependencies

const _ = lodash;
const { select } = wp.data;

// Zukit dependencies

export const { externalData, getExternalData, mergeClasses, emptyGif, toJSON, simpleMarkdown } = wp.zukit.utils;

// before calls 'getExternalData', we need to call 'externalData'
externalData('zutranslate_blocks_data');
const supportedData = getExternalData('supported', {});
const supportedBlocks = _.keys(supportedData);

// import debug object and make it available from global scope
window.Zubug = { ...(wp.zukit.debug  || {}) };
export const getDebug = (enable) => enable ? Zubug : _.transform(_.keys(Zubug), (acc, key) => acc[key] = _.noop, {});

export function isSupported(name) {
	return _.includes(supportedBlocks, name);
}

export function getTranslatedAtts(name) {
	return _.castArray(_.get(supportedData, [name, 'atts']));
}

export function getTranslated(name, attributes) {
	const translatedKeys = getTranslatedAtts(name);
	const translatedAtts = _.reduce(translatedKeys, (values, attr) => {
		values.push(_.get(attributes, attr, ''));
        return values;
    }, []);

	return [_.join(translatedKeys, ','), translatedAtts];
}

// selector which returns an array containing all block client IDs in the editor.
// Optionally accepts a root client ID of the block list for which
// the order should be returned, defaulting to the top-level block order.
const { getBlockOrder } = select('core/block-editor');
// recursively collect all IDs of 'editable blocks' on the page.
export function getEditorBlocks(ids = null) {
	if(_.isNil(ids)) ids = getBlockOrder();
	return _.reduce(ids, (blocks, id) => {
		const innerIds = getBlockOrder(id);
		const nestedIds = innerIds.length ? getEditorBlocks(innerIds) : innerIds;
		return [...blocks, ...nestedIds];
	}, ids);
}

// Language Session Storage ---------------------------------------------------]

// function which returns true if the current environment supports browser
// sessionStorage, or false otherwise.
const hasSessionStorageSupport = _.once(() => {
	try {
		// Private Browsing in Safari 10 and earlier will throw an error when
		// attempting to set into sessionStorage. The test here is intentional in
		// causing a thrown error as condition bailing from local autosave.
		window.sessionStorage.setItem('__zuTranslateTestSessionStorage', '');
		window.sessionStorage.removeItem('__zuTranslateTestSessionStorage');
		return true;
	} catch(error) {
		return false;
	}
});

// the edit language corresponds to the current LSB selection
// or the main admin language for single mode
const keyEditLanguage = 'qtranslate-xt-admin-edit-language';

export function getSessionLang() {
    return hasSessionStorageSupport() ? sessionStorage.getItem(keyEditLanguage) : null;
}

export function storeSessionLang(lang) {
	if(hasSessionStorageSupport()) {
		try {
			sessionStorage.setItem(keyEditLanguage, lang);
		} catch(e) {
			window.console.warn(`Failed to store "${keyEditLanguage}"=${lang} with sessionStorage`, e);
		}
	}
}
