// WordPress dependencies

const { isEmpty, isEqual, keys, forEach, reduce, includes, some, has, set } = lodash;
const { usePrevious } = wp.compose;
const { useEffect  } = wp.element; // useCallback, useRef
const { subscribe, select, dispatch } = wp.data;
const { apiFetch } = wp;

// Internal dependencies

import { getExternalData } from './../utils.js';
import { getLangContent } from './../raw-utils.js';
import { ZUTRANSLATE_STORE, supportedKeys } from './raw-store.js';

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
	afterLanguageSwitch();
}

// Hook on the post saving ----------------------------------------------------]

const { isSavingPost, getCurrentPost } = select('core/editor');
let skipSavingPost = true;

apiFetch.use((options, next) => {
	if(enableDebug) Zubug.data({ options, isSavingPost: isSavingPost() });
	if(isSavingPost() && includes(['PUT', 'POST'], options.method)) {
		if(skipSavingPost) {
			// if(enableDebug)
			Zubug.info('*Emulate saving post');
			skipSavingPost = false;
			const data = getCurrentPost();
			const edited = getEditedPost();

			// const result = next(options);
			Zubug.data({ data, edited, isEqual: isEqual(edited, data) });
			return Promise.resolve(
					// we don't have headers because we "emulate" this request
					// new window.Response(
					// 	JSON.stringify(edited),
					// 	{
					// 		status: 200,
					// 		statusText: 'OK',
					// 		headers: {},
					// 	}
					// )
					edited
				);
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

// Maintaining 'non-modified' content -----------------------------------------]

const {
	isEditedPostDirty,
	getPostEdits,
	getCurrentPostType,
	getCurrentPostId,
 } = select('core/editor');
// hasChangedContent,
// hasNonPostEntityChanges,
// isEditedPostEmpty
// isEditedPostDirty
// isAutosavingPost
// isCleanNewPost
// isEditedPostAutosaveable
// Actions

// editPost(kind, name, recordId, edits:{expert: ''})
// editEntityRecord(kind, name, recordId, edits, options = {})
// edits: { blocks: undefined, selection: undefined, content: undefined }


let isPostDirty = false;
subscribe(() => {
    if(isEditedPostDirty()) {
		if(!isPostDirty) {
			isPostDirty = true;
			if(enableDebug) {
				Zubug.info('!EditedPost is {Dirty}');
				editDetails();
			}
		}
    } else {
		if(isPostDirty) {
			isPostDirty = false;
			if(enableDebug) {
				Zubug.info('*Edited Post is {Clean}}');
				editDetails();
			}
		}
    }
});


const {
	getEntityRecordEdits,
	getEntityRecordNonTransientEdits,
	getEditedEntityRecord,
} = select('core');
// editEntityRecord
// deleteEntityRecord
//
const { editEntityRecord, receiveEntityRecords } = dispatch('core');

export function storeTest() {
	Zubug.info('?storeTest - Emulate saving post');
	const postType = getCurrentPostType();
	const postId = getCurrentPostId();
	const updatedRecord = getEditedEntityRecord('postType', postType, postId);
	const nonTransientEdits = getEntityRecordNonTransientEdits('postType', postType, postId);
	// yield external_wp_data_["controls"].select('core', 'getEntityRecordNonTransientEdits', kind, name, recordId);
	const edits = {
		id: postId,
		...nonTransientEdits
	};
	receiveEntityRecords('postType', postType, updatedRecord, undefined, true, edits);
}


let updateStorage = {};
function beforeLanguageSwitch(lang) {
	updateStorage = {};
	if(isPostDirty) return;
	forEach(supportedKeys, attr => {
		const rawValue = getRaw(attr);
		const contentValue = getLangContent(rawValue, lang);
		updateStorage[attr] = contentValue;
	});
}

function afterLanguageSwitch() {
	if(isEmpty(updateStorage)) return;

	const postType = getCurrentPostType();
	const postId = getCurrentPostId();
	const nonTransientEdits = getEntityRecordNonTransientEdits('postType', postType, postId);

	const edits = reduce(keys(nonTransientEdits), (acc, attr) => set(acc, attr, updateStorage[attr]), {});

	if(!isEmpty(edits)) {
		editEntityRecord('postType', postType, postId, edits);
	}
}

function getEditedPost() {
	const postType = getCurrentPostType();
	const postId = getCurrentPostId();
	return getEditedEntityRecord('postType', postType, postId);
}

let postSaved = true;
subscribe(() => {
    if(isSavingPost()) {
		postSaved = false;
		editDetails('before Saving Post');
		if(enableDebug) Zubug.info('{isSavingPost}');
    } else {
		if(!postSaved) {
            if(enableDebug) Zubug.info('~Post Saved~');
			editDetails('after Post Saved');
            postSaved = true;
        }
    }
});


function editDetails(message) {
	if(enableDebug && message) Zubug.info(`called from {"${message}"}`);
	const postType = getCurrentPostType();
	const postId = getCurrentPostId();

	const isDirty = isEditedPostDirty();
	if(enableDebug) Zubug.data({
		isDirty,
		isPostDirty,
		// hasChangedContent: hasChangedContent(),
		getPostEdits: getPostEdits(),
		getEntityRecordEdits: getEntityRecordEdits('postType', postType, postId),
		getEntityRecordNonTransientEdits: getEntityRecordNonTransientEdits('postType', postType, postId),
		getEditedEntityRecord: getEditedEntityRecord('postType', postType, postId),
	});
}
