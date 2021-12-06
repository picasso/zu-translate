// WordPress dependencies

const _ = lodash;
const { useEffect } = wp.element;

import zuPackage from './../../../package.json';

// log levels (but errors are always shown!):
//
//      'short' || 1                - only milestone messages & warn (without data and annoying handlers)
//      'default' || 'normal' || 2  - all messages & warn (but without data)
//      'verbose' || 'full' || 3    - all messages & their data
//      'none' || 0                 - only errors

// Examples of using:
//
//      * * * all data will be cloned before output to avoid reacting to subsequent changes * * *
//
//      Zubug.data({images, action})    - output data (name: value)
//      Zubug.info('text', {id, links}) - output data with text label
//      Zubug.useTraceUpdate(props)     - trace the changes of the props
//      Zubug.useTraceWithId(props);    - trace the changes of the props when there is 'clientId' among the props
//      Zubug.akaMount()                - output information when a component has been mounted or unmounted
//      Zubug.renderWithId(clientId)    - output information when the component was rendered
//      Zubug.log(message, ...data)     - output message wit data
//
// Ajax helpers:
//      Zubug.request(route, options)   - output Ajax request information
//      Zubug.response(route, data)     - output Ajax response information

// Модификаторы цвета и шрифта (первый символ сообщения для log() и info()):
//      '!' - console.info, bold, '#cc0096'
//      '?' - bold, '#ff2020'
//      '>' - начать группу
//      '#' - bold, '#ffffff' на фоне '#e50039' в окружении ★★★

// some internal vars
let config = {
    version: zuPackage.version || 'unknown',
    level: 'default',
    simplify: true,         // когда установлено, то пытается упростить вывод
                            //  - например, заменяет вывод массива с одним элементом на
                            // на вывод element[0] как объекта и т.д.
    mods: {
        ignoreNext: false,  // do not output next error
        consoleDir: false,  // use console.dir to output values
        forseNil: false,    // forse output even value is null or undefined
    },
    colors: {
        same: false,
        trace: false,
        info: false,
        data: false,
        render: false,
        use: false,
    },
    timing: false,
};


let dcolors = {

    basic: '#a79635',
    name: '#e56a17',

    render: '#1f993f',
    use: '#0091ff',
    info: '#0070c9',
    data: '#a79635',
    trace: '#e50039',

    attn: '#cc0096',
    _data: '#00b3b0',

    white: '#ffffff',
    grey: '#cccccc',
    bright: '#ffd580',



    menu: '#00b3b0',
    player: '#0070c9',
    keypoint1: '#008000',
    keypoint2: '#c00000',
    handler: '#8600b3',
    framework: '#e50039',
    maybe: '#ff2020',

    ajaxInit: ['#444', '#8600b3', '#ffdf80'],
    ajaxResponse: ['#444', '#8600b3', '#DAFFCC'],
    ajaxError: ['#c00000', '#8600b3', '#ff9999'],

    // ajaxBg1: '#ffdf80',
    // ajaxBg2: '#DAFFCC',
    // ajaxBg3: '#ff9999',
    // ajaxColor1: '#444',
    // ajaxColor2: '#000'
};

function logLevel(newLevel = '') {

    if(newLevel) {
        if(_.includes(['short', 1], newLevel)) config.level = 1;
        else if(_.includes(['default', 'normal', 2], newLevel)) config.level = 2;
        else if(_.includes(['verbose', 'full', 3], newLevel)) config.level = 3;
        else if(_.includes(['none', 0], newLevel)) config.level = 0;
    }

    return config.level;
}

function canIlog(message, isData = false) {

    let permission = /level defaults|ready\(\)/ig.test(message) && config.level == 1 ? false : true;
    permission = isData ? (config.level < 3 ? false : true) : permission;
    return config.level == 0 ? false : permission;
}

function color_by(message) {

    let color = dcolors.basic;

    // first test with var names
    if(config.colors.info) return dcolors.info;
    if(config.colors.data) return dcolors.data;
    if(config.colors.trace) return dcolors.trace;
    if(config.colors.render) return dcolors.render;
    if(config.colors.use) return dcolors.use;

    // remove any var names which may lead to false-positive test
    message = message.replace(/\[[^\]]+\]/,'').replace(/"[^"]+"/g, '');

    if(/token|logout|user/ig.test(message)) return /unsuccessful|error/ig.test(message) ? dcolors.keypoint2 : dcolors.keypoint1;
    if(/unsuccessfully|preloading/ig.test(message)) return dcolors.basic;

    if(/loading|launching|ajax/ig.test(message)) return dcolors.framework;

    return color;
}

