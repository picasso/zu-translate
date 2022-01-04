// WordPress dependencies

const _ = lodash;
const { apiFetch } = wp;

// Internal dependencies

import { messageWithError, toJSON } from './utils.js';

const cacheKey = 'cache';
const routerKey = 'router';
const restDefaults = { router: null, root: 'zukit', version: 1 };
const apiBaseURL = `/${restDefaults.root}/v${restDefaults.version}/`;

// restRouter serves to identify the plugin that currently uses the REST API,
// since all plugins inherit the same Zukit_plugin class and identification
// is required to determine which of the active plugins should respond to ajax requests.
// Therefore, we automatically add the 'router' param to all API request.
let restRouter = null;
let restBasics = restDefaults;

// Ajax actions and options update --------------------------------------------]

// Если status === 'data' просто возвращаем данные из property 'data',
// в противном случае формируем и отображаем 'Notice'
function onSuccessAjax(createNotice, request, callback = null, loading = null) {

	const actionKey = _.get(request, 'options.key');
	// const actionData = [{ className: 'zukit-data', label: actionKey }];

	return ajaxData => {
		let {
			status = 'warning',
			content,
			data = null,
			withData,
			withHTML = true,
			message,
			params,
		} = ajaxData || {};

		// mark action as 'complete'
		if(_.isFunction(loading)) loading({ [actionKey]: false });

		// Если 'notice' combined with 'data' - transform to 'real' status
		if(status !== 'data' && _.includes(status, 'data')) {
			status = status.replace('data', '');
			withData = true;
		}

		// if 'data' - pass it to callback
		if(status === 'data' || withData) {
			if(_.isFunction(callback)) callback(data);
		}

		// if 'soft' error message
		if(status === false && message) {
			status = 'error';
			content = message;
		}

		if(_.isNil(content)) {
			content = 'Unknown action';
			params = { action: actionKey };
		}

		if(status !== 'data') {
			createNotice({
				status, 									// Can be one of: success, info, warning, error
				content: messageWithError(content, params), // Text string to display
				isDismissible: true, 						// Whether the user can dismiss the notice
				// actions: params,							// Any actions the user can perform
				__unstableHTML: withHTML,
			});
		}
	};
}

function onErrorAjax(createNotice, request, loading) {

	const requestKey = _.get(request, 'options.key') || _.get(request, 'options.keys');

	return error => {
		// mark action as 'complete'
		if(_.isFunction(loading)) loading({ [requestKey]: false });

		const [message, param] = parseError(error, { action: requestKey });
		// const { message = 'Unknown error:' } = error;
		createNotice({
			status: 'error', 							// Can be one of: success, info, warning, error
			content: messageWithError(message, param), 	// Text string to display
			isDismissible: true, 						// Whether the user can dismiss the notice
			// actions: param ? [{ className: 'zukit-data', label: param }] : null,
			__unstableHTML: true,
		});
	}
}

// We are trying to find a hook based on options changes (considering cases when
// key can contain path)
function getHook(hooks, update) {

	let key = _.first(_.keys(update));
	let hook = _.get(hooks, key);
	if(_.isNil(hook)) {
		// here we check different cases when key is path (dot separated)
		if(update[key] !== null) {
			// when the whole object is updated and the hook is set to a nested property
			_.forEach(hooks || {}, (h, k) => {
				if(_.get(update, k, null) !== null)  {
					hook = h;
					key = k;
					return false;
				}
			});
		} else {
			// when an object is deleted and the hook is set to a nested property
			_.forEach(hooks || {}, (h, k) => {
				if(_.startsWith(k, key)) {
					hook = h;
					key = k;
					return false;
				}
			});
		}
	}
	return [key, hook];
}

function hookOptionsUpdate(updateValues, hooks, afterAjaxCallback) {

	const [updateKey, updateHook] = getHook(hooks, updateValues);
	if(!_.isFunction(updateHook) && !_.isFunction(afterAjaxCallback)) return _.noop;
	// const onUpdateCallback = ()
	return () => {
		if(_.isFunction(afterAjaxCallback)) afterAjaxCallback();
		if(_.isFunction(updateHook)) updateHook(updateKey, updateValues[updateKey]);
	};
}

function hookOptionsReset(options, hooks) {

	const { prev = {}, next = {} } = options || {};
	_.forEach(hooks || {}, (hook, key) => {
		// call hook only if value is changed
		if(_.isFunction(hook) && prev[key] !== next[key]) hook(key, next[key]);
	});
}

export function ajaxDoAction(params, callback, createNotice, updateLoading) {

	const { action, value = null } = _.isPlainObject(params) ? params : { action: params };
	const requestData = {
		route: 'action',
		options: {
			key: action,
			value: value,
		},
	};

	// mark action as 'loading'
	updateLoading({ [action]: true });

	postAndCatchWithOptions({ ...requestData,
		onSuccess: onSuccessAjax(createNotice, requestData, callback, updateLoading),
		onError: onErrorAjax(createNotice, requestData, updateLoading),
	});
}

