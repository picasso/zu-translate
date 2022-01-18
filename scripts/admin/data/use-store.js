// WordPress dependencies

const { keys, forEach, includes, some, has, set } = lodash;
const { usePrevious } = wp.compose;
const { useEffect  } = wp.element; // useCallback, useRef
const { select, dispatch } = wp.data; // subscribe,
const { apiFetch } = wp;

// Internal dependencies

import { getExternalData } from './../utils.js';
import { beforeLanguageSwitch, afterLanguageSwitch } from './edited-entity.js';
import { ZUTRANSLATE_STORE, subscribe, supportedKeys } from './raw-store.js';

const enableDebug = getExternalData('debug.post_saving', false);
const activateSync = getExternalData('sync', false);

// Custom hooks & helpers for 'store' -----------------------------------------]

export function getLang() {
	return select(ZUTRANSLATE_STORE).getLang();
}

export function getRaw(key) {
	return select(ZUTRANSLATE_STORE).getRaw(key);
}

export function getHooks() {
	return select(ZUTRANSLATE_STORE).getHooks();
}

export function setRaw(attribute, value) {
	const { setRaw: setRawValue } = dispatch(ZUTRANSLATE_STORE);
	setRawValue(attribute, value);
}

export function updateRaw(attribute, value) {
	const { updateRaw: updateRawValue } = dispatch(ZUTRANSLATE_STORE);
	updateRawValue(attribute, value);
}

export function addHook(id, hook) {
	const { setHook } = dispatch(ZUTRANSLATE_STORE);
	setHook(id, hook);
}

// custom hook which get dispatch method for 'lang' change
export function changeLang(value) {
    const { setLang } = dispatch(ZUTRANSLATE_STORE);
	const currentLang = getLang();
    if(value !== currentLang) {
		beforeLanguageSwitch(currentLang);
		setLang(value);
	}
}

export function useOnLangChange(clientId, callback) {
	const editorLang = getLang();
	const prev = usePrevious(editorLang);
	// if the previous language value is defined and not equal to the current value - call the 'callback' function
	useEffect(() => {
		if(prev !== undefined && prev !== editorLang) {
			callback(editorLang);
			Zubug.data({ clientId });
			Zubug.infoWithId(clientId, '+{Component updated LANG}');
		}
	}, [prev, editorLang, clientId, callback]);
	return editorLang;
}

export function useLangHook(clientId, updater) {
	useEffect(() => {
		const { setHook, removeHook } = dispatch(ZUTRANSLATE_STORE);
		setHook(clientId, updater);
		return () => removeHook(clientId);
	// 'clientId' and 'updater' never change, 'useEffect' will be called only on mounting and unmounting the component
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
}

// call all registered hooks besides associated with 'clientId'
// this will lead to switching language for blocks associated with these hooks
export function syncBlocks(clientId) {
	if(activateSync) {
		const hooks = getHooks();
		if(enableDebug) {
			Zubug.info(`Sync initiated from {${clientId}}`, { hookCount: Object.keys(hooks).length, hooks });
		}
		forEach(hooks, (hook, id) => {
			if(id !== clientId) {
				if(enableDebug) Zubug.info(`calling hook for {${id}}`);
				hook();
			}
		});
	}
	afterLanguageSwitch(clientId, activateSync);
}

// Hook on the post saving ----------------------------------------------------]

const { isSavingPost } = select('core/editor');
let skipSavingPost = false;

apiFetch.use((options, next) => {
	if(enableDebug) Zubug.data({ options, isSavingPost: isSavingPost() });
	if(isSavingPost() && includes(['PUT', 'POST'], options.method)) {
		if(skipSavingPost) {
			// if(enableDebug)
			Zubug.info('*apiFetch - emulate saving post');
			// skipSavingPost = false;
			// const data = getCurrentPost();
			// const edited = getEditedPost();
			//
			// // const result = next(options);
			// Zubug.data({ data, edited, isEqual: isEqual(edited, data) });
			// return Promise.resolve(
			// 		// we don't have headers because we "emulate" this request
			// 		// new window.Response(
			// 		// 	JSON.stringify(edited),
			// 		// 	{
			// 		// 		status: 200,
			// 		// 		statusText: 'OK',
			// 		// 		headers: {},
			// 		// 	}
			// 		// )
			// 		edited
			// 	);
		} else {
			const { data } = options;
			const newOptions = { ...options, data: { ...data, editor_lang: getLang() } };
			if(some(keys(data), val => includes(supportedKeys, val))) {
				forEach(supportedKeys, attr => {
					if(has(data, attr)) {
						const rawValue = getRaw(attr);
						set(newOptions, ['data', attr], rawValue);
					}
				});
			}
			if(enableDebug) Zubug.data({ newOptions });
			return next(newOptions);
		}
	}
	return next(options);
});

subscribe(() => {
	// if(enableDebug)
	Zubug.info('?RAW store updated', { lang: getLang() });
});


// helper function that sends a success response
// function sendSuccessResponse(responseData) {
// 	return Promise.resolve(
// 		new window.Response(
// 			JSON.stringify(responseData.body),
// 			{
// 				status: 200,
// 				statusText: 'OK',
// 				headers: responseData.headers ?? {},
// 			}
// 		)
// 	);
// }
