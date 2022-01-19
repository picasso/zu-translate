// WordPress dependencies

const { ToggleControl } = wp.components;

// Internal dependencies

import { mergeClasses, simpleMarkdown } from './../utils.js';
import ZukitDivider from './divider.js'

// Zukit Toggle Component

const ZukitToggle = ({
		className,
		withDivider,
		label,
		help,
		checked,
		onChange,
}) => {

	return (
		<>
			{ withDivider &&
				<ZukitDivider
					size={ withDivider === true ? undefined : withDivider }
				/>
			}
			<ToggleControl
				className={ mergeClasses('zukit-toggle', '__zu_markdown', className) }
				label={ simpleMarkdown(label, { br: false }) }
				help={ simpleMarkdown(help, { br: true }) }
				checked={ !!checked }
				onChange={ onChange }
			/>
		</>
	);
}

export default ZukitToggle;
