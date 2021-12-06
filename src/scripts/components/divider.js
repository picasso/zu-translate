// WordPress dependencies

const { includes } = lodash;

// Internal dependencies

import { mergeClasses, toRange } from './../utils.js';

// Zukit Divider Component

const defaultUnit = 'em';
const defaultSize = 2;

const ZukitDivider = ({
		className,
		size = defaultSize,
		unit = defaultUnit,
		bottomHalf,
}) => {

	const sizeUnit = includes(unit, ['px', 'em', 'rem', '%']) ? unit : defaultUnit;
	const sizeValue = toRange(size, 0, 100);
	const style = sizeValue > 0 ? { marginBottom: `${bottomHalf ? sizeValue/2 : sizeValue}${sizeUnit}`, paddingTop: `${sizeValue}${sizeUnit}` } : null;

	return (
		<div
			className={ mergeClasses('zukit-divider', className) }
			style={ style }
		>
		</div>
	);
}

export default ZukitDivider;
