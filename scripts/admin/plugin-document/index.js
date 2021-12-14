// Internal dependencies

import render from './render.js';
import metadata from './metadata.js';

const { name, title } = metadata;
export { metadata, name };

export const settings = {
	title,
	render,
};
