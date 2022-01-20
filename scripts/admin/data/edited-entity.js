// WordPress dependencies

const { isEmpty, keys, pick } = lodash;
const { subscribe, select, dispatch } = wp.data;

// Internal dependencies

import { getExternalData, getDebug } from './../utils.js';
import { subscribe as subscribeCustomStore, supportedKeys } from './raw-store.js';
import { entityState, getWatched, syncCompleted } from './sync-blocks.js';

const { getEntityRecordNonTransientEdits, getEditedEntityRecord } = select('core');
const { editEntityRecord, receiveEntityRecords } = dispatch('core');
const { isEditedPostDirty, isCurrentPostPublished, getCurrentPostType, getCurrentPostId } = select('core/editor');
const { isSavingPost } = select('core/editor');

const enableDebug = getExternalData('debug.edited_entity', false);
const debug = getDebug(enableDebug);

// Attributes of the Entity ---------------------------------------------------]

export function getEntityAttributes(onlyAtts = null) {
	const postType = getCurrentPostType();
	const postId = getCurrentPostId();
	const entityRecord = getEditedEntityRecord('postType', postType, postId);
	return pick(entityRecord, onlyAtts ?? supportedKeys)
}

export function updateEntityAttributes(edits) {
	if(!isEmpty(edits)) {
		debug.info('-+{updated} Entity Attributes', edits);
		// collectEdits(edits);
		const postType = getCurrentPostType();
		const postId = getCurrentPostId();
		editEntityRecord('postType', postType, postId, edits);
		syncCompleted();
	}
}

// Maintaining 'non-modified' content -----------------------------------------]

subscribe(() => {
	if(isCurrentPostPublished() && !entityState.isPostPublished) {
		entityState.isPostPublished = true;
	}
    if(isEditedPostDirty()) {
		if(!entityState.isPostDirty) {
			entityState.isPostDirty = true;
			debugPostStatus();
		}
    } else {
		if(entityState.isPostDirty) {
			entityState.isPostDirty = false;
			debugPostStatus();
		}
    }
});

subscribeCustomStore(() => {
	// we need to wait when all changes are committed in 'Entity'
	// otherwise we will start 'reset' ahead of time
	if(entityState.isTracking && changesAreCommitted()) {
		entityState.isTracking = false;
		debug.info('-#RAW store tracking is {completed}', entityState);
		resetEdits();
	}
});

function changesAreCommitted() {
	// const watched = getWatched();
	return getWatched().length === 0;
}

function getNonTransientEdits(name = null, recordId = null) {
	const postType = name ?? getCurrentPostType();
	const postId = recordId ?? getCurrentPostId();
	return getEntityRecordNonTransientEdits('postType', postType, postId);
}

function resetEdits() {
	const nonTransientEdits = getNonTransientEdits();
	debug.info('-?{resetEdits}', keys(nonTransientEdits));
	if(!isEmpty(nonTransientEdits)) {
		emulateSavingPost(nonTransientEdits);
		entityState.shouldResetEdits = false;
	}
}

// For emulation, we repeat what the WordPress is doing after saving the post
// it calls action 'receiveEntityRecords' with data received from the server
// we have no data from the server, but we just take the latest changes from Entity
// when we return the data that are equal to the latest changes,
// then the 'Data Store' considers that the data has been successfully saved and resets the accumulated changes
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

function debugPostStatus() {
	if(enableDebug) {
		const { isPostPublished, isPostDirty, shouldResetEdits } = entityState;
		const published = isPostPublished ? 'published' : 'not published';
		const status = isPostDirty ? 'dirty' : 'clean';
		const args = [`-${isPostDirty ? '!' : '*'}Post [${published}] and editing state is {${status}}`];
		!shouldResetEdits && args.push(keys(getNonTransientEdits()));
		debug.info.apply(debug, args);
	}
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
