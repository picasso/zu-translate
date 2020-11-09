// WordPress dependencies

const { PanelBody } = wp.components;

// Internal dependencies

import { mergeClasses } from './../utils.js';
import { usePanelsContext } from './../hooks/use-panels.js';

// Zukit Panel Component

const ZukitPanel = ({
		id,
		className,
		title,
		children,
		...props
}) => {

	const getPanel = usePanelsContext();
	if(getPanel({ type: 'hidden', id })) return null;

	return (
		<PanelBody
			title={ getPanel({ type: 'title', id }) || title }
			className={ mergeClasses('zukit-panel', className) }
			{ ...props }
		>
			{ children }
		</PanelBody>
	);
}

export default ZukitPanel;