function maybeForce(message) {
    return _.endsWith(message, '!') || _.endsWith(message, '?');
}

/* eslint-disable no-console */
function logMaybeNode(node) {
    if(_.isFunction(node)) return;
    const cloned = cloneValue(node);
    node instanceof Node ? console.dirxml(node) : (node instanceof Error ? console.log(node) : console.dir(cloned));
}

function logWithColors(messages, messageColors,  ...data) {

    let [message1, message2 = '', message3 = ''] = messages;
    let [color1, color2 = '', background = null] = messageColors;
    let func = config.colors.info ? console.info : console.log;
    let groupFunc = false;

    // if starts with '>' - then make it as collapsed group
    if(message1.startsWith('>')) {
        message1 = message1.replace(/^>/, '');
        func = console.groupCollapsed;
        groupFunc = true;
    }

    if(message1.startsWith('?')) color1 = dcolors.maybe;
    if(message1.startsWith('!')) color1 = /application|framework/ig.test(message1) ? dcolors.framework : dcolors.attn;

    // special colors for selected messages
    if(message1.startsWith('#')) {
        background = dcolors.framework;
        color2 = dcolors.bright;
        color1 = dcolors.white;
    }

    // if var color is the same as the message color
    if(config.colors.same) color2 = color1;

    let colors1 = background ?
        `font-weight: normal; padding: 3px 0 3px 3px; background: ${background}; color: ${color1}`
        : `font-weight: normal; color: ${color1}`;
    let colors2 = background ?
        `font-weight: bold; padding: 3px 0 3px 3px; background: ${background}; color: ${color2}`
        : `font-weight: bold; color: ${color2}`;
    let colors3 = background ?
        `font-weight: normal; padding: 3px 10px 3px 0; background: ${background}; color: ${color1}`
        : `font-weight: normal; color: ${color1}`;

    message1 = background ? message1.trim() : message1;
    message2 = background ? message2.trim() : message2;
    message3 = background ? message3.trim() : message3;

    // if starts with '!' - then make it BOLD and change console function
    if(message1.startsWith('!')) {
        message1 = message1.replace(/^!/, '');
        colors1 = colors1.replace('normal', 'bold');
        colors3 = colors3.replace('normal', 'bold');
        func = groupFunc ? console.groupCollapsed : console.info;
    }
    // if starts with '?' - then make it BOLD
    if(message1.startsWith('?')) {
        message1 = message1.replace(/^\?/, '');
        colors1 = colors1.replace('normal', 'bold');
        colors3 = colors3.replace('normal', 'bold');
    }
    // if starts with '#' - then make it BOLD
    if(message1.startsWith('#')) {
        message1 = message1.replace(/^#/, ' ★★★ ').replace(/[.]+$/, '');
        colors1 = colors1.replace('normal', 'bold');
        colors3 = colors3.replace('normal', 'bold');
        if(!message2) message1 += ' ★★★ ';
        else if(message3) message3 += ' ★★★ ';
    }

    const [firstData, ...rest] = data;
    if(config.mods.forseNil || firstData !== undefined) {
        if(config.mods.consoleDir) {
            if(message2 && color2) func(
                '%c%s%c%s%c%s%c',
                colors1,
                message1,
                colors2,
                message2,
                colors1,
                message3,
                background ? colors3 : ''
            );
            else func('%c%s ', colors1, message1);
            console.dir(firstData, ...rest);
        } else {
            if(message2 && color2) func(
                '%c%s%c%s%c%s%c',
                colors1,
                message1,
                colors2, message2,
                colors1,
                message3,
                background ? colors3 : '',
                firstData,
                ...rest
            );
            else func('%c%s ', colors1, message1, firstData, ...rest);
        }
    } else {
        if(message2 && color2) func(
            '%c%s%c%s%c%s%c',
            colors1,
            message1,
            colors2,
            message2,
            colors1,
            message3,
            background ? colors3 : ''
        );
        else func('%c%s ', colors1, message1);
    }

    // reset all modifiers
    config.colors = _.mapValues(config.colors, () => false);
    config.mods = _.mapValues(config.mods, () => false);
}

function log(message, ...data) {

    if(!canIlog(message)) return;

    let loglevel = logLevel();

    if(loglevel == 0) return;

    if(message) {
        message = message.trim();

        let colors = [ color_by(message),  dcolors.name, null ];
        let param_regex = /\[\s*([^\]]+)]/i;
        // let color2 = /loading =|ver /ig.test(message) ? dcolors.navigate : dcolors.name;

        if(param_regex.test(message)) {
            let matches = param_regex.exec(message);

            if(/ajax\s*\w*\s*request/ig.test(message)) colors = dcolors.ajaxInit;
            else if(/ajax\s*\w*\s*response/ig.test(message)) colors = dcolors.ajaxResponse;
            else if(/ajax\s*\w*\s*error/ig.test(message)) colors = dcolors.ajaxError;

            const messages = [message.replace(matches[0], '[ '), matches[1], ' ]'];
            logWithColors(messages, colors, ...data);
        } else {
            logWithColors([message], colors, ...data);
        }
    }
}

