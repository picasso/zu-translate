// WordPress dependencies

const { isArray, isEmpty, isNil, map, pull, split, join, includes, has } = lodash;
const { __ } = wp.i18n;
const { ENTER } = wp.keycodes;
const { compose, useInstanceId } = wp.compose;
const { BaseControl, Button, TextControl, Tooltip } = wp.components;
const { useState, useCallback, useMemo } = wp.element;
const { isEmail, isURL } = wp.url;

// Internal dependencies

import { getKey, messageWithError, mergeClasses } from './../utils.js';
import { scrollTop } from './../jquery-helpers.js';
import { withNoticesContext } from './../hooks/use-notices.js';

// List Input Component

const cprefix = 'zukit-list-input';
const closeIcon = 'no-alt';

const isKind = (kind, value) => {
	// https://stackoverflow.com/questions/4338267/validate-phone-number-with-javascript
	const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/g;

	if(isNil(kind)) return true;
	if(kind === 'email') return isEmail(value);
	if(kind === 'url') return isURL(value);
	if(kind === 'tel' || kind === 'phone') return phoneRegex.test(value);
	// otherwise any string that we use as a Regular Expression
	const re = new RegExp(kind);
	return re.test(value);
}

const messages = {
	duplicate: __('Duplicates are not allowed', 'zukit'),
	email: __('It does not look like a valid email.', 'zukit'),
	url: __('It does not look like a URL.', 'zukit'),
	tel: __('It does not look like a phone number.', 'zukit'),
	regex: __('It does not look like a valid input.', 'zukit'),
};

const messageByKind = (kind, value) => {
	if(kind === 'phone') kind = 'tel';
	const msg = has(messages, kind) ? messages[kind] : messages.regex;
	return messageWithError(msg, value);
}

const ListInputControl = ({
		separator = ',',
		label,
		help,
		inputLabel,
		inputHelp,
		isSideBySide,		// if true then 'inputLabel' and 'inputHelp' will be placed 'side by side'

		strict,				// 'email', 'url', 'tel' or regex string
							// when regex - provide it in JSX as strict={ /^(?!\d)[\w$]+$/g },
							// if passed as a string then there may be problems with the backslash
		value,
		onChange,
		isOpen,
		isNotEmptyLabel,	// show 'label' and 'help' only when 'value' is not empty
		noticeOperations,
}) => {

	const { createNotice } = noticeOperations;
	const [ currentItem, setCurrentItem ] = useState('');
	const [ editMode, setEditMode ] = useState(isOpen);
	const instanceId = useInstanceId(ListInputControl);
	const controlId = `list-input-control-${ instanceId }`;

	// convert string value to array if needed
	const items = useMemo(() => {
		return isArray(value) ? value : (isEmpty(value) ? [] : split(value, separator));
	}, [value, separator]);

	// remove an item by its value
	const onRemoveItem = useCallback(value => {
		const wasCount = items.length;
		pull(items, value);
		if(items.length < wasCount) {
			onChange(join(items, separator));
		}
	}, [items, onChange, separator]);

	// clean the list
	const onReset = useCallback(() => {
		onChange('');
	}, [onChange]);

	// add an item to the list (only unique values are allowed)
	const onAddItem = useCallback(() => {
		let error = null;
		if(!includes(items, currentItem)) {
			if(isKind(strict, currentItem)) {
				items.push(currentItem);
				onChange(join(items, separator));
				setCurrentItem('');
			} else {
				error = messageByKind(strict, currentItem);
			}
		} else {
			error = messageWithError(messages.duplicate, currentItem);
		}
		if(error !== null) {
			// Can be one of: success, info, warning, error
			createNotice({
				status: 'warning',
				content: error,
				isDismissible: true,
				__unstableHTML: true,
			});
			scrollTop();
		}
	}, [currentItem, items, onChange, separator, strict, createNotice]);

	// add an item on ENTER key pressed
	const onKeyDown = useCallback(event => {
		const { keyCode } = event;
		if(keyCode === ENTER) {
			onAddItem();
		}
	}, [onAddItem]);

	const isСombined = (isNotEmptyLabel ? !isEmpty(items) : true) && (label || help);
	const isInputСombined = isSideBySide && (inputLabel || inputHelp);

	return (
		<BaseControl className={ mergeClasses(cprefix, { __fullwidth: isСombined || isInputСombined }) }>
			{ isСombined &&
				<div className="__sidebyside __list">
					{ label &&
						<label className="components-base-control__label" htmlFor={ controlId }>{ label }</label>
					}
					{ help &&
						<p className="components-base-control__help">{ help }</p>
					}
				</div>
			}
			<div className="__list">
				{ map(items, val =>
					<div className="__list-item" key={ getKey(val) }>
						<span>{ val }</span>
						<Tooltip text={ __('Remove', 'zukit') } position="top center">
							<Button
								className="__remove"
								isSecondary
								icon={ closeIcon }
								onClick={ () => onRemoveItem(val) }
							/>
						</Tooltip>
					</div>
				) }
				{ !editMode &&
					<Button
						className="__edit __plugin_actions __auto admin-blue"
						icon="admin-settings"
						isSecondary
						onClick={ () => setEditMode(true) }
					>
						{ __('Modify', 'zukit') }
					</Button>
				}
			</div>
			{ editMode &&
				<>
				{ isInputСombined &&
					<div className="__sidebyside">
						{ inputLabel &&
							<label className="components-base-control__label" htmlFor={ controlId }>{ inputLabel }</label>
						}
						{ inputHelp &&
							<p className="components-base-control__help">{ inputHelp }</p>
						}
					</div>
				}
				<div className={ mergeClasses(
					'__input',
					// 'is-from-top',
					{
						'components-animate__appear is-from-top': !isOpen,
						'__with-help': inputHelp && !isInputСombined,
						'__with-label-help': isInputСombined,
					}
				) }>
					<TextControl
						label={ isInputСombined ? undefined : (inputLabel || __('Enter new item', 'zukit')) }
						help={ isInputСombined ? undefined : inputHelp }
						value={ currentItem }
						onChange={ setCurrentItem }
						onKeyDown={ onKeyDown }
						{ ...(isInputСombined ? { id: controlId } : {}) }
					/>
					<Button
						className="__add __plugin_actions admin-blue"
						icon="tag"
						isSecondary
						onClick={ onAddItem }
					>
						{ __('Add', 'zukit') }
					</Button>
					<Button
						className="__reset __plugin_actions magenta"
						isSecondary
						icon="trash"
						onClick={ onReset }
					>
						{ __('Reset All', 'zukit') }
					</Button>
				</div>
				</>
			}
		</BaseControl>
	);
};

export default compose([
	withNoticesContext,
])(ListInputControl);
