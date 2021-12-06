// WordPress dependencies
// https://developer.wordpress.org/block-editor/packages/packages-data/

const { keys, get, defaults } = lodash;
const { registerStore } = wp.data;
const { apiFetch } = wp;

// Internal dependencies

import { requestURL } from './../fetch.js';
export { requestURL };

export const TYPES = {
    GET_VALUE: 'GET_VALUE',
    SET_VALUE: 'SET_VALUE',
    UPDATE_VALUES: 'UPDATE_VALUES',
}

// An empty object indicates that no value was found for option,
// or something went wrong during the option update
export const isNull = val => Object.keys(val).length === 0 && val.constructor === Object;

function getReadOnlyActions() {
    return {
        getValue(path) {
            return {
                type: TYPES.GET_VALUE,
                path,
            };
        },
        setValue(key, value, params = {}) {
            return {
                type: TYPES.SET_VALUE,
                key,
                value,
                ...params,
            };
        },
    };
}

export function getActions(route, router, fetchKey) {
    const readOnly = getReadOnlyActions();
    const updateParams = fetchKey ? { key: fetchKey } : {};
    return {
        ...readOnly,
        * updateValues(values) {
            const path = requestURL(route);
            const data = { ...updateParams, router, keys: keys(values), values: values };
            const result = yield apiFetch({ path, method: 'POST', data });

            return isNull(result) ? undefined : {
                type: TYPES.UPDATE_VALUES,
                values,
            };
        },
    };
}

export function defaultGetter(state, stateKey, valueKey) {
    return get(state, [stateKey, valueKey]);
}

export function getSelectors(stateKey, getter) {
    return {
        getValue(state, key, params = {}) {
            return getter(state, stateKey, key, params);
        },
    };
}

export function getControls() {
    return {
        GET_VALUE(action) {
            return apiFetch({ path: action.path });
        },
    };
}

export function getResolvers(route, router, actions, fetchKey) {
    return {
        * getValue(key, params = {}) {
            const requestKey = { key: fetchKey || key };
            const path = requestURL(route, { ...requestKey, ...params }, router);
            const value = yield actions.getValue(path);
            return actions.setValue(key, isNull(value) ? undefined : value, params);
        },
    };
}

export function defaultMerger(prevState, stateKey, action) {
    return {
        ...prevState,
        [stateKey]: {
            ...prevState[stateKey],
            [action.key]: action.value,
        },
    };
}

function getReducer(stateKey, initialState, merger) {

    return (state = initialState, action) => {

        switch(action.type) {
            case TYPES.SET_VALUE: return merger(state, stateKey, action);

            case TYPES.UPDATE_VALUES: return {
                ...state,
                [stateKey]: {
                    ...state[stateKey],
                    ...action.values,
                },
            };
        }
        return state;
    };
}

export function setupStore(params) {
    const storeParams = defaults({}, params, {
        name: null,
        stateKey: 'data',
        routes: {
            get: 'cuget',
            update: 'cuset',
        },
        router: null,
        fetchKey: null,     // used only for custom stores
        withSetters: true,
        withoutResolvers: false,
        initialState: null,
        merger: defaultMerger,
        getter: defaultGetter,

        reducer: null,
        actions: null,
        selectors: null,
        controls: null,
    });

    const { name, stateKey, routes, router, fetchKey } = storeParams;

    const initialState = storeParams.initialState || { [stateKey]: {}, };
    const getRoute = get(routes, 'get', routes);
    const updateRoute = get(routes, 'update', routes);
    const actions = storeParams.withSetters ? getActions(updateRoute, router, fetchKey) : getReadOnlyActions();

    return {
        register: () => registerStore(name, {
            reducer: storeParams.reducer || getReducer(stateKey, initialState, storeParams.merger),
            actions: storeParams.actions || actions,
            selectors: storeParams.selectors || getSelectors(stateKey, storeParams.getter),
            controls: storeParams.controls || getControls(),
            resolvers: storeParams.withoutResolvers ? undefined : getResolvers(getRoute, router, actions, fetchKey),
        }),
    };
}
