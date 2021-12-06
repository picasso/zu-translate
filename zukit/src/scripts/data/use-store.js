// WordPress dependencies

const { isNil, isArray, isEmpty, some, reduce } = lodash;
const { useSelect, useDispatch } = wp.data;

// Internal dependencies

import { setupStore } from './generic-store.js';
import { useCoreDataGeneric, useSvgFromFileGeneric } from './core-store.js';

const emptyArray = [];

// Setup and re-export Zukit Core store ---------------------------------------]

export function setupCoreStore(router) {

	return {
		useSvgFromFile: (name, folder = 'images/') => useSvgFromFileGeneric(name, folder, router),
		useCoreData: (key, params) => useCoreDataGeneric(key, { ...params, router }),
	};
}

// re-export all named imports
export * from './core-store.js';

// Setup but do not register Zukit Options store (router needed!) -------------]

export function setupOptionsStore(router) {

	const ZUKIT_OPTIONS_STORE = `zukit/${router}`;

	const { register: registerOptionsStore } = setupStore(
		ZUKIT_OPTIONS_STORE,
		'options', { get: 'option', update: 'options' }, router,
	);

	// Get/Set/Update Options -------------------------------------------------]

	// Custom hook which returns 'option' by 'key'
	const useGetOption = (key, defaultValue = null) => {
		const { value = null } = useSelect((select) => {
			return { value: select(ZUKIT_OPTIONS_STORE).getValue(key) };
		}, []);
		return isNil(value) ? defaultValue : value;
	};

	// Custom hook that returns all the 'options' that were passed in the 'keys' array
	// if 'waitAll' is true - hook returns 'null' as long as there is at least one key with a value of 'null'
	const useGetOptions = (keys, waitAll = false) => {
		const optionKeys = isArray(keys) ? keys : emptyArray;
		const { gotOptions = null } = useSelect((select) => {
			const { getValue } = select(ZUKIT_OPTIONS_STORE);
			const reduced = reduce(optionKeys, (values, key) => {
				values[key] = isNil(key) ? null : getValue(key);
				return values;
			}, {});
			return { gotOptions: reduced };
		}, [optionKeys]);

		if(waitAll && some(gotOptions, isNil)) return null;
		// если пустой объект, то всегда возвращаем null
		return isEmpty(gotOptions) ? null : gotOptions;
	};

	// Custom hook which set 'option' by 'key'
	const useSetOption = () => {
		const { updateValues } = useDispatch(ZUKIT_OPTIONS_STORE);
		return (key, value) => updateValues({ [key]: value });
	};

	// Custom hook which update 'option' by 'key'
	const useUpdateOptions = () => {
		const { updateValues } = useDispatch(ZUKIT_OPTIONS_STORE);
		return updateValues;
	};

	return {
		registerOptionsStore,
		useGetOption,
		useGetOptions,
		useSetOption,
		useUpdateOptions,
	};
}

// Re-export all named imports for creating Custom Store ----------------------]

export * from './generic-store.js';
