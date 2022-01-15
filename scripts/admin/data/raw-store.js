// WordPress dependencies

const { keys, isEqual, get, omit } = lodash;
const { registerStore } = wp.data;

// Internal dependencies

import { getExternalData, getSessionLang, storeSessionLang } from './../utils.js';
import { updateRawContent } from './../raw-utils.js';

const supportSession = getExternalData('session', false);
const sessionLang = supportSession ? getSessionLang() : null;
const editorLang = sessionLang ?? getExternalData('lang', 'en');
const enableDebug = getExternalData('debug.raw_store', false);

// Create and register Zu Translate store -------------------------------------]

export const supportedAtts = {
	title: '.editor-post-title__input',
	excerpt: '.editor-post-excerpt__textarea .components-textarea-control__input',
};

export const supportedKeys = keys(supportedAtts);

export const ZUTRANSLATE_STORE = 'zutranslate/core';

const TYPES = {
    SET_LANG: 'SET_LANG',
    SET_RAW: 'SET_RAW',
    UPDATE_RAW: 'UPDATE_RAW',
    SET_HOOK: 'SET_HOOK',
    REMOVE_HOOK: 'REMOVE_HOOK',
}

const initialState = {
    lang: editorLang,
    hooks: {},
};

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

        case TYPES.SET_HOOK:
            interim = {
                ...state,
                hooks: {
                    ...state.hooks,
                    [key]: value,
                },
            };
            break;

        case TYPES.REMOVE_HOOK:
            interim = {
                ...state,
                hooks: omit(state.hooks, key),
            };
            break;
    }

    if(enableDebug) Zubug.data({ state, type, key, value, isEqual: isEqual(state, interim) });
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
		if(supportSession) storeSessionLang(value);
        return {
			type: TYPES.SET_LANG,
			value,
		};
    },
    setHook(id, hook) {
        return {
			type: TYPES.SET_HOOK,
            key: id,
			value: hook,
		};
    },
    removeHook(id) {
        return {
			type: TYPES.REMOVE_HOOK,
            key: id,
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
        getHooks(state) {
            return get(state, 'hooks');
        },
    },
    controls: {},
});
