// WordPress dependencies

const { isArray, isEmpty, isNil, map, pull, split, join, includes, has } = lodash;
const { __ } = wp.i18n;
const { ENTER } = wp.keycodes;
const { compose } = wp.compose;
const { BaseControl, Button, TextControl, Tooltip } = wp.components;
const { useState, useCallback, useMemo } = wp.element;
const { isEmail, isURL } = wp.url;

// Internal dependencies

import { getKey, messageWithError } from './../utils.js';
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

		strict,				// 'email', 'url', 'tel' or regex string
		value,
		onChange,
		noticeOperations,
}) => {

	const { createNotice } = noticeOperations;
	const [ currentItem, setCurrentItem ] = useState('');
	const [ editMode, setEditMode ] = useState(false);

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
		if(!includes(items, currentItem)) {
			if(isKind(strict, currentItem)) {
				items.push(currentItem);
				onChange(join(items, separator));
				setCurrentItem('');
			} else {
				// Can be one of: success, info, warning, error
				createNotice({
					status: 'error',
					content: messageByKind(strict, currentItem),
					isDismissible: true,
					__unstableHTML: true,
				});
			}
		} else {
			createNotice({
				status: 'warning',
				content: messageWithError(messages.duplicate, currentItem),
				isDismissible: true,
				__unstableHTML: true,
			});
		}
	}, [currentItem, items, onChange, separator, strict, createNotice]);

	// add an item on ENTER key pressed
	const onKeyDown = useCallback(event => {
		const { keyCode } = event;
		if(keyCode === ENTER) {
			onAddItem();
		}
	}, [onAddItem]);

	const isDesc = label || help;

	return (
		<BaseControl className={ cprefix }>
			{ isDesc &&
				<div className="__desc">
					{ label &&
						<label className="components-base-control__label">{ label }</label>
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
				<div className="components-animate__appear is-from-top __input">
					<TextControl
						label={ inputLabel || __('Enter new item', 'zukit') }
						value={ currentItem }
						onChange={ setCurrentItem }
						onKeyDown={ onKeyDown }
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
			}
		</BaseControl>
	);
};

export default compose([
	withNoticesContext,
])(ListInputControl);