function logVerbose(message, data, more) {
    if(logLevel() == 3) log(message, data, more);
}

function logGroup(obj, groupName = '', withoutNil = false, verboseOnly = false) {

    if(verboseOnly && logLevel() < 2) {
        console.groupEnd();
        return;
    }

    let closeMore = false;
    if(groupName && _.isPlainObject(obj)) {
        console.groupCollapsed(
            '%c%s',
            `font-weight: bold; color: ${dcolors.name}; padding: 3px;`,
            groupName.trim()
        );
        closeMore = true;
    }

    for(let key in obj) {
        if(withoutNil && _.isNil(obj[key])) continue; // › »
        let keyName = groupName && _.isArray(obj) ? `${groupName}[${key}]` : key;
        if(_.isFunction(obj[key])) {
            console.dir(obj);
            break;
        } else console.log(
            '%c%s%c ⇢ %o',
            `font-weight: bold; color: ${dcolors.name}`,
            keyName,
            `font-weight: normal; color: ${dcolors.navigate}`,
            obj[key]
        );
    }

    console.groupEnd();
    if(closeMore) console.groupEnd();

    // reset all modifiers
    config.colors = _.mapValues(config.colors, () => false);
    config.mods = _.mapValues(config.mods, () => false);
}

function warn(message, data, more) {

    if(logLevel() == 0) return;
    if(!canIlog(message)) return;

    if(message) {
        console.warn(message.replace(/^[!|?]/, ''));
        if(data && maybeForce(message) && logLevel() == 1) logMaybeNode(data);
    }

    if(!_.isUndefined(data) && canIlog(message, true)) logMaybeNode(data);
    if(!_.isUndefined(more) && canIlog(message, true)) logMaybeNode(more);

    if(canIlog(message, true)) {
        console.trace();
    }
}

function error(message, data) {

    // ignore errors when requested
    if(config.mods.ignoreNext) return;

    if(_.isUndefined(data)) console.error(message);
    else {
        console.error(message);
        console.info('Error data:', data);
    }
}
/* eslint-enable no-console */

function simplify(name, value, root = true) {

    if(!config.simplify) return [name, value];

    // if it's an array and there is only one element in it
    // then output the value of this element instead of the array
    if(_.isArray(value) && value.length === 1) {
        const simpleValue = [`${name} ⇢ ${name}[0]`, value[0]];
        return root ? [name, simpleValue] : simpleValue;
    }

    // if it's a root (first call) and it's an object and contains only arrays
    // then run again the 'simplify()' for each array in the object
    if(root && _.isObjectLike(value) && !_.isEmpty(value) && _.every(value, _.isArray)) {
        return [name, _.reduce(value, (result, v,k) => {
            const [key, val] = simplify(k, v, false);
            if(key) result.push(key);
            result.push(val);
            return result;
        }, [])];
    }

    // if it's a root (first call) and it's an object and it has only one property
    // then output the value of this property instead of the object
    if(root && _.isPlainObject(value) && _.keys(value).length === 1) {
        const [keyName] = _.keys(value);
        const simpleValue = [`${name}.${keyName}`, value[keyName]];
        return [name, simpleValue];
    }

    return [name, value];
}

// Debugging in components ----------------------------------------------------]

function cloneValue(value) {

    // do nothing for null & undefined
    if(_.isNil(value)) return value;

    // first try with lodash 'cloneDeepWith'
    const nodeCloner = value => _.isElement(value) ? value.cloneNode(true) : undefined;
    let cloned = _.cloneDeepWith(value, nodeCloner);

    if(!_.isEmpty(cloned)) return cloned;

    // try with JSON if 'cloneDeepWith' failed
    const seen = new WeakSet();
    const circularReplacer = (_key, value) => {
        if(typeof value === "object" && value !== null) {
            if(seen.has(value)) return;
            seen.add(value);
        }
        return _.isUndefined(value) ? '__undefined' : value;
    };

    return JSON.parse(JSON.stringify(value, circularReplacer));
}

