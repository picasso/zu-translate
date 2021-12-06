// WordPress dependencies

const { isArray, isPlainObject, isNil, forEach } = lodash;
const $ = jQuery;

//-----------------------------------------------------------------------------]
// Remove element classes with wildcard matching. Optionally add classes:
//     $( '#foo' ).alterClass( 'foo-* bar-*', 'foobar' )
//
//  Copyright (c) 2011 Pete Boere (https://gist.github.com/peteboere/1517285)
//
$.fn.alterClass = function (removals, additions) {

	var self = this;

	if (!removals || removals.indexOf('*') === -1) {
		// Use native jQuery methods if there is no wildcard matching
		self.removeClass(removals);
		return !additions ? self : self.addClass(additions);
	}

	var patt = new RegExp( '\\s' +
			removals.
				replace( /\*/g, '[A-Za-z0-9-_]+' ).
				split( ' ' ).
				join( '\\s|\\s' ) +
			'\\s', 'g' );

	self.each(function (_i, it) {
		var cn = ' ' + it.className + ' ';
		while ( patt.test( cn ) ) {
			cn = cn.replace(patt, ' ');
		}
		it.className = $.trim(cn);
	});

	return !additions ? self : self.addClass(additions);
};

export function toggleBodyClass(className, state) {
	$('body').toggleClass(className, state);
}

export function alterClassWithClientId(clientId, selector, removals, additions) {
	$(`#block-${clientId} ${selector}`).alterClass(removals, additions);
}

// if we just have a pair of 'name' and 'value' and if 'value' === undefined then remove the attribute,
// otherwise, set it to the given 'value'
// if 'name' is an array - remove all attributes with names from the array
// if 'name' is an object - do 'forEach' for each property and process it
// as a simple pair of 'name' and 'value'
export function attrWithClientId(clientId, name, value, selector = '') {
	const $el = $(`#block-${clientId} ${selector}`);
	if($el.length) {
		const processAttr = (val, key) => val === undefined ? $el.removeAttr(key) : $el.attr(key, val);
		if(isArray(name)) {
			forEach(name, val => $el.removeAttr(val));
		} else if(isPlainObject(name)) {
			forEach(name, processAttr);
		} else {
			processAttr(value, name);
		}
	}
}

// similar to the previous description
export function cssWithClientId(clientId, name, value, selector = '') {
	const $el = $(`#block-${clientId} ${selector}`);
	if($el.length) {
		const processCss = (val, key) => val === undefined ? $el.css(key, '') : $el.css(key, val);
		if(isArray(name)) {
			forEach(name, val => $el.css(val, ''));
		} else if(isPlainObject(name)) {
			forEach(name, processCss);
		} else {
			processCss(value, name);
		}
	}
}

export function setInputAndFocus(parent, value = '', selector = 'input') {
	$(parent).find(selector).val(value).focus();
}

export function clickButton(parent, selector = 'button') {
	$(parent).find(selector).click();
}

export function setAttr(parent, selector, attributes) {
	$(parent).find(selector).attr(attributes);
}

export function hasSelector(parent, selector) {
	return $(parent).has(selector).length > 0;
}

// Creates a function to observe the DOM mutation and attaches callback to it
export function createMutationObserver(callback) {

	const MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
	const observer = new MutationObserver(callback);

	return observer;
}

// Finds an element by 'selector' and start observing it for the events of mutation.
// By default observed only 'childList' and its 'subtree'. If en element was not found
// then 'disconnect' observer.
export function observeMutation(selector, observer) {

	const $node = $(selector);
	if($node.length === 0 || isNil(observer)) {
		observer && observer.disconnect();
		return;
	}

	observer.observe($node[0], {
		childList: true,
		subtree: true,
		attributes: false,
		characterData: false,
	});
}