export function ajaxUpdateOptions(keys, values, createNotice, updateHooks, onSuccessCallback) {

	// если 'keys' is null - значит это options reset и просто проверяем все hooks
	if(keys === null) {
		hookOptionsReset(values, updateHooks);
		return;
	}
	// если 'keys' простая строка и 'values' не содержит такого ключа - преобразовать
	// 'values' в нужную форму
	if(_.isString(keys) && !_.has(values, keys)) values = { [keys]: values };

	const requestData = {
		route: 'options',
		options: {
			// router: restRouter,
			keys,
			values,
		},
	};

	postAndCatchWithOptions({ ...requestData,
		onSuccess: hookOptionsUpdate(values, updateHooks, onSuccessCallback),
		onError: onErrorAjax(createNotice),
	});
}

// Some helpers for API fetch -------------------------------------------------]

// Если сообщение об ошибке заканчивается ": <value>", то отделяем <value> от строки
// сообщения и превращаем его в отдельный param
function parseError(error, requestKey) {
	const { message: errMessage = 'Unknown error:'} = error;
	let message = errMessage, param = requestKey;
	const match = /:\s*(.+)$/.exec(errMessage);
	if(match !== null) {
		message = errMessage.replace(match[1], '');
		param = _.isNil(param) ? match[1] : `${match[1]} [${param}]`;
	}
	return [message, param];
}

// Convert object to query string and skip "unwanted" properties
function serializeData(data, cache = false, skip = []) {

	// remove all elements with "empty" value (undefined, null)
	const obj = _.omitBy(data, _.isNil);

    // check for cacheKey in object and then remove it (skip) from serialization
    if(_.has(obj, cacheKey)) {
        cache = obj[cacheKey];
        skip.push(cacheKey);
    }

    let str = [];
    for(var p in obj) {
        if(_.has(obj, p) && !_.includes(skip, p)) {
            // process array as JSON if presented in value
            let value = _.isArray(obj[p]) ? toJSON(obj[p]) : obj[p];
            str.push(`${encodeURIComponent(p)}=${encodeURIComponent(value)}`);
        }
    }

	// Automatically add the "router" param to all API request
	if(!_.has(obj, routerKey)) str.push(`${routerKey}=${encodeURIComponent(restRouter)}`);

    if(cache) {
        let random = Math.floor(Math.random() * 1000000);
        str.push(`q=${random}`);
    }

    return str.join('&');
}

// Check URL and transform it if needed
export function requestURL(url, options, router = null, picked = [], customBaseURL = null) {

	const baseURL = customBaseURL || apiBaseURL;
    // extend url with API base
	// and remove any leading and trailing slashes
	let requestUrl = !_.startsWith(url, baseURL) ? (baseURL + url.replace(/^\\+|\\+$/g, '')) : url.replace(/\\+$/g, '');

	// add 'router' if is defined
	const optionsWithRouter = _.isNil(router) ? options : _.set({ ...options }, routerKey, router);
	// maybe pick only some keys
	const urlOptions = !_.isEmpty(picked) ? _.pick(optionsWithRouter, picked) : optionsWithRouter;

    // convert data to query string for requests without BODY
    if(!_.isEmpty(urlOptions)) requestUrl = `${requestUrl}/?${serializeData(urlOptions, urlOptions.cache)}`;

    return requestUrl;
}

function requestURLWithRoot(root, version, url, options, router = null, picked = []) {
	const apiBase = `/${root}/v${version}/`;
	return requestURL(url, options, router, picked, apiBase);
}

function requestCustomURL(url, options, router = null, picked = []) {
	const apiBase = `/${restBasics.root}/v${restBasics.version}/`;
	return requestURL(url, options, router, picked, apiBase);
}

export function setRestRouter(router) {
	restRouter = _.isString(router) ? router : (_.get(router, 'rest.router', null) || _.get(router, 'router', null));
}

export function setRestBasics(data) {
	if(_.isNil(data)) return {restBasics, restRouter};
	restRouter = _.get(data, 'rest.router', null) || _.get(data, 'router', null);
	restBasics = _.get(data, 'rest', restDefaults);
}

// create GET API Promise with Route and Options, then execute it and process results with callbacks
export function fetchAndCatchWithOptions({ route, options, picked, onSuccess, onError }) {

	apiFetch({ path: requestURL(route, options, picked) }).then(data => {
		if(_.isFunction(onSuccess)) onSuccess(data);
	}).catch(error => {
		if(_.isFunction(onError)) onError(error);
	});
}

// create POST API Promise with Route and Options, then execute it and process results with callbacks
export function postAndCatchWithOptions({ route, options, picked, onSuccess, onError, router }) {

	const method = 'POST';
	const postRouter = router || restRouter;
	const requestOptions = { ...options, router: postRouter };

	apiFetch({
		path: requestURL(route),
		method: method,
		data: !_.isEmpty(picked) ? _.pick(requestOptions, picked) : requestOptions,
	}).then(data => {
		if(_.isFunction(onSuccess)) onSuccess(data);
	}).catch(error => {
		if(_.isFunction(onError)) onError(error);
	});
}

// Subset of functions for 'zukit-blocks'
export const blocksSet = {
	serializeData,
	setRestBasics,
	requestURL: requestURLWithRoot,
	restRequestURL: requestCustomURL,
	fetchAndCatchWithOptions,
	postAndCatchWithOptions,
};
