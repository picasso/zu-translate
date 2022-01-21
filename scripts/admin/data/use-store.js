// WordPress dependencies

const { keys, forEach, includes, some, has, set } = lodash;
const { usePrevious } = wp.compose;
const { useEffect  } = wp.element;
const { select, dispatch } = wp.data;
const { apiFetch } = wp;

// Internal dependencies

import { getExternalData, getDebug, storeSessionLang } from './../utils.js';
import { ZUTRANSLATE_STORE, supportedKeys } from './raw-store.js';

const supportSession = getExternalData('session', false);
const enableDebug = getExternalData('debug.sync_blocks', false);
const debug = getDebug(enableDebug);

// Custom hooks & helpers for 'store' -----------------------------------------]

export function getLang() {
	return select(ZUTRANSLATE_STORE).getLang();
}

export function getRaw(key) {
	return select(ZUTRANSLATE_STORE).getRaw(key);
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
	const hooks = select(ZUTRANSLATE_STORE).getHooks();
	if(!has(hooks, id)) {
		dispatch(ZUTRANSLATE_STORE).setHook(id, hook);
	}
}

export function removeHook(id) {
	dispatch(ZUTRANSLATE_STORE).removeHook(id);
}

// custom hook which get dispatch method for 'lang' change
export function changeLang(value) {
    const { setLang } = dispatch(ZUTRANSLATE_STORE);
	const currentLang = getLang();
    if(value !== currentLang) {
		if(supportSession) storeSessionLang(value);
		setLang(value);
	}
}

export function useOnLangChange(clientId, callback, prevLang) {
	const editorLang = getLang();
	const prev = usePrevious(prevLang ?? editorLang);
	useEffect(() => {
		// if the previous language value is defined and not equal to the current value - call the 'callback' function
		const enable = prev !== undefined && prev !== editorLang;
		debug.infoWithId(clientId, `-#on lang change : {will ${enable ? 'switch' : 'skip'}}`, { prev, editorLang });
		if(enable) {
			callback(editorLang);
		}
	}, [prev, editorLang, clientId, callback]);
	return editorLang;
}

export function useLangHook(clientId, updater) {
	useEffect(() => {
		addHook(clientId, updater);
		return () => removeHook(clientId);
	// 'clientId' and 'updater' never change, 'useEffect' will be called only on mounting and unmounting the component
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
}

// Hook on the post saving ----------------------------------------------------]

const { isSavingPost } = select('core/editor');

apiFetch.use((options, next) => {
	if(isSavingPost() && includes(['PUT', 'POST'], options.method)) {
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
		debug.data({ newOptions });
		return next(newOptions);
	}
	return next(options);
});
