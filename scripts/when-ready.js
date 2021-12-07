(function($) {

    // Maybe already defined?
    if($.isFunction(window.whenReady)) return;

	// Используем MutationObserver чтобы узнать о появлении нужных элементов
    var observers = [];
    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

    function whenReady(root, selector, callback) {

		function maybeReady() { checkDOM(selector, callback); }
        var rootSelector = root || window.document;

        // Watch for changes in the document
		if($(rootSelector).length) {
            var observer = new MutationObserver(maybeReady);
            observer.observe($(rootSelector)[0], {
                childList: true,
                subtree: true
            });
            observers.push(observer);
		}

        // Check if the element is currently in the DOM
        maybeReady();
    }

    function checkDOM(selector, callback) {
        // Check the DOM for elements matching a selector
        $(selector).each(function() {
            var element = this;
            // Make sure the callback isn't invoked with the same element more than once
            if (!element.ready) {
                element.ready = true;
                // Invoke the callback with the element
                callback(element);
            }
        });
    }

    // Examples ---------------------------------------------------------------]

    // whenReady(null, '.attachment-details', myFunc1);
    // whenReady('#root', '.attachment-details', myFunc2);

    // Expose `whenReady`
    window.whenReady = whenReady;

})(jQuery);
