// WordPress dependencies

const { ColorIndicator } = wp.components;

// Internal dependencies

import { mergeClasses } from './../utils.js';

// Panel Title Component

const panelIndicatorPrefix = 'components-zu-panel-indicator';

const PanelTitleIndicator = ({
	className,
	isColor,
	title,
	value,
	colored,
	...props
}) => (
	<span className={ className }>
		{ title }
		{ value && (isColor ? <ColorIndicator className={ panelIndicatorPrefix } colorValue={ value } { ...props }/> :
			<span
				className={ mergeClasses(panelIndicatorPrefix, { [colored]: colored }) }
				{ ...props }
			>
				{ value }
			</span>
		) }
	</span>
);

export default PanelTitleIndicator;
