
// use MutationObserver to find out when the desired elements have mutated
const observers = { inserted: {}, removed: {} };
const MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
const doc = window.document;
const rootSeparator = '@';

function whenNode(root, selector, callback, inserted) {

    const selectorWithRoot = root ? safeSelector([root, selector]) : selector;
	function processNode() { inserted ? checkInserted(selectorWithRoot, callback) : checkRemoved(selectorWithRoot, callback); }
    const rootNode = getRootNode(root);

    // watch for changes in the document
	if(rootNode) {
        const observer = new MutationObserver(processNode);
        observer.observe(rootNode, {
            childList: true,
            subtree: true
        });
        addObserver(observer, root ? [root, selector] : selector, inserted);
	}

    // check if the element is currently in the DOM (if 'inserted' is true)
    // or was removed (if 'inserted' is false)
    processNode();
}

function whenNodeInserted(root, selector, callback) {
    whenNode(root, selector, callback, true);
}

function whenNodeRemoved(root, selector, callback) {
    whenNode(root, selector, callback, false);
}


function checkInserted(selectorWithRoot, callback) {
    const [root, selector] = splitSelector(selectorWithRoot);
    const rootNode = getRootNode(root);
    // check DOM for elements matching a selector
    rootNode.querySelectorAll(selector).forEach(function(element) {
        // make sure the callback isn't invoked with the same element more than once
        if (!element.ready) {
            element.ready = true;
            // invoke the callback with the element
            callback(element);
        }
    });
    // $(selector).each(function() {
    //     const element = this;
    //     // make sure the callback isn't invoked with the same element more than once
    //     if (!element.ready) {
    //         element.ready = true;
    //         // invoke the callback with the element
    //         callback(element);
    //     }
    // });
}

function checkRemoved(selectorWithRoot, callback) {
    const [root, selector] = splitSelector(selectorWithRoot);
    const rootNode = getRootNode(root);
    // check DOM when elements matching a selector are missing
    if(rootNode.querySelector(selector) === null) {
        // invoke the callback with selector
        callback([root, selector]);
        // disconnect observer and remove it
        removeObserver([root, selector], false);
    }
}

const hasOwnProperty = Object.prototype.hasOwnProperty;
function has(object, key) {
    return object != null && hasOwnProperty.call(object, key)
}

function getRootNode(root) {
    return root ? (doc.querySelector(root) ?? doc) : doc;
}

function safeSelector(selector) {
    return Array.isArray(selector) ? selector.join(rootSeparator) : selector;
}

function splitSelector(selector) {
    const selectors = Array.isArray(selector) ? selector : String(selector).split(rootSeparator);
    return selectors.length < 2 ? [null, selectors[0]] : selectors;
}

function addObserver(observer, fullSelector, inserted) {
    const storage = inserted ? observers.inserted : observers.removed;
    const selector = safeSelector(fullSelector);
    if(has(storage, selector)) removeObserver(selector, inserted);
    storage[selector] = observer;
}

function removeObserver(fullSelector, inserted) {
    const storage = inserted ? observers.inserted : observers.removed;
    const selector = safeSelector(fullSelector);
    const observer = storage[selector];
    if(observer) {
        observer.disconnect();
        delete storage[selector];
    }
}

function testSelector(selectorWithRoot) {
    const [root, selector] = splitSelector(selectorWithRoot);
    const rootNode = getRootNode(root);
    return rootNode.querySelector(selector) !== null;
}

// Examples -------------------------------------------------------------------]

// whenNodeInserted(null, '.attachment-details', myFunc1);
// whenNodeInserted('#root', '.attachment-details', myFunc2);
// whenNodeRemoved(null, '.attachment-details', myFunc3);

export { whenNodeInserted, whenNodeRemoved, testSelector };
