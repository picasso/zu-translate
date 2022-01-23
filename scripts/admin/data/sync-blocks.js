// WordPress dependencies

const { keys, forEach, includes } = lodash;
const { sprintf } = wp.i18n;
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
	debug.infoWithId(id, `-#{+Component Watched}${isOriginator ? ' [originator]' : ''}`);
	addWatched(id);
}

function removeWatched(id) {
	const { removeWatched } = dispatch(ZUTRANSLATE_STORE);
	const count = getWatched().length - 1;
	debug.infoWithId(id, `-${count < 0 ? '!' : '#'}{*Component will be unWatched}, remained in the list [${count}]`);
	removeWatched(id);
}

function getHooks() {
	return select(ZUTRANSLATE_STORE).getHooks();
}

function refreshStore() {
	return dispatch(ZUTRANSLATE_STORE).refresh();
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
export function syncBlocks(clientId = rootClientId, withoutOriginator = false) {
	notifySync('before', activateSync, withoutOriginator);
	// a special case when we need to synchronize blocks when initialized
	// in this situation, the 'rootClientId' is not added to the 'watched' list
	if(!withoutOriginator) addWatched(clientId, true);
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

export function syncCompleted(id = rootClientId) {
	const watched = getWatched();
	if(includes(watched, id)) removeWatched(id);
	else refreshStore();
}

function notifySync(when, isEnabled = false, withoutOriginator = false) {
	const { isPostDirty, isPostPublished, shouldResetEdits } = entityState;
	if(cleanUnsaved && isPostPublished) {
		if(when === 'before' && !isPostDirty) {
			entityState.shouldResetEdits = true;
		}
		if(when === 'after' && shouldResetEdits) {
			entityState.isTracking = true;
		}
	}
	debugSync(when, isEnabled, withoutOriginator);
}

// Internal debug helpers -----------------------------------------------------]

function debugSync(when, isSyncEnabled, mode) {
	const { isPostDirty, isPostPublished, isTracking, shouldResetEdits } = entityState;
	const isBefore = when === 'before';
	const isDisabled = !(cleanUnsaved && isPostPublished);
	const resetNote = sprintf('reset is {%s}', isTracking ? (shouldResetEdits ? 'enabled' : 'disabled') : 'not tracked');
	const disableNote = sprintf('clean "unsaved" is {%s}', isPostPublished ? 'disabled' : 'not possible');
	const info = sprintf('-%1$s{%2$s} Sync Blocks [sync %3$s%4$s] - Post [%5$s] and is {%6$s}%7$s%8$s',
		'#',															// 1 isBefore ? '?' :
		isBefore ? '?initiated' : '*completed',											// 2
		isSyncEnabled ? 'enabled' : (mode ? 'single mode' : 'disabled'),				// 3
		mode ? ', without originator' : '',												// 4
		isPostPublished ? 'published' : 'not published',								// 5
		isPostDirty ? '!dirty' : '*clean',												// 6
		isBefore ? `, "Watched" count [${keys(getWatched()).length}]` : '',				// 7
		!isBefore && isPostDirty ? `, ${isDisabled ? disableNote : resetNote }` : '',	// 8
	);
	debug.info(info);
}
