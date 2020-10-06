// WordPress dependencies

const { includes } = lodash;

// const { __ } = wp.i18n;
// const { useState, useCallback } = wp.element; // , useEffect

// Internal dependencies

import { mergeClasses, toRange } from './../utils.js';

// Zukit Divider Component

const defaultUnit = 'em';

const ZukitDivider = ({
		className,
		size,
		unit = defaultUnit,
}) => {

	const sizeUnit = includes(unit, ['px', 'em', 'rem', '%']) ? unit : defaultUnit;
	const sizeValue = toRange(size, 0, 100);
	const style = sizeValue > 0 ? { marginBottom: `${sizeValue}${sizeUnit}`, paddingTop: `${sizeValue}${sizeUnit}` } : null;

	return (
		<div
			className={ mergeClasses('zukit-divider', className) }
			style={ style }
		>
		</div>
	);
}

export default ZukitDivider;
