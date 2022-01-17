// WordPress dependencies

const { isEmpty, isArray, keys, pick, includes, pull, some, cloneDeep } = lodash;
// const { useEffect  } = wp.element; // useCallback, useRef
const { subscribe, select, dispatch } = wp.data;

// Internal dependencies

import { getExternalData } from './../utils.js';
import { supportedKeys } from './raw-store.js';


const { getEntityRecordNonTransientEdits, getEditedEntityRecord } = select('core');
const { editEntityRecord, receiveEntityRecords } = dispatch('core');
const { isEditedPostDirty, getCurrentPostType, getCurrentPostId } = select('core/editor');
const { isSavingPost } = select('core/editor');

const enableDebug = getExternalData('debug.edited_entity', false);

// hasChangedContent,
// hasNonPostEntityChanges,
// isEditedPostEmpty
// isEditedPostDirty
// isAutosavingPost
// isCleanNewPost
// isEditedPostAutosaveable
// Actions

export const rootClientId = 'rawRoot';

export function getEntityAttributes(onlyAtts = null) {
	const postType = getCurrentPostType();
	const postId = getCurrentPostId();
	const entityRecord = getEditedEntityRecord('postType', postType, postId);
	return pick(entityRecord, onlyAtts ?? supportedKeys)
}

export function updateEntityAttributes(edits) {
	if(!isEmpty(edits)) {
		if(enableDebug) Zubug.info('Update Entity Attributes', edits);
		collectEdits(edits);
		const postType = getCurrentPostType();
		const postId = getCurrentPostId();
		editEntityRecord('postType', postType, postId, edits);
	}
}

function getNonTransientEdits(name = null, recordId = null) {
	const postType = name ?? getCurrentPostType();
	const postId = recordId ?? getCurrentPostId();
	return getEntityRecordNonTransientEdits('postType', postType, postId);
}

let keepAttributes = []
function collectEdits(edits, canCollect = false) {
	const editKeys = isArray(edits) ? edits : keys(edits);
	if(!isArray(shouldResetEdits) && canCollect) shouldResetEdits = [];

	if(isArray(shouldResetEdits)) {
		if(includes(shouldResetEdits, 'atts')) pull(shouldResetEdits, 'atts');
		if(includes(edits, 'atts') && some(keepAttributes, key => includes(supportedKeys, key)))  pull(edits, 'atts');
		shouldResetEdits.push(...editKeys, ...keepAttributes);
		keepAttributes = [];
		// } else {
		// 	shouldResetEdits.push(...editKeys);
		// }
	} else {
		keepAttributes = editKeys;
	}
}


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


// editPost(kind, name, recordId, edits:{expert: ''})
// editEntityRecord(kind, name, recordId, edits, options = {})
// edits: { blocks: undefined, selection: undefined, content: undefined }


let isPostDirty = false;
subscribe(() => {
    if(isEditedPostDirty()) {
		if(!isPostDirty) {
			isPostDirty = true;
			debugPostStatus();
		}
    } else {
		if(isPostDirty) {
			isPostDirty = false;
			debugPostStatus();
		}
    }
});

let shouldResetEdits = false;
export function beforeLanguageSwitch() {
	debugPostStatus('beforeLanguageSwitch');
	if(isPostDirty) return;
	shouldResetEdits = true;
}

export function afterLanguageSwitch(clientId, activateSync) {
	if(!shouldResetEdits) return;

	const edits = [];
	if(clientId === rootClientId) {
		edits.push('atts');
		if(activateSync) edits.push('content');
	} else {
		edits.push('content');
		if(activateSync) edits.push('atts');
	}
	collectEdits(edits, true);
	debugPostStatus('afterLanguageSwitch', { clientId, activateSync, shouldResetEdits });
}

// let isWaitingForClean = false;
subscribe(() => {
    if(isArray(shouldResetEdits) && isPostDirty) {
		// isWaitingForClean = true;
		const nonTransientEdits = getNonTransientEdits();
		debugPostStatus('{shouldResetEdits}', { shouldResetEdits, nonTransientEdits });
		if(!isEmpty(nonTransientEdits)) {
			pull(shouldResetEdits, ...keys(nonTransientEdits));
			if(isEmpty(shouldResetEdits)) {
				emulateSavingPost();
			}
		}
    }
	if(isArray(shouldResetEdits) && isEmpty(shouldResetEdits) && !isPostDirty) {
		debugPostStatus('{shouldResetEdits isEmpty}');
		shouldResetEdits = false;
		// isWaitingForClean = false;
	}
});

export function emulateSavingPost() {
	if(enableDebug) Zubug.info('*Emulate {Saving Post}');
	const postType = getCurrentPostType();
	const postId = getCurrentPostId();
	const updatedRecord = getEditedEntityRecord('postType', postType, postId);
	const nonTransientEdits = getNonTransientEdits(postType, postId); //getEntityRecordNonTransientEdits('postType', postType, postId);
	// yield external_wp_data_["controls"].select('core', 'getEntityRecordNonTransientEdits', kind, name, recordId);
	const edits = {
		id: postId,
		...nonTransientEdits
	};
	if(enableDebug) Zubug.data({ nonTransientEdits, record: pick(updatedRecord, keys(nonTransientEdits)) });
	receiveEntityRecords('postType', postType, updatedRecord, undefined, true, edits);
}

export function storeTest() {
	Zubug.info('?storeTest - Emulate saving post');
	emulateSavingPost();
	// const postType = getCurrentPostType();
	// const postId = getCurrentPostId();
	// const updatedRecord = getEditedEntityRecord('postType', postType, postId);
	// const nonTransientEdits = getEntityRecordNonTransientEdits('postType', postType, postId);
	// // yield external_wp_data_["controls"].select('core', 'getEntityRecordNonTransientEdits', kind, name, recordId);
	// const edits = {
	// 	id: postId,
	// 	...nonTransientEdits
	// };
	// receiveEntityRecords('postType', postType, updatedRecord, undefined, true, edits);
}


// Internal debug helpers -----------------------------------------------------]

let postSaved = true;
subscribe(() => {
    if(isSavingPost()) {
		postSaved = false;
		if(enableDebug) Zubug.info('?{Saving Post...}');
    } else {
		if(!postSaved) {
            if(enableDebug) Zubug.info('*{Post Saved}');
            postSaved = true;
        }
    }
});

function debugPostStatus(message, more) {
	if(enableDebug) {
		const status = isPostDirty ? 'dirty' : 'clean';
		const desc = message ? `${message} - ` : '';
		const info = `-${isPostDirty ? '!' : '*'}${desc}Post is {${status}}`;
		if(more) Zubug.info(info, cloneDeep(more));
		else Zubug.info(info);
	}
}

// function debugPostEdits(message, edits) {
// 	if(enableDebug) {
// 		const postType = getCurrentPostType();
// 		const postId = getCurrentPostId();
// 		const nonTransientEdits = edits ?? getNonTransientEdits();
// 		Zubug.info(`${message}`, {
// 			isEditedPostDirty: isEditedPostDirty(),
// 			nonTransientEdits,
// 			recordEdits: getEntityRecordEdits('postType', postType, postId),
// 		});
//     }
// }
