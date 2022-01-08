(function($) {

    // maybe already defined?
    if(isFunction(window.whenNodeInserted)) return;

	// use MutationObserver to find out when the desired elements have mutated
    var observers = { inserted: {}, removed: {} };
    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

    function whenNode(root, selector, callback, inserted) {

		function maybeNode() { inserted ? checkInserted(selector, callback) : checkRemoved(selector, callback); }
        var rootSelector = root || window.document;

        // watch for changes in the document
		if($(rootSelector).length) {
            var observer = new MutationObserver(maybeNode);
            observer.observe($(rootSelector)[0], {
                childList: true,
                subtree: true
            });
            addObserver(observer, selector, inserted);
            // observers[selector] = observer;
		}

        // check if the element is currently in the DOM (if 'inserted' is true)
        // or was removed (if 'inserted' is false)
        maybeNode();
    }

    function whenNodeInserted(root, selector, callback) {
        whenNode(root, selector, callback, true);
    }

    function whenNodeRemoved(root, selector, callback) {
        whenNode(root, selector, callback, false);
    }


    function checkInserted(selector, callback) {
        // check DOM for elements matching a selector
        $(selector).each(function() {
            var element = this;
            // make sure the callback isn't invoked with the same element more than once
            if (!element.ready) {
                element.ready = true;
                // invoke the callback with the element
                callback(element);
            }
        });
    }

    function checkRemoved(selector, callback) {
        // check DOM when elements matching a selector are missing
        if($(selector).length === 0) {
            // invoke the callback with selector
            callback(selector);
            // disconnect observer and remove it
            removeObserver(selector, false);
        }
    }

    function isFunction(func) {
        return Object.prototype.toString.call(func) == '[object Function]';
    }

    function addObserver(observer, selector, inserted) {
        const storage = inserted ? observers.inserted : observers.removed;
        if(hasOwnProperty.call(storage, selector)) removeObserver(selector, inserted);
        storage[selector] = observer;
    }

    function removeObserver(selector, inserted) {
        const storage = inserted ? observers.inserted : observers.removed;
        const observer = storage[selector];
        if(observer) {
            observer.disconnect();
            delete storage[selector];
        }
    }

    // Examples ---------------------------------------------------------------]

    // whenNodeInserted(null, '.attachment-details', myFunc1);
    // whenNodeInserted('#root', '.attachment-details', myFunc2);
    // whenNodeRemoved(null, '.attachment-details', myFunc3);

    // expose `whenNodeInserted` and 'whenNodeRemoved'
    window.whenNodeInserted = whenNodeInserted;
    window.whenNodeRemoved = whenNodeRemoved;

})(jQuery);
