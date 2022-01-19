// WordPress dependencies

const { isEmpty, keys, pick, cloneDeep } = lodash; // isArray, includes, pull, some,
const { subscribe, select, dispatch } = wp.data;

// Internal dependencies

import { getExternalData, getDebug } from './../utils.js';
import { subscribe as subscribeCustomStore, supportedKeys } from './raw-store.js';
import { entityState, getWatched, syncCompleted } from './sync-blocks.js';

const { getEntityRecordNonTransientEdits, getEditedEntityRecord } = select('core');
const { editEntityRecord, receiveEntityRecords } = dispatch('core');
const { isEditedPostDirty, getCurrentPostType, getCurrentPostId } = select('core/editor');
const { isSavingPost } = select('core/editor');

const enableDebug = getExternalData('debug.edited_entity', false);
const debug = getDebug(enableDebug);

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
		syncCompleted();
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
// 	if(!isArray(entityState.shouldResetEdits) && canCollect) entityState.shouldResetEdits = [];
//
// 	if(isArray(entityState.shouldResetEdits)) {
// 		if(includes(entityState.shouldResetEdits, 'atts')) pull(entityState.shouldResetEdits, 'atts');
// 		if(includes(edits, 'atts') && some(keepAttributes, key => includes(supportedKeys, key)))  pull(edits, 'atts');
// 		entityState.shouldResetEdits.push(...editKeys, ...keepAttributes);
// 		keepAttributes = [];
// 		// } else {
// 		// 	entityState.shouldResetEdits.push(...editKeys);
// 		// }
// 	} else {
// 		keepAttributes = editKeys;
// 	}
// }

// Maintaining 'non-modified' content -----------------------------------------]

subscribe(() => {
    if(isEditedPostDirty()) {
		if(!entityState.isPostDirty) {
			entityState.isPostDirty = true;
			debugPostStatus(
				!entityState.shouldResetEdits ? { nonTransientEdits: getNonTransientEdits() } : undefined
			);
		}
    } else {
		if(entityState.isPostDirty) {
			entityState.isPostDirty = false;
			debugPostStatus();
		}
    }
});

subscribeCustomStore(() => {
	if(entityState.isTracking && completedTracking()) {
		entityState.isTracking = false;
		debug.info('-#RAW store tracking is {completed}', entityState);
		resetEdits();
	}
});


// export function beforeLanguageSwitch(lang) {
// 	debugLanguageSwitch('before', lang);
// 	if(isPostDirty) return;
// 	// entityState.shouldResetEdits = true;
// }
//
// export function afterLanguageSwitch(lang) { // clientId, activateSync
// 	if(!entityState.shouldResetEdits) return;
// 	// entityState.isTracking = true;
//
// 	// const edits = [];
// 	// if(clientId === rootClientId) {
// 	// 	edits.push('atts');
// 	// 	if(activateSync) edits.push('content');
// 	// } else {
// 	// 	edits.push('content');
// 	// 	if(activateSync) edits.push('atts');
// 	// }
// 	// collectEdits(edits, true);
// 	debugLanguageSwitch('after', lang);
// }

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
		emulateSavingPost(nonTransientEdits);
		entityState.shouldResetEdits = false;
	}
}

// let isWaitingForClean = false;
// subscribe(() => {
// 	const enable = false;
//     if(enable && isArray(entityState.shouldResetEdits) && isPostDirty) {
// 		// isWaitingForClean = true;
// 		const nonTransientEdits = getNonTransientEdits();
// 		debugPostStatus('{entityState.shouldResetEdits}', { entityState.shouldResetEdits, nonTransientEdits });
// 		if(!isEmpty(nonTransientEdits)) {
// 			pull(entityState.shouldResetEdits, ...keys(nonTransientEdits));
// 			if(isEmpty(entityState.shouldResetEdits)) {
// 				emulateSavingPost();
// 			}
// 		}
//     }
// 	if(isArray(entityState.shouldResetEdits) && isEmpty(entityState.shouldResetEdits) && !isPostDirty) {
// 		debugPostStatus('{entityState.shouldResetEdits isEmpty}');
// 		entityState.shouldResetEdits = false;
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
	debug.info(`-*Emulate {Saving Post} [${postId}]`, nonTransientEdits);
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
		const status = entityState.isPostDirty ? 'dirty' : 'clean';
		const desc = message ? `${message} - ` : '';
		const info = `-${entityState.isPostDirty ? '!' : '*'}${desc}Post is {${status}}`;
		if(more) debug.info(info, cloneDeep(more));
		else debug.info(info);
	}
}
