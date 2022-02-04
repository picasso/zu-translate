// WordPress dependencies

const { isEmpty, keys, pick, get, set, forEach, every, has, reduce } = lodash;
const { sprintf } = wp.i18n;
const { subscribe, select, dispatch } = wp.data;

// Internal dependencies

import { getExternalData, getDebug } from './../utils.js';
import { subscribe as subscribeCustomStore, supportedKeys } from './raw-store.js';
import { entityState, getWatched, syncCompleted } from './sync-blocks.js';

const { isEditedPostDirty, isCurrentPostPublished, getCurrentPostType, getCurrentPostId } = select('core/editor');
const { getEntityRecordNonTransientEdits, getEditedEntityRecord } = select('core');
const { editEntityRecord, receiveEntityRecords } = dispatch('core');

const enableDebug = getExternalData('debug.edited_entity', false);
const debug = getDebug(enableDebug);

// local storage for current attribute values
let editedAttributes = null;

// Attributes of the Entity (debug - blue) ------------------------------------]

export function initEditedAttribute(attr, listener) {
	const rawAttr = `${attr}_raw`;
	if(!editedAttributes) editedAttributes = {};
	const atts = getEntityAttributes([attr, rawAttr]);
	setEditedAttributes({ [attr]: get(atts, attr) });
	set(editedAttributes, [attr, 'listener'], listener);
	editedAttributes.isReady = every(supportedKeys, attr => has(editedAttributes, attr));
	if(editedAttributes.isReady) debug.info('-^{+ready} Edited Attributes', editedAttributes);
	return get(atts, rawAttr);
}

export function getEntityAttributes(onlyAtts = null) {
	const postType = getCurrentPostType();
	const postId = getCurrentPostId();
	const entityRecord = getEditedEntityRecord('postType', postType, postId);
	return pick(entityRecord, onlyAtts ?? supportedKeys)
}

export function updateEntityAttributes(edits) {
	if(!isEmpty(edits)) {
		debug.info('-^{updated} - Entity Attributes', edits);
		const postType = getCurrentPostType();
		const postId = getCurrentPostId();
		// definitely need to be called before 'editEntityRecord'
		setEditedAttributes(edits);
		editEntityRecord('postType', postType, postId, edits);
	} else {
		debug.info('-^{#not updated} - Entity Attributes', edits);
	}
	syncCompleted();
}

// Local 'edited' Attributes (debug - blue) -----------------------------------]

function setEditedAttributes(edits, prevOnly = false) {
	forEach(edits, (value, attr) => {
		if(!prevOnly) set(editedAttributes, [attr, 'value'], value);
		set(editedAttributes, ['prevEdits', attr], value);
	});
}

function updateEditedAttributes(edits) {
	forEach(edits, (value, attr) => {
		const { listener } = editedAttributes[attr];
		set(editedAttributes, [attr, 'value'], value);
		listener(attr, value);
		debug.info(`-^updated RAW for is ${attr} - [${value}]`);
	});
}

function diffEdits(edits) {
	const { prevEdits } = editedAttributes;
	const entityAtts = keys(edits).length !== keys(prevEdits).length ? getEntityAttributes() : {};
	const changes = reduce(prevEdits, (acc, prev, attr) => {
		const value = edits[attr] ?? entityAtts[attr];
		if(value !== prev) acc[attr] = value;
		return acc;
	}, {});
	const hasChanges = keys(changes).length > 0;
	if(hasChanges) setEditedAttributes(changes, true);
	return hasChanges ? changes : null;
}

function hasEditedAttributes() {
	return editedAttributes && editedAttributes.isReady;
}

// Maintaining 'non-modified' content (debug - brown) -------------------------]

subscribe(() => {
	// track post state (Published & Dirty)
	if(isCurrentPostPublished() && !entityState.isPostPublished) {
		entityState.isPostPublished = true;
	}
    if(isEditedPostDirty()) {
		if(!entityState.isPostDirty) {
			entityState.isPostDirty = true;
			// entityState.wasDirty = false;
			debugPostStatus();
		}
    } else {
		if(entityState.isPostDirty) {
			entityState.isPostDirty = false;
			// entityState.wasDirty = true;
			debugPostStatus();
		}
    }
	// track update of supported attributes (should be always after Published & Dirty)
	const [hasUpdates, edits] = testEdits();
	if(hasUpdates) {
		debug.info('#{test} edits', edits);
		updateEditedAttributes(edits);
	}
});

subscribeCustomStore(() => {
	// we need to wait when all changes are committed in 'Entity'
	// otherwise we will start 'reset' ahead of time
	if(entityState.isTracking && changesAreCommitted()) {
		entityState.isTracking = false;
		debug.info('-#RAW store tracking is {*completed}', entityState);
		resetEdits();
	}
});

function changesAreCommitted() {
	return getWatched().length === 0;
}

function getNonTransientEdits(name = null, recordId = null) {
	const postType = name ?? getCurrentPostType();
	const postId = recordId ?? getCurrentPostId();
	return getEntityRecordNonTransientEdits('postType', postType, postId);
}

function testEdits() {
	if(hasEditedAttributes()) {
		const edits = pick(getNonTransientEdits(), supportedKeys);
		const changes = diffEdits(edits);
		return changes ? [true, changes] : [false];
	}
	return [false];
}

function resetEdits() {
	const nonTransientEdits = getNonTransientEdits();
	debug.info('-#{?reset} edits', keys(nonTransientEdits));
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
function emulateSavingPost(postEdits) {
	const postType = getCurrentPostType();
	const postId = getCurrentPostId();
	const updatedRecord = getEditedEntityRecord('postType', postType, postId);
	const nonTransientEdits = postEdits ?? getNonTransientEdits(postType, postId);
	const edits = {
		id: postId,
		...nonTransientEdits
	};
	debug.info(`-?emulate {Saving Post} [${postId}]`, nonTransientEdits);
	receiveEntityRecords('postType', postType, updatedRecord, undefined, true, edits);
}

export function storeTest() {
	debug.info('-?storeTest - Activated manually');
	emulateSavingPost();
}

// Internal debug helpers -----------------------------------------------------]

function debugPostStatus() {
	if(enableDebug) {
		const { isPostPublished, isPostDirty, shouldResetEdits } = entityState;
		const args = [sprintf('-#Post [%s] and editing state is {%s}',
			isPostPublished ? 'published' : 'not published',
			isPostDirty ? '!dirty' : '*clean'
		)];
		!shouldResetEdits && args.push(keys(getNonTransientEdits()));
		debug.info.apply(debug, args);
	}
}
