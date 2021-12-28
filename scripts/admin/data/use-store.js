// WordPress dependencies

const { keys, forEach, includes, some, has, set } = lodash;
const { usePrevious } = wp.compose;
const { useEffect  } = wp.element; // useCallback, useRef
const { select, dispatch } = wp.data; // subscribe,
const { apiFetch } = wp;

// Internal dependencies

import { ZUTRANSLATE_STORE, supportedKeys } from './raw-store.js';

const activateDebug = false;

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
    if(value !== currentLang) setLang(value);
}

export function useOnLangChange(callback) {
	const editorLang = getLang();
	const prev = usePrevious(editorLang);
	// if the previous language value is defined and not equal to the current value - call the 'callback' function
	useEffect(() => {
		if(prev !== undefined && prev !== editorLang) callback(editorLang);
	}, [prev, editorLang, callback]);
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

// Hook on the post saving ----------------------------------------------------]

const { isSavingPost } = select('core/editor');

apiFetch.use((options, next) => {
	if(activateDebug) Zubug.data({ options, isSavingPost: isSavingPost() });
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
		if(activateDebug) Zubug.data({ newOptions });
		return next(newOptions);
	}
	return next(options);
});
