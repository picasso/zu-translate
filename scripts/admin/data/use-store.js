// WordPress dependencies

const { keys, forEach, castArray, includes, some, has, set } = lodash;
const { usePrevious } = wp.compose;
const { useEffect  } = wp.element; // useCallback, useRef
const { select, dispatch, useSelect, useDispatch } = wp.data; // subscribe,
const { apiFetch } = wp;

// Internal dependencies

import { getLangContent, getInputValue, changeInputValue, addInputListener } from './../utils.js';
import { ZUTRANSLATE_STORE } from './raw-store.js';

const supportedAtts = {
	title: '.editor-post-title__input',
	excerpt: '.editor-post-excerpt__textarea .components-textarea-control__input',
};

const supportedKeys = keys(supportedAtts);

const activateDebug = false;

// Custom hooks & helpers -----------------------------------------------------]

// Custom hook which get dispatch method for 'Raw' data update
export const useUpdateRaw = () => {
    const { updateRaw } = useDispatch(ZUTRANSLATE_STORE);
    return updateRaw;
};

// Custom hook which get dispatch method for 'lang' change
export const useChangeLang = () => {
    const { changeLang } = useDispatch(ZUTRANSLATE_STORE);
    return changeLang;
};

// Custom hook which returns 'raw' by 'key'
export const useGetRaw = (key) => {
	const { value = null } = useSelect(select => {
		return { value: select(ZUTRANSLATE_STORE).getRaw(key) };
	}, []);
	return value;
};

// Custom hook which returns 'raw' by 'key'
export const useGetLang = () => {
	const { value = null } = useSelect(select => {
		return { value: select(ZUTRANSLATE_STORE).getLang() };
	}, []);
	return value;
};

////////////////////////////////////////////////////////////////////////////////


export function getLang() {
	return select(ZUTRANSLATE_STORE).getLang();
}

export function getRaw(key) {
	return select(ZUTRANSLATE_STORE).getRaw(key);
}

// Custom hook which get dispatch method for 'lang' change
export function changeLang(value) {
    const { changeLang } = dispatch(ZUTRANSLATE_STORE);
	const currentLang = getLang();
    if(value !== currentLang) changeLang(value);
}

// set the initial values for RAW attributes
export function setRawAttributes() {
	const { getEditedPostAttribute } = select('core/editor');
	const { setRaw } = dispatch(ZUTRANSLATE_STORE);
	forEach(supportedAtts, (selector, attr) => {
		const value = getEditedPostAttribute(`${attr}_raw`);
		setRaw(attr, value);
		addInputListener(selector, () => updateRawAttributes(attr));
	});
}

// update RAW attributes before changing language
// (if 'onlyAtts' is not null - update RAW for these attributes only)
export function updateRawAttributes(onlyAtts = null) {
	const { updateRaw } = dispatch(ZUTRANSLATE_STORE);
	onlyAtts = onlyAtts === null ? null : castArray(onlyAtts);
	forEach(supportedAtts, (selector, attr) => {
		if(onlyAtts === null || includes(onlyAtts, attr)) {
			const value = getInputValue(selector);
			updateRaw(attr, value);
		}
	});
}

// select content for the language from the RAW value and set it in the INPUT element
export function switchRawAttributes(lang) {
	forEach(supportedAtts, (selector, attr) => {
		const rawValue = getRaw(attr);
		if(rawValue !== undefined) {
			const renderedValue = getLangContent(rawValue, lang);
			changeInputValue(selector, renderedValue, true);
		}
	});
}

export function useOnLangChange(callback) {
	const editorLang = getLang();
	const prev = usePrevious(editorLang);

	// ????
	useEffect(() => {
		if(prev !== undefined && prev !== editorLang) callback(editorLang);
	}, [prev, editorLang, callback]);

	return editorLang;
}

// Custom hook to notify on form removal (also collect form names)
// export const useOnFormRemove = (clientId, postId, name, updateForm) => {
//
// 	const formRef = useRef({ clientId, postId, name, updateForm });
//
// 	// 'updateForm' will be called on form removing only
// 	useEffect(() => {
// 		return () => {
// 			const { clientId, name, updateForm } = formRef.current || {};
// 			updateForm(name, TYPES.PURGE_FORM);
// 			// delete form name from common list
// 			updateName(clientId, name, true);
// 		}
// 	}, []);
//
// 	// in order to maintain a list of all the names for the forms on the page
// 	useEffect(() => {
// 		updateName(clientId, name);
// 		formRef.current = { clientId, postId, name, updateForm };
// 	}, [clientId, postId, name, updateForm]);
// }

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
