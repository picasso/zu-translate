// WordPress dependencies

const { isEqual, get } = lodash;
const { registerStore } = wp.data;

// Internal dependencies

import { editorLang, updateRawContent } from './../utils.js';

// Create and register Zu Translate store -------------------------------------]

export const ZUTRANSLATE_STORE = 'zutranslate/core';

const TYPES = {
    SET_LANG: 'SET_LANG',
    SET_RAW: 'SET_RAW',
    UPDATE_RAW: 'UPDATE_RAW',
}

const initialState = {
    lang: editorLang,
    dirty: false,
};

const activateDebug = false;

function storeReducer(state = initialState, action) {
    const { type, key, value } = action;
    const prevValue = get(state, key, '');
    const lang = get(state, 'lang', '');

    // use an interim value to avoid unnecessary rendering
	// when the data does not change after 'action'
	let interim = state, newRaw = null;
    switch(type) {
        case TYPES.SET_RAW:
            interim = {
                ...state,
                [key]: value,
            };
            break;

        case TYPES.UPDATE_RAW:
            newRaw = updateRawContent(prevValue, lang, [value]);
            interim = {
                ...state,
                [key]: newRaw,
            };
            break;

        case TYPES.SET_LANG:
            interim = {
                ...state,
                lang: value,
            };
            break;
    }

    if(activateDebug) Zubug.data({ state, type, key, value, isEqual: isEqual(state, interim) });
    return isEqual(state, interim) ? state : interim;
}

const storeActions = {
    setRaw(key, value) {
        return {
			type: TYPES.SET_RAW,
            key,
			value,
		};
    },
    updateRaw(key, value) {
        return {
			type: TYPES.UPDATE_RAW,
            key,
			value,
		};
    },
    setLang(value) {
        return {
			type: TYPES.SET_LANG,
			value,
		};
    },
};

registerStore(ZUTRANSLATE_STORE, {
    reducer: storeReducer,
    actions: storeActions,
    selectors: {
        getRaw(state, key) {
            return get(state, key);
        },
        getLang(state) {
            return get(state, 'lang');
        },
    },
    controls: {},
});
