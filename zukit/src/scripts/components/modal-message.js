// WordPress dependencies

const { map, castArray } = lodash;
const { __ } = wp.i18n;
const { Fragment } = wp.element;
const { Button, Icon, Modal } = wp.components;

// Internal dependencies

import { mergeClasses, simpleMarkdown } from './../utils.js';
import { warning as warningIcon, error as errorIcon, info as infoIcon } from './../icons.js';

const ModalMessage = ({
		className,
		icon,
		message,
		links,
		withoutCloseButton,
		isOpen,
		onClose,
		children,
}) => {

	const modalIcon = icon === 'warning' ? warningIcon : (icon === 'error' ? errorIcon : infoIcon);

	return isOpen && (
		<Modal
			className={ mergeClasses('zukit-modal', className) }
			title={ __('Warning', 'zu-contact') }
			closeLabel={ __('Close') }
			onRequestClose={ onClose }
		>
			<div className="__content-wrapper">
				<Icon className="__icon" icon={ modalIcon }/>
				<div>
					{ simpleMarkdown(message, { links }) }
				</div>
			</div>
			<div className="__button-wrapper">
				{ map(castArray(children || []), (button, key) => <Fragment key={ key }>{ button }</Fragment>) }
				{ !withoutCloseButton &&
					<Button isPrimary onClick={ onClose }>
						{ __('Close') }
					</Button>
				}
			</div>
		</Modal>
	);
}

export default ModalMessage;