function renderComponent(...data) {

    config.colors.same = true;
    config.colors.render = true;
    log(`${componentName('renderComponent')} [render]`, ...data);
}

function renderComponentWithId(clientId, ...data) {

    config.colors.same = true;
    config.colors.render = true;
    log(`${componentName('renderComponentWithId')} [${shortenId({clientId})}]`, ...data);
}

function useInComponent(...data) {

    const [componentAndVar, func] = funcAndComponentNames('useInComponent');
    const [component, funcVar] = combineNames(componentAndVar, true);

    const funcName = func !== 'useMemo' ? 'useCallback' : func;
    const key = funcVar ? `${funcName} : ${funcVar}` : funcName;

    config.colors.same = true;
    config.colors.use = true;
    log(`${component} [${key}]`, ...data);
}

function dataInComponent(data, marker = false, className = '_', previous = '') {

    const component = componentName(_.union(['dataInComponent'], _.split(previous, ', ')), className);
    const [firstKey, ...rest] = _.keys(data);
    const isSingleKey = rest.length === 0;
    let key = isSingleKey ? firstKey : _.join([firstKey, ...rest], ', ');
    let value = isSingleKey? data[firstKey] : data;

    // simplify only for single key
    if(isSingleKey) [key, value] = simplify(key, value);
    const name = marker ? `${key} : ${String(marker)}` : key;

    config.mods.forseNil = true;
    config.mods.consoleDir = true;
    config.colors.data = true;
    if(_.isArray(value)) log(`${component} [${name}]`, ...cloneValue(value));
    else log(`${component} [${name}]`, cloneValue(value));
}

function infoInComponent(message, ...data) {

    const infoNames = componentName('infoInComponent');
    config.mods.consoleDir = true;
    config.colors.info = true;
    log(`${message} [${combineNames(infoNames)}]`, ...data);
}

function infoInComponentWithId(clientId, message, ...data) {

    const infoNames = componentName('infoInComponentWithId');
    config.mods.consoleDir = true;
    config.colors.info = true;
    log(`${message} with ${shortenId({clientId})} [${combineNames(infoNames)}]`, ...data);
}

// log ajax request and its options
function logRequestResponse(type, route, options, response, method = 'GET') {

    const messages = {
        request: ` «« Initiating Ajax ${method} request with route [${route}]`,
        error: ` »» Ajax ${method} error received from [${route}]`,
        response: ` »» Ajax ${method} response received from [${route}]`,
    };

    let message = _.get(messages, type) || `? Ajax ${type}`;

    let logData = response ? response : options;

    if(response) {
        logData = _.merge(logData, { timestamp: (new Date().toString()) });
        if(_.isEmpty(response)) {
            message += ` : response is empty `;
        }
    }

    // Log request URL and its data (options or response) if presented
    if(_.isEmpty(logData)) {
        log(message);
    } else {
        log(`>${message}`);
        logGroup(logData);
    }

    // start/stop timing if was set in defaults
    if(config.timing) {
        // eslint-disable-next-line no-console
        if(response) console.timeEnd(route);
        // eslint-disable-next-line no-console
        else console.time(route);
    }
}

function isIterable(value) {
    return Symbol.iterator in Object(value);
}

function shortenId(props, forStorage = false) {
    const shortened = (props && props.clientId) ? props.clientId.slice(-4) : 0;
    return forStorage ? shortened : (shortened === 0 ? '?' : `***-${shortened}`);
}

let tracedComps = {};
function propsAndState(name, compId, props = false, state = false) {

    if(props || state) {
        tracedComps[`${name}-${compId}`] = [props, state];
    } else {
        return tracedComps[`${name}-${compId}`] || [{}, {}];
    }
}

