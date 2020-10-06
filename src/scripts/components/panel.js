// WordPress dependencies

const { get } = lodash;

// const { __ } = wp.i18n;
// const { useState, useCallback } = wp.element; // , useEffect
const { PanelBody } = wp.components;

// Internal dependencies

import { mergeClasses } from './../utils.js';

// Zukit Panel Component

const ZukitPanel = ({
		id,
		className,
		panels,
		title,
		children,
		...props
}) => {

	if(id !== undefined && !get(panels, `${id}.value`)) return null;

	return (
		<PanelBody
			title={ get(panels, `${id}.label`) || title }
			className={ mergeClasses('zukit-panel', className) }
			{ ...props }
		>
			{ children }
		</PanelBody>
	);
}

export const withZukitPanel = (panels = {}) => {
	return (props) => <ZukitPanel panels={ panels } { ...props }/>;
};

export default ZukitPanel;
