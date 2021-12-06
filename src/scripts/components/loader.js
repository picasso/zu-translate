// WordPress dependencies

const { isNil } = lodash;
const { RawHTML } = wp.element;

// Internal dependencies

import { mergeClasses } from './../utils.js';
import { useLoaders } from './../data/use-store.js';

// Loader Component

const Loader = ({
		className,
		loaderHTML,
}) => {

	return isNil(loaderHTML) ? null : (
		<RawHTML className={ mergeClasses('zu-loader', className) }>
			{ loaderHTML }
		</RawHTML>
	);
}

const WithOptions = ({
		className,
		id = 'none',
		duration,
}) => {

	const loaderHTML = useLoaders(id, duration);
	return (
		<Loader className={ className } loaderHTML={ loaderHTML } />
	);
}

Loader.WithOptions = WithOptions;

export default Loader;