// trace changes in Component props and state
function useTraceUpdate(props, state = {}, trackClientId = false) {

    const key = combineNames(componentName(trackClientId ? 'useTraceUpdate,useTraceUpdateWithId' : 'useTraceUpdate'));
    const id = trackClientId ? ` with ${shortenId(props)}` : '';
    const compId = shortenId(props, true);
    const [prev, prevState] = propsAndState(key, compId);

    // useEffect(() => {
        let changedProps = Object.entries(props).reduce((ps, [k, v]) => {
            if(prev[k] !== v) {
                ps[0][k] = v;
                ps[1][`${k}`] = prev[k]; // _
            }
            return ps;
        }, [{}, {}]);

        let changedState = Object.entries(state).reduce((ss, [k, v]) => {
            if (prevState[k] !== v) {
                ss[0][k] = v;
                ss[1][`${k}`] = prevState[k]; // _
            }
            return ss;
        }, [{}, {}]);

        const hasProps = Object.keys(changedProps[0]).length > 0;
        const hasState = Object.keys(changedState[0]).length > 0;

        config.mods.consoleDir = true;
        config.colors.trace = hasProps || hasState;

        if(hasProps) {
            changedProps = _.reduce(changedProps, (props, p, index) => {
                const [, simplified] = simplify(index ? 'prevProps' : 'props', p);
                if(isIterable(simplified)) props.push(...simplified);
                else props.push(simplified);
                return props;
            }, []);
            // special case - if we have single 'attributes' value - analyse it and remove all identical properties
            if(changedProps.length === 4 && changedProps[0] === 'props.attributes') {
                let next = {}, prev = {};
                _.forEach(changedProps[1], (_val, key) => {
                    if(changedProps[1][key] !== changedProps[3][key]) {
                        next[key] = changedProps[1][key];
                        prev[key] = changedProps[3][key];
                    }
                });
                changedProps[0] += '*';
                changedProps[1] = next;
                changedProps[2] += '*';
                changedProps[3] = prev;
            }
        }
        if(hasState) {
            changedState = _.reduce(changedState, (state, s, index) => {
                const [, simplified] = simplify(index ? 'prevState' : 'state', s);
                if(isIterable(simplified)) state.push(...simplified);
                else state.push(simplified);
                return state;
            }, []);
        }

        if(hasProps && !hasState) log(`Traced changes${id} [${key} : props]`, ...changedProps);
        if(!hasProps && hasState) log(`Traced changes${id} [${key} : state]`, ...changedState);
        if(hasProps && hasState) log(`Traced changes${id} [${key} : props & state]`, ...changedProps, ...changedState);

        propsAndState(key, compId, props, state);
    // });
}

// to trace several instances of one component on the page
function useTraceUpdateWithId(props, state = {}) {
    useTraceUpdate(props, state, true);
}

// to log 'aka' Mounting and Unmounting events
function useAkaMount() {
    const name = combineNames(componentName('useAkaMount'));
    useEffect(() => {
        config.mods.consoleDir = true;
        config.colors.info = true;
        log(`#aka componentDidMount [${name}]`);
        return () => {
            config.mods.consoleDir = true;
            config.colors.info = true;
            log(`#aka componentWillUnmount [${name}]`);
        }
    // eslint-disable-next-line
    }, []);
}

// Get function & component names from stack ----------------------------------]

function skipNames(name, previous) {
    const previousNames = _.isArray(previous) ? previous : _.split(previous, ',');
    return _.union([name], previousNames);
}

function combineNames(names, asArray = false) {
    const [component, funcVar = false] = _.split(names, '/');
    return asArray ? [component, funcVar] : (funcVar ? `${component} : ${funcVar}` : component);
}

function componentName(previous = '', componentAlt = null) {

    const stack = findOnStack(skipNames('componentName', previous), false);
    const name = _.isUndefined(stack[0]) ? '?' : stack[0].replace(/[<|/]+$/g, '');
    const altName = _.isUndefined(stack[1]) ? false : stack[1].replace(/[<|/]+$/g, '');

    // component name should start with UpperCase
    if(name[0] === name[0].toUpperCase()) return name;
    // maybe we have something similar to component name?
    if(_.isString(altName) && altName[0] === altName[0].toUpperCase() && altName.length > 2) componentAlt = altName;
    return componentAlt ? `${componentAlt}.${name}()` : `${name}()`;
}

function funcAndComponentNames(previous = '') {

    let stack = findOnStack(skipNames('funcAndComponentNames', previous), false);
    return [_.isUndefined(stack[0]) ? '?' :
            stack[0].replace(/[<|/]+$/g, ''),
            _.isUndefined(stack[1]) ? '?' :
            stack[1].replace(/[<|/]+$/g, '')
    ];
}

