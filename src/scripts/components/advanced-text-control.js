// WordPress dependencies

const { isNil } = lodash;
const { __ } = wp.i18n;
const { Button, TextControl } = wp.components;
const { useCallback, useState } = wp.element;

// Internal dependencies

import { mergeClasses } from './../utils.js';

// Zukit Text Control Component

const labels = {
	show: __('Show Password', 'zukit'),
	hide: __('Hide Password', 'zukit'),
	clear: __('Clear', 'zukit'),
};

const isKind = (kind, value) => {

	if(value === '' || isNil(kind)) return true;
	if(kind === 'number') return /^[0-9]+$/g.test(value);
	if(kind === 'email') return /^[a-zA-Z0-9._@-]+$/g.test(value);
	if(kind === 'url') return /^[.a-zA-Z0-9-]+$/g.test(value);
	if(kind === 'tel' || kind === 'phone') return /^[0-9()+-\s]+$/g.test(value);
	// otherwise any string that we use as a Regular Expression
	const re = new RegExp(kind);
	return re.test(value);
}

const AdvTextControl = ({
		className,
		isPassword,
		showTooltip = true,
		withoutClear,
		label,
		value,
		help,
		type,
		strict,
		onChange,
}) => {

	const [visible, setVisible] = useState(false);
	const controlType = isPassword ? (visible ? 'text' : 'password') : (type || 'text');
	const controlIcon = isPassword ? (visible ? 'hidden' : 'visibility') : 'no-alt';
	const controlTooltip = isPassword ? (visible ? labels.hide : labels.show) : labels.clear;

	const onClick = useCallback(() => isPassword ? setVisible(!visible) : onChange(''), [isPassword, visible, onChange]);

	const onValidatedChange = useCallback(val => {
		if(isKind(strict, val)) onChange(val);
	}, [strict, onChange]);

	return (
		<div className={ mergeClasses('components-base-control', 'zukit-text-control', className) }>
			<TextControl
				type={ controlType }
				label={ label }
				help={ help }
				value={ value || '' }
				onChange={ onValidatedChange }
			/>
			{ (isPassword || !withoutClear) &&
				<Button
					className="__exclude"
					showTooltip={ showTooltip }
					label={ controlTooltip }
					icon={ controlIcon }
					onClick={ onClick }
				/>
			}
		</div>
	);
}

export default AdvTextControl;
