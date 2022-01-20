// WordPress dependencies

const { select } = wp.data;
const { apiFetch } = wp;

// example of using 'middleware' to emulate a request to the server
// and return the result we need
const emulateRequest = true;
const { getCurrentPost } = select('core/editor');
apiFetch.use((options, next) => {
	if(emulateRequest) {
		window.console.log('?apiFetch - emulate some kind of request');
		const data = getCurrentPost();
		// const result = next(options);
		return sendSuccessResponse({ body: data });
	}
	return next(options);
});

// helper function that sends a success response
function sendSuccessResponse(responseData) {
	return Promise.resolve(
		new window.Response(
			JSON.stringify(responseData.body),
			{
				status: 200,
				statusText: 'OK',
				headers: responseData.headers ?? {},
			}
		)
	);
}

// forEach(supportedAtts, (attr, selector) => {
// 	if(addListeners) {
// 		let value = getRaw(attr);
// 		if(value === undefined) {
// 			value = getEditedPostAttribute(`${attr}_raw`);
// 			if(attr === 'title' && value === 'Auto Draft') value = '';
// 			setRaw(attr, value);
// 			addInputListener(selector, getListener(attr));
//
// 			// 'title' does not require 'inserted hook' as it is not removed from the page
// 			// when the attribute Panel is closed
// 			if(attr !== 'title') attachInsertedHooks(attr, selector);
// 		} else {
// 			addInputListener(selector, getListener(attr));
// 			// if the language has been switched while editing blocks
// 			// then synchronize switching for newly created elements (for example, 'excerpt')
// 			// 'title' does not require synchronization as it is not removed from the page while editing blocks
// 			if(attr !== 'title') switchRawAttributes(null, attr);
// 			debug.info(`set for {${attr}} is ignored, current value = ${value}`);
// 		}
// 	} else {
// 		// with the third argument equal to false listener will be removed
// 		addInputListener(selector, getListener(attr), false);
// 	}
// });

// update RAW attributes before changing language
// (if 'onlyAtts' is not null - update RAW for these attributes only)
// export function updateRawAttributes(onlyAtts = null) {
// 	onlyAtts = onlyAtts === null ? null : castArray(onlyAtts);
// 	forEach(supportedAtts, (selector, attr) => {
// 		if(onlyAtts === null || includes(onlyAtts, attr)) {
// 			const value = getInputValue(selector);
// 			updateRaw(attr, value);
// 		}
// 	});
// }

// listeners on changes and on DOM 'insert' -----------------------------------]

// we need to pre-create listeners for each attribute,
// since we cannot use arrow function directly when adding listener - later we won't be able to remove such listener

// const listeners = {};

// forEach(supportedKeys, attr => {
// 	listeners[attr] = () => updateRawAttributes(attr);
// });

// function getListener(attr) {
// 	return listeners[attr] ?? noop;
// }


// const sidebarRoot = '.edit-post-sidebar > .components-panel';
//
// function attachInsertedHooks(attr, selector) {
// 	whenNodeInserted(sidebarRoot, selector, () => {
// 		debug.info(`-Node Inserted for {"${attr}"}`);
// 		// synchronize switching for newly created element
// 		switchRawAttributes(null, attr);
// 		// add the listener again (maybe the previous one was removed with the element or maybe not)
// 		// NOTE from Docs: if multiple identical EventListeners are registered on the same EventTarget
// 		// with the same parameters, the duplicate instances are discarded.
// 		addInputListener(selector, getListener(attr));
// 	});
// }



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
