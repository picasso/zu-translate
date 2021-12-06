// WordPress dependencies

const { forEach, set, unset, isPlainObject, isFunction, keys, castArray, reduce } = lodash;
const { useCallback, useReducer, useRef } = wp.element;

// Internal dependencies

import { ajaxUpdateOptions } from './../fetch.js';

// The state update logic with the useReducer() -------------------------------]

function optionsReducer(options, action) {
	switch(action.type) {
		case 'set':
			// payload -> update object { key: value, key2: value2 }
			// use the 'set' instead of a simple assignment, because 'key' can be 'path'
			// if 'value' is 'null' then we remove the property at 'path' of object
			forEach(action.payload, (val, key) => val === null ? unset(options, key) : set(options, key, val));
			// we can't just return 'options' with changes, we must return a new object
			return { ...options };
		case 'pre-reset':
			// payload -> callback function
			if(isFunction(action.payload)) action.payload(options);
			return options;
		case 'reset':
			// payload -> new options object
			return action.payload;
		default:
			return options;
	}
 }

// Update 'options' atributte
// Create callback to pass down a 'dispatch' function from 'useReducer' via context
export function useOptions(initialOptions, createNotice) {

	const [options, dispatch] = useReducer(optionsReducer, initialOptions);
	const hooks = useRef(null);

	const updateOptions = useCallback((update, reset = false, afterUpdateCallback = null) => {

		if(!isPlainObject(update)) return;

		if(reset) {
			// forced to use the callback trick to get the current 'options'
			dispatch({ type: 'pre-reset', payload: prevOptions => {
				ajaxUpdateOptions(null, { 
					prev: prevOptions,
					next: update
				}, null, hooks.current, afterUpdateCallback);
				dispatch({ type: 'reset', payload: update });
			} });
		} else {
			ajaxUpdateOptions(keys(update), update, createNotice, hooks.current, afterUpdateCallback);
			dispatch({ type: 'set', payload: update });
		}
	}, [createNotice]);

	const setUpdateHook = useCallback((key, callback) => {
		var keys = castArray(key);
		// create object for all keys {key: callback}
		var callbacks = reduce(keys, (acc, val) => (acc[val] = callback, acc), {});
		hooks.current = { ...(hooks.current || {}), ...callbacks };
	}, []);

	return [options, updateOptions, setUpdateHook];
}
