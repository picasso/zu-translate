// WordPress dependencies

const { isEmpty, keys, pick, cloneDeep } = lodash; // isArray, includes, pull, some,
const { subscribe, select, dispatch } = wp.data;

// Internal dependencies

import { getExternalData, getDebug } from './../utils.js';
import { ZUTRANSLATE_STORE, subscribe as subscribeCustomStore, supportedKeys } from './raw-store.js';


const { getEntityRecordNonTransientEdits, getEditedEntityRecord } = select('core');
const { editEntityRecord, receiveEntityRecords } = dispatch('core');
const { isEditedPostDirty, getCurrentPostType, getCurrentPostId } = select('core/editor');
const { isSavingPost } = select('core/editor');

const enableDebug = getExternalData('debug.edited_entity', false);
const debug = getDebug(enableDebug);

export const rootClientId = 'rawRoot';

// Attributes of the object Entity --------------------------------------------]

export function getEntityAttributes(onlyAtts = null) {
	const postType = getCurrentPostType();
	const postId = getCurrentPostId();
	const entityRecord = getEditedEntityRecord('postType', postType, postId);
	return pick(entityRecord, onlyAtts ?? supportedKeys)
}

export function updateEntityAttributes(edits) {
	if(!isEmpty(edits)) {
		debug.info('-Update {Entity Attributes}', edits);
		// collectEdits(edits);
		const postType = getCurrentPostType();
		const postId = getCurrentPostId();
		editEntityRecord('postType', postType, postId, edits);
		debug.infoWithId(rootClientId, '-*{Component unWatched}');
		removeWatched(rootClientId);
	}
}

function getNonTransientEdits(name = null, recordId = null) {
	const postType = name ?? getCurrentPostType();
	const postId = recordId ?? getCurrentPostId();
	return getEntityRecordNonTransientEdits('postType', postType, postId);
}

// let keepAttributes = []
// function collectEdits(edits, canCollect = false) {
// 	const editKeys = isArray(edits) ? edits : keys(edits);
// 	if(!isArray(shouldResetEdits) && canCollect) shouldResetEdits = [];
//
// 	if(isArray(shouldResetEdits)) {
// 		if(includes(shouldResetEdits, 'atts')) pull(shouldResetEdits, 'atts');
// 		if(includes(edits, 'atts') && some(keepAttributes, key => includes(supportedKeys, key)))  pull(edits, 'atts');
// 		shouldResetEdits.push(...editKeys, ...keepAttributes);
// 		keepAttributes = [];
// 		// } else {
// 		// 	shouldResetEdits.push(...editKeys);
// 		// }
// 	} else {
// 		keepAttributes = editKeys;
// 	}
// }


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

// Helpers for 'store' --------------------------------------------------------]

function getWatched() {
	return select(ZUTRANSLATE_STORE).getWatched();
}

function removeWatched(id) {
	dispatch(ZUTRANSLATE_STORE).removeWatched(id);
}

// Maintaining 'non-modified' content -----------------------------------------]

let isPostDirty = false;
subscribe(() => {
    if(isEditedPostDirty()) {
		if(!isPostDirty) {
			isPostDirty = true;
			debugPostStatus();
			if(!shouldResetEdits) debug.data({ nonTransientEdits: getNonTransientEdits() });
		}
    } else {
		if(isPostDirty) {
			isPostDirty = false;
			debugPostStatus();
		}
    }
});

let isTracking = false;
subscribeCustomStore(() => {
	if(isTracking && completedTracking()) {
		isTracking = false;
		debug.info('-?RAW store tracking is {completed}', { shouldResetEdits });
		resetEdits();
	}
});

let shouldResetEdits = false;
export function beforeLanguageSwitch(lang) {
	debugLanguageSwitch('before', lang);
	if(isPostDirty) return;
	shouldResetEdits = true;
}

export function afterLanguageSwitch(lang) { // clientId, activateSync
	if(!shouldResetEdits) return;
	isTracking = true;

	// const edits = [];
	// if(clientId === rootClientId) {
	// 	edits.push('atts');
	// 	if(activateSync) edits.push('content');
	// } else {
	// 	edits.push('content');
	// 	if(activateSync) edits.push('atts');
	// }
	// collectEdits(edits, true);
	debugLanguageSwitch('after', lang);
}

function completedTracking() {
	const watched = getWatched();
	// Zubug.info(`-!watched=${watched.length}`);
	// if(watched.length > 5) Zubug.data({ watched });
	return watched.length === 0;
}

function resetEdits() {
	const nonTransientEdits = getNonTransientEdits();
	debugPostStatus('{resetEdits}', keys(nonTransientEdits));
	if(!isEmpty(nonTransientEdits)) {
		// pull(shouldResetEdits, ...keys(nonTransientEdits));
		// if(isEmpty(shouldResetEdits)) {
			emulateSavingPost(nonTransientEdits);
			shouldResetEdits = false;
		// }
	}
}

// let isWaitingForClean = false;
// subscribe(() => {
// 	const enable = false;
//     if(enable && isArray(shouldResetEdits) && isPostDirty) {
// 		// isWaitingForClean = true;
// 		const nonTransientEdits = getNonTransientEdits();
// 		debugPostStatus('{shouldResetEdits}', { shouldResetEdits, nonTransientEdits });
// 		if(!isEmpty(nonTransientEdits)) {
// 			pull(shouldResetEdits, ...keys(nonTransientEdits));
// 			if(isEmpty(shouldResetEdits)) {
// 				emulateSavingPost();
// 			}
// 		}
//     }
// 	if(isArray(shouldResetEdits) && isEmpty(shouldResetEdits) && !isPostDirty) {
// 		debugPostStatus('{shouldResetEdits isEmpty}');
// 		shouldResetEdits = false;
// 		// isWaitingForClean = false;
// 	}
// });

export function emulateSavingPost(postEdits) {
	const postType = getCurrentPostType();
	const postId = getCurrentPostId();
	const updatedRecord = getEditedEntityRecord('postType', postType, postId);
	const nonTransientEdits = postEdits ?? getNonTransientEdits(postType, postId);
	const edits = {
		id: postId,
		...nonTransientEdits
	};
	debug.info('-*Emulate {Saving Post}', postId, nonTransientEdits);
	receiveEntityRecords('postType', postType, updatedRecord, undefined, true, edits);
}

export function storeTest() {
	debug.info('-?storeTest - Activated manually');
	emulateSavingPost();
}


// Internal debug helpers -----------------------------------------------------]

let postSaved = true;
subscribe(() => {
    if(isSavingPost()) {
		postSaved = false;
		debug.info('-?{Saving Post...}');
    } else {
		if(!postSaved) {
            debug.info('-*{Post Saved}');
            postSaved = true;
        }
    }
});

function debugPostStatus(message, more) {
	if(enableDebug) {
		const status = isPostDirty ? 'dirty' : 'clean';
		const desc = message ? `${message} - ` : '';
		const info = `-${isPostDirty ? '!' : '*'}${desc}Post is {${status}}`;
		if(more) debug.info(info, cloneDeep(more));
		else debug.info(info);
	}
}

function debugLanguageSwitch(when, lang) {
	if(enableDebug) {
		const status = isPostDirty ? 'dirty' : 'clean';
		const info = `-${when === 'before' ? '?' : '+'}{${when}} Language Switch [${lang}] - Post is {${status}}`;
		// if(more) debug.info(info, cloneDeep(more));
		// else 
		debug.info(info);
	}
}
