// WordPress dependencies

const { defaults } = lodash;
const { registerPlugin } = wp.plugins;
// const { registerBlockType } = wp.blocks;

// Import debug object and make it available from global scope
window.Zubug = { ...(wp.zukit.debug  || {}) };

// Internal dependencies
import { getExternalData } from './utils.js';
import * as plugin from './plugin-document/index.js';
// import * as status from './lang-status/index.js';
import './hooks/index.js';
import { resetPostEditorAutosave } from './remove-backups.js';

// reset editor autosaves/backups if requested
window.console.log('nobackups', getExternalData('nobackups', false));
if(getExternalData('nobackups', false)) {
	resetPostEditorAutosave();
}

//  Register Plugins ----------------------------------------------------------]

export function registerPlugins () {
	[
		plugin,
		// status,

	].forEach(sidebar => {

		if(!sidebar) return;
		const { name, settings } = sidebar;
		// we need to pass {icon: false} if the attribute is missed to avoid rendering the default icon
		registerPlugin(name, defaults(settings, { icon: false }));
	} );
}

// Register ZU blocks collection or category
// const supportsCollections = registerCollection();
// if(!supportsCollections) registerCategory();

//  Register Blocks -----------------------------------------------------------]

// import * as form from './blocks/form/index.js';
// import * as recaptcha from './blocks/field-recaptcha/index.js';
//
// export function registerBlocks() {
// 	[
// 		form,
// 		recaptcha,
//
// 	].forEach(block => {
//
// 		if(!block) return;
//
// 		const { name, settings } = block;
// 		if(!supportsCollections) settings.category = brandAssets.slug;
// 		registerBlockType(name, settings);
//
// 	} );
// }
//

registerPlugins();
// registerBlocks();
