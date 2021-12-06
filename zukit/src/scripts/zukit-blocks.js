import { blocksSet as fetch } from './fetch.js';
import { blocksSet as utils }  from './utils.js';
import { blocksSet as render } from './render.js';

import * as icons from './icons.js';
import * as jq from './jquery-helpers.js';
import * as components from './components/blocks-index.js';
import * as data from './data/use-store.js';
import debug from './debug.js';

wp.zukit = {
    fetch,
    utils,
    render,
    icons,
    jq,
    components,
    data,
    debug,
};