function findOnStack(previousNames, andJoin = true) {

  const removeFrames = skipNames('findOnStack', previousNames);
  let stack = stackParser(new Error()).slice(0, 10); // we need only the first few lines

  stack = _.filter(stack, frame => (
      _.findIndex(removeFrames, removed => {
          const re = new RegExp('^' + removed + '[\\d|\\W]*$', 'i');
          return re.test(frame.functionName);
      }) === -1)
  );

  stack = _.map(stack, (frame) => {
      return andJoin ? frame.source : frame.functionName;
  });

  return andJoin ? _.join(stack, '\n') : stack;
}

function stackParser(error) {

    var CHROME_IE_STACK_REGEXP = /^\s*at .*(\S+:\d+|\(native\))/m;
    var SAFARI_NATIVE_CODE_REGEXP = /^(eval@)?(\[native code\])?$/;

    function extractLocation(urlLike) {

        if(urlLike.indexOf(':') === -1) {
            return [urlLike];
        }

        var regExp = /(.+?)(?::(\d+))?(?::(\d+))?$/;
        var parts = regExp.exec(urlLike.replace(/[()]/g, ''));
        return [parts[1], parts[2] || undefined, parts[3] || undefined];
    }

    function parseV8OrIE(error) {

        var filtered = error.stack.split('\n').filter(function(line) {
            return !!line.match(CHROME_IE_STACK_REGEXP);
        }, this);

        return filtered.map(function(line) {
            if(line.indexOf('(eval ') > -1) {
                line = line.replace(/eval code/g, 'eval').replace(/(\(eval at [^()]*)|(\),.*$)/g, '');
            }
            var tokens = line.replace(/^\s+/, '').replace(/\(eval code/g, '(').split(/\s+/).slice(1);
            var locationParts = extractLocation(tokens.pop());
            var functionName = tokens.join(' ') || undefined;
            var fileName = ['eval', '<anonymous>'].indexOf(locationParts[0]) > -1 ? undefined : locationParts[0];

            return {
                functionName: functionName,
                fileName: fileName,
                lineNumber: locationParts[1],
                columnNumber: locationParts[2],
                source: line
            };
        }, this);
    }

    function parseFFOrSafari(error) {

        var filtered = error.stack.split('\n').filter(function(line) {
            return !line.match(SAFARI_NATIVE_CODE_REGEXP);
        }, this);

        return filtered.map(function(line) {

            if(line.indexOf(' > eval') > -1) {
                line = line.replace(/ line (\d+)(?: > eval line \d+)* > eval:\d+:\d+/g, ':$1');
            }

            if(line.indexOf('@') === -1 && line.indexOf(':') === -1) {
                // Safari eval frames only have function names and nothing else
                return {
                    functionName: line,
                    fileName: '',
                    lineNumber: -1,
                    columnNumber: -1,
                    source: line
                };
            } else {
                var functionNameRegex = /((.*".+"[^@]*)?[^@]*)(?:@)/;
                var matches = line.match(functionNameRegex);
                var functionName = matches && matches[1] ? matches[1] : undefined;
                var locationParts = extractLocation(line.replace(functionNameRegex, ''));

                return {
                    functionName: functionName,
                    fileName: locationParts[0],
                    lineNumber: locationParts[1],
                    columnNumber: locationParts[2],
                    source: line
                };
            }
        }, this);
    }

    if(error.stack && error.stack.match(CHROME_IE_STACK_REGEXP)) {
        return parseV8OrIE(error);
    } else if(error.stack) {
        return parseFFOrSafari(error);
    } else {
        log('Cannot parse given Error object', error);
    }
}

export default {
    get ver() { return config.version; },

    get level() { return logLevel(); },
    set level(val) { logLevel(val); },

    set ignoreNext(val) { config.mods.ignoreNext = val; },

    log,
    logVerbose,
    logGroup,
    warn,
    error,

    useTrace: useTraceUpdate,
    useTraceWithId: useTraceUpdateWithId,
    render: renderComponent,
    renderWithId: renderComponentWithId,
    use: useInComponent,
    data: dataInComponent,
    info: infoInComponent,
    infoWithId: infoInComponentWithId,
    akaMount: useAkaMount,
    cdata(data, className) { dataInComponent(data, false, className, 'cdata'); },    // for data inside class components

    request(route, options, method) { logRequestResponse('request', route, options, null, method); },
    response(route, data, method) { logRequestResponse('response', route, null, data, method); },
    requestError(route, error, method) { logRequestResponse('error', route, null, error, method); },
};
