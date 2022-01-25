// WordPress dependencies

const { defaults } = lodash;
const { registerPlugin } = wp.plugins;

// Internal dependencies

import { getExternalData } from './utils.js';
import * as plugin from './plugin-document/index.js';
import './hooks/index.js';
import { resetPostEditorAutosave } from './remove-backups.js';

// reset editor autosaves/backups if requested
if(getExternalData('nobackups', false)) {
	resetPostEditorAutosave('Zu Translate');
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

registerPlugins();
