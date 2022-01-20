// WordPress dependencies

const { keys, includes, forEach } = lodash;
const { select, dispatch } = wp.data;

// Internal dependencies

import { getExternalData, getDebug } from './../utils.js';
import { ZUTRANSLATE_STORE } from './raw-store.js';

const enableDebug = getExternalData('debug.sync_blocks', false);
const activateSync = getExternalData('sync', false);
const cleanUnsaved = getExternalData('unsaved', false);

const debug = getDebug(enableDebug);

export const rootClientId = 'rawRoot';

// Helpers for 'store' --------------------------------------------------------]

// we need to know when all changes are committed in 'Entity'
// to do this, we add a block ID to the 'watched' list before the changes
// and then remove this ID when the changes were made
// when the 'watched' list becomes empty - all changes were committed

export function getWatched() {
	return select(ZUTRANSLATE_STORE).getWatched();
}

function addWatched(id, isOriginator = false) {
	const { addWatched } = dispatch(ZUTRANSLATE_STORE);
	debug.infoWithId(id, `-+{Component Watched}${isOriginator ? ' [originator]' : ''}`);
	addWatched(id);
}

function removeWatched(id) {
	const { removeWatched } = dispatch(ZUTRANSLATE_STORE);
// удалить после тестов
	const watched = getWatched();
	if(!includes(watched, id)) debug.infoWithId(id, '-!{Repeated ID removal!}');

	debug.infoWithId(id, '-*{Component unWatched}');
	removeWatched(id);
}

function getHooks() {
	return select(ZUTRANSLATE_STORE).getHooks();
}

// Sync blocks ----------------------------------------------------------------]

// store some 'Entity' states to synchronize blocks and reset 'dirty' editing state
export const entityState = {
	isPostDirty: false,
	isPostPublished: false,
	isTracking: false,
	shouldResetEdits: false,
};

// call all registered hooks besides associated with 'clientId'
// this will lead to switching language for blocks associated with these hooks
export function syncBlocks(clientId = rootClientId) {
	notifySync('before', activateSync);
	addWatched(clientId, true);
	if(activateSync) {
		const hooks = getHooks();
		forEach(hooks, (hook, id) => {
			if(id !== clientId) {
				// always add watched ID before calling the hook, because inside the hook may be logic
				// to remove this ID from the 'watched' list
				// for example, in the language switch logic for 'non-block' attributes
				addWatched(id);
				hook();
			}
		});
	}
	notifySync('after', activateSync);
}

export function syncCompleted(id) {
	removeWatched(id ?? rootClientId);
}

function notifySync(when, isEnabled) {
	debugSync(when, isEnabled);
	const { isPostDirty, isPostPublished, shouldResetEdits } = entityState;
	if(cleanUnsaved && isPostPublished) {
		if(when === 'before' && !isPostDirty) {
			entityState.shouldResetEdits = true;
		}
		if(when === 'after' && shouldResetEdits) {
			entityState.isTracking = true;
		}
	}
}

// Internal debug helpers -----------------------------------------------------]

function debugSync(when, isSyncEnabled) {
	const { isPostDirty, isPostPublished, shouldResetEdits } = entityState;
	const published = isPostPublished ? 'published' : 'not published';
	const isBefore = when === 'before';
	const status = isPostDirty ? 'dirty' : 'clean';
	const option = isSyncEnabled ? 'enabled' : 'disabled';
	const action = `${isBefore ? '?' : '#'}{${isBefore ? 'initiated' : 'completed'}}`;
	const resetDisabled = `clean "unsaved" is ${isPostPublished ? 'disabled' : 'not possible'}`;
	const reset = cleanUnsaved && isPostPublished ? ('reset is ' + (shouldResetEdits ? '{enabled}' : '{disabled}')) : resetDisabled;
	const after = isBefore ? `, Hooks count [${keys(getHooks()).length}]` : (isPostDirty ? `, ${reset}` : '');
	const info = `-${action} Sync Blocks [sync ${option}] - Post [${published}] and is {${status}}${after}`;
	debug.info(info);
}
