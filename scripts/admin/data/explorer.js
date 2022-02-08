// WordPress dependencies

const { isEmpty, isEqual, isArray, forEach, get, set, keys, pick, merge, difference, includes } = lodash;
const { sprintf } = wp.i18n;
const { subscribe, select } = wp.data;

// Internal dependencies

import { getExternalData, getDebug } from './../utils.js';

const { isSavingPost, isEditedPostDirty, isCurrentPostPublished, getCurrentPostType, getCurrentPostId } = select('core/editor');
const { getBlocks } = select('core/block-editor');
const { getEntityRecordNonTransientEdits, getEditedEntityRecord } = select('core');

const enableDebug = getExternalData('debug.explorer', false);
const debug = getDebug(enableDebug);

// Explore changes for debug/research (green/red) -----------------------------]

const reported = {
	isDirty: null,
	blocks: null,
	edits: null,
	postSaved: true,
};

if(enableDebug) {
	initExplorer();
	runExplorer();
	watchSavingPost();
}

function initExplorer() {
	const unsubscribe = subscribe(() => {
		const postId = getCurrentPostId();
		const isDirty = isEditedPostDirty();
		if(postId && reported.blocks === null) {
			debugPostStatus(isDirty, { postId, isPublished : isCurrentPostPublished() });
			reported.isDirty = isDirty;
		}
		if(postId && isEmpty(reported.blocks)) {
			reported.blocks = getBlocks();
			if(!isEmpty(reported.blocks)) {
				const { edits } = getEdits();
				reported.edits = edits;
				unsubscribe();
			}
		}
	});
}

function runExplorer() {
	subscribe(() => {
		if(isEditedPostDirty()) {
			let dirtyData = {};
			const newBlocks = getBlocks();
			if(reported.blocks !== newBlocks) {
				const changes = {};
				forEach(newBlocks, (next, index) => {
					const prev = reported.blocks[index];
					if(next !== prev) {
						const changed = changedKeys(next, prev);
						if(includes(changed.updated, 'attributes')) {
							const updateAtts = changedKeys(next.attributes, prev.attributes);
							const pickAtts = [...updateAtts.updated, ...updateAtts.added, ...updateAtts.removed];
							changes[next.clientId] = {
								name: next.name,
								changed,
								attributes: updateAtts,
								picked: pickAtts,
								was: pick(prev.attributes, pickAtts),
								now: pick(next.attributes, pickAtts),
							};
						} else {
							changes[next.clientId] = {
								name: next.name,
								changed,
							};
						}
					}
				});
				dirtyData.blocks = changes;
				reported.blocks = newBlocks;
			}
			const { edits, entity } = getEdits();
			const msissingAtts = difference(reported.edits, edits);
			if(!isEqual(reported.edits, edits)) {
				forEach(merge({}, edits, msissingAtts), attr => {
					// 'content' has already been processed in the 'blocks' loop
					if(attr !== 'content') set(dirtyData, ['edits', attr], entity[attr] ?? '?');
				});
				reported.edits = edits;
			}
			if(!isEmpty(dirtyData)) debugPostStatus(true, dirtyData);
			reported.isDirty = true;
		} else if(reported.isDirty) {
			reported.isDirty = false;
			debugPostStatus(false, { postId: getCurrentPostId(), isPublished : isCurrentPostPublished() });
		}
	});
}

function watchSavingPost() {
	subscribe(() => {
		if(reported.postSaved && isSavingPost()) {
			reported.postSaved = false;
			debug.logGroup('{+Saving Post...}', getEdits());
		} else if(!reported.postSaved) {
            debug.info('{*Post Saved}');
            reported.postSaved = true;
		}
	});
}

// Internal debug helpers -----------------------------------------------------]

function getEdits(name = null, recordId = null) {
	const postType = name ?? getCurrentPostType();
	const postId = recordId ?? getCurrentPostId();
	return {
		edits: keys(getEntityRecordNonTransientEdits('postType', postType, postId)),
		entity: getEditedEntityRecord('postType', postType, postId),
	};
}

function changedKeys(next, prev) {
    const updated = [];
    forEach(next, (val, key) => {
        if(prev && prev[key] !== val) {
            updated.push(key);
        }
    });
    const nextKeys = keys(next);
    const prevKeys = keys(prev);
    const added = difference(nextKeys, prevKeys);
    const removed = difference(prevKeys, nextKeys);
    return {
		// 'added' keys will also be included in 'updated', so we exclude them
		updated: difference(updated, added),
		added,
		removed,
	};
}

function debugPostStatus(isDirty, params) {
	if(enableDebug) {
		const { isPublished, postId, blocks, edits } = params;
		if(postId) {
			debug.info(sprintf('-%sPost #%d [%s] and editing state is {%s}',
				isDirty ? '!' : '*',
				postId,
				isPublished ? 'published' : 'not published',
				isDirty ? 'dirty' : 'clean'
			));
		} else {
			const changedAtts = keys(edits);
			const changedBlocks = keys(blocks);
			if(changedAtts.length || changedBlocks.length) {
				debug.logGroup(`!Post is {dirty} - {?see details}`);
			}
			forEach(edits, (value, key) => {
				const id = `+${key}`;
				debugChanged(id, 'entity', 'updated', value, true);
			});
			forEach(blocks, (value, key) => {
				const { name, changed, attributes, picked, was, now } = value;
				let id = `+${name} : ${debug.shortenId(key)}`;
				id = debugChanged(id, 'props', 'updated', changed);
				id = debugChanged(id, 'props', 'added', changed);
				id = debugChanged(id, 'props', 'removed', changed);
				if(attributes) {
					debugChanged(id, 'attributes', 'updated', attributes);
					debugChanged(id, 'attributes', 'added', attributes);
					debugChanged(id, 'attributes', 'removed', attributes);
					if(was || now) debugWasNow(id, picked, was, now);
				}
			});
			debug.logGroup('<');
		}
	}
}

function debugChanged(id, name, key, value, logEmptyValues = false) {
	const data = get(value, key, value);
	if(!isEmpty(data) || logEmptyValues) {
		debug.logGroup(id, sprintf('%s %s [%s]', key, name, isArray(data) ? data.join(', ') : data || '""'));
		return id.startsWith('-') ? id : id.replace(/^[+]/, '-');
	}
	return id;
}

function debugWasNow(id, atts, was, now) {
	const isSingleKey = atts.length === 1;
    const key = isSingleKey ? atts[0] : atts.join(', ');
	if(isSingleKey) {
		debug.logGroup(id, [`[${key}]`, '  {+was}  ', was[key], '  {*now}  ', now[key]]);
	} else {
		debug.logGroup(id, [`[${key}]`, '  {+values were}  ', was]);
		debug.logGroup(id, [`[${key}]`, '  {*values are now}  ', now]);
	}
}
