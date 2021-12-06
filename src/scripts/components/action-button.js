// WordPress dependencies

const { PanelRow, Button, Spinner } = wp.components;
const { forwardRef } = wp.element;

// Internal dependencies

import { mergeClasses, simpleMarkdown } from './../utils.js';

// Zukit Action Button Component

const ZukitActionButton = ({
		className,
		isLoading,
		icon,
		color,
		label,
		help,
		value,
		onClick,
}, ref) => {

	return (
		<>
			<PanelRow>
				<Button
					className={ mergeClasses('__plugin_actions', {
						[color]: color,
						'is-loading': isLoading,
					}, className)
					}
					icon={ icon }
					isSecondary
					onClick={ () => onClick(value) }
					ref={ ref }
				>
					{ label }
					{ isLoading && <Spinner/> }
				</Button>
			</PanelRow>
			{ help &&
				<p className={ mergeClasses('__help', { [color]: color }) }>
					{ simpleMarkdown(help, { br: true }) }
				</p>
			}
		</>
	);
}

const ForwardButton = forwardRef(ZukitActionButton);
export default ForwardButton;
