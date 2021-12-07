// WordPress dependencies

const { registerBlockType } = wp.blocks;

// Internal dependencies

import { registerCollection, registerCategory, brandAssets } from './blocks/utils.js';

// Register ZU blocks collection or category
const supportsCollections = registerCollection();
if(!supportsCollections) registerCategory();

//  Register Blocks -----------------------------------------------------------]

import * as form from './blocks/form/index.js';
import * as field from './blocks/field/index.js';
import * as recaptcha from './blocks/field-recaptcha/index.js';

export function registerBlocks() {
	[
		form,
		field,
		recaptcha,

	].forEach(block => {

		if(!block) return;

		const { name, settings } = block;
		if(!supportsCollections) settings.category = brandAssets.slug;
		registerBlockType(name, settings);

	} );
}

registerBlocks();
