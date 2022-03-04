// WordPress dependencies

const { forEach, get, set, isPlainObject, isFunction, mapValues } = lodash;
const { createContext, useContext, useCallback, useReducer } = wp.element;

// Internal dependencies

import { checkDependency } from './../utils.js';
import { ajaxUpdateOptions } from './../fetch.js';

// The state update logic with the useReducer() -------------------------------]

// Context and reducer to be used for passing 'getPanel' callback down to component tree
// The identity of the 'dispatch' function from 'useReducer' is always stable!
const PanelsContext = createContext();
PanelsContext.displayName = 'ZukitPanelsContext';

export function usePanelsContext() {
	return useContext(PanelsContext);
}

function panelsReducer(panels, action) {
	switch(action.type) {
		case 'set':
			// payload -> update object { key: value, key2: value2 }
			// callback -> callback function(panels)
			// используем функцию 'set' чтобы поменять только 'value', а не весь объект
			forEach(action.payload, (value, key) => set(panels, `${key}.value`, value));
			if(isFunction(action.callback)) action.callback(panels);
			// we can't just return 'panels' with changes, we must return a new object
			return { ...panels };
		default:
			return panels;
	}
 }

// Update 'panels' atributte
// Create callback to pass down a 'dispatch' function from 'useReducer' via context
export function usePanels(initialPanels, createNotice, keys) {

	const optionsKey = get(keys, 'panels_group', '_panels');
	const [panels, dispatch] = useReducer(panelsReducer, initialPanels);

	const setPanel = useCallback(update => {

		if(!isPlainObject(update)) return;

		// forced to use the callback trick to get the current 'panels'
		// we want 'updatePanels' to be independent of changes in 'panels'
		dispatch({ type: 'set', payload: update, callback: panels =>
			// не используем функцию 'updateOptions' чтобы не вызывать не нужное обновление 'options'
			// что приведет к излишним renders - нам нужно только сохранить 'panels' в базе
			ajaxUpdateOptions(optionsKey, mapValues(panels, p => p.value), createNotice)
		});

	}, [createNotice, optionsKey]);

	const getPanel = useCallback(action => {

		if(action === undefined) action = { type: 'all' };

		switch(action.type) {
			case 'all':
				return panels;
			case 'hidden':
				return action.id !== undefined && !get(panels, `${action.id}.value`);
			case 'value':
				return get(panels, `${action.id}.value`);
			case 'title':
				return get(panels, `${action.id}.label`);
			case 'falsely':
				return !checkDependency(get(panels, action.id), action.options);
			default:
				return panels;
		}
	}, [panels]);

	return [getPanel, setPanel, PanelsContext];
}
