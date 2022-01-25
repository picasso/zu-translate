// WordPress dependencies

const { isArray, isPlainObject, isNil, isNaN, forEach, includes, trim } = lodash;
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

	var patt = new RegExp('\\s' +
			removals.
				replace( /\*/g, '[A-Za-z0-9-_]+' ).
				split( ' ' ).
				join( '\\s|\\s' ) +
			'\\s', 'g');

	self.each(function (_i, it) {
		var cn = ' ' + it.className + ' ';
		while(patt.test(cn)) {
			cn = cn.replace(patt, ' ');
		}
		it.className = trim(cn);
	});

	return !additions ? self : self.addClass(additions);
};

export function toggleBodyClass(className, state) {
	$('body').toggleClass(className, state);
}

export function alterClassWithClientId(clientId, selector, removals, additions) {
	$(`#block-${clientId} ${selector}`).alterClass(removals, additions);
}

export function findWithClientId(clientId, selector = '') {
	const $el = $(`#block-${clientId}`).find(selector);
	return $el.length ? $el : null;
}

// if we just have a pair of 'prop' and 'value' and if 'value' === undefined then remove the attribute,
// otherwise, set it to the given 'value'
// if 'prop' is an array - remove all attributes with props from the array
// if 'prop' is an object - do 'forEach' for each property and process it
// as a simple pair of 'prop' and 'value'
export function attrWithClientId(clientId, prop, value, selector = '') {
	const $el = $(`#block-${clientId} ${selector}`);
	if($el.length) {
		const processAttr = (val, key) => val === undefined ? $el.removeAttr(key) : $el.attr(key, val);
		if(isArray(prop)) {
			forEach(prop, val => $el.removeAttr(val));
		} else if(isPlainObject(prop)) {
			forEach(prop, processAttr);
		} else {
			processAttr(value, prop);
		}
	}
}

// get the attribute and try to convert it to an Integer (if requested)
export function getAttrWithClientId(clientId, prop, selector = '', castInt = true) {
	const $el = $(`#block-${clientId} ${selector}`);
	if($el.length) {
		const attrValue = $el.attr(prop);
		if(castInt) {
			const intValue = parseInt(attrValue, 10);
			return isNaN(intValue) ? 0 : intValue;
		}
		return attrValue;
	}
	return null;
}

// similar to the previous description
export function cssWithClientId(clientId, prop, value, selector = '') {
	const $el = $(`#block-${clientId} ${selector}`);
	if($el.length) {
		const processCss = (val, key) => val === undefined ? $el.css(key, '') : $el.css(key, val);
		if(isArray(prop)) {
			forEach(prop, val => $el.css(val, ''));
		} else if(isPlainObject(prop)) {
			forEach(prop, processCss);
		} else {
			processCss(value, prop);
		}
	}
}

// get the CSS value and try to convert it to an Integer (if requested)
export function getCssWithClientId(clientId, prop, selector = '', castInt = true) {
	const $el = $(`#block-${clientId} ${selector}`);
	if($el.length) {
		const cssValue = $el.css(prop);
		if(castInt) {
			const intValue = parseInt(cssValue, 10);
			return isNaN(intValue) ? 0 : intValue;
		}
		return cssValue;
	}
	return null;
}

const availableSizes = ['width', 'height', 'innerWidth', 'innerHeight', 'outerWidth', 'outerHeight'];
export function sizeWithClientId(clientId, size, selector = '') {
	if(!includes(availableSizes, size)) return null;
	const $el = $(`#block-${clientId} ${selector}`);
	return $el.length ? $el[size]() : null;
}

export function setInputAndFocus(parent, value = '', selector = 'input') {
	$(parent).find(selector).val(value).trigger('focus');
}

export function clickButton(parent, selector = 'button') {
	$(parent).find(selector).trigger('click');
}

export function setAttr(parent, selector, attributes) {
	$(parent).find(selector).attr(attributes);
}

export function hasSelector(parent, selector) {
	return $(parent).has(selector).length > 0;
}

// Scroll back to the top of scrollable div (by default 'skeleton__content' of Settings Page)
export function scrollTop(selector = '.block-editor-editor-skeleton__content') {
	document.querySelector(selector).scrollTo({ top: 0, behavior: 'smooth' });
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

// Input/Textarea manipulations (compatible with React)------------------------]

export const input = {
	get(selector) {
		return document.querySelector(selector)?.value ?? null;
	},
	set(selector, value, textarea = false) {
		const el = document.querySelector(selector);
		if(el) {
			const prototype = textarea ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
			const nativeInputValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set;
			nativeInputValueSetter.call(el, value);
			const ev = new Event('input', { bubbles: true});
			el.dispatchEvent(ev);
		}
	},
	addListener(selector, callback, addListener = true) {
		const el = document.querySelector(selector);
		// React chose to make 'onChange' behave like 'onInput' does
		// it does fire when there's a change, just not until the input also loses focus
		// that's why we are adding a listener to the 'input' event and not to the 'change' event
		if(el) {
			if(addListener) el.addEventListener('input', callback);
			else el.removeEventListener('input', callback);
		}
	},
	removeListener(selector, callback) {
		this.addListener(selector, callback, false);
	},
}
