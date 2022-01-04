// WordPress dependencies

const { isNil, isEmpty, isFunction, debounce } = lodash;
const { __ } = wp.i18n;
const { ENTER } = wp.keycodes;
const { Button, TextControl, Tooltip } = wp.components;
const { useCallback, useState, useEffect } = wp.element;
const { useInstanceId } = wp.compose;

// Internal dependencies

import { mergeClasses, uniqueValue } from './../utils.js';
import ConditionalWrap from './conditional-wrap.js';

// Zukit Advanced Text Control Component

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

const setValidatedValue = (val, withoutValues, fallbackValue, kind, emptyIfFailed = false) => {
	const value = isEmpty(withoutValues) ? val : uniqueValue(val, withoutValues, fallbackValue);
	return isKind(kind, value) ? value : (emptyIfFailed ? '' : null);
}

const AdvTextControl = ({
		className,
		isPassword,
		isSideBySide,		// if true then 'label' and 'help' will be placed 'side by side'
		showTooltip = true,
		tooltipPosition = 'top center',
		withoutClear,
		id,
		label,
		value,
		help,
		type,
		strict,				// 'number', 'email', 'url', 'tel' or regex string
							// when regex - provide it in JSX as strict={ /^(?!\d)[\w$]+$/g },
							// if passed as a string then there may be problems with the backslash
		withDebounce,
		debounceDelay = 1000,
		withoutValues = null,
		fallbackValue = 'name',

		onChange,
		onKeyEnter,
}) => {

	const [visible, setVisible] = useState(false);
	const [debounceActive, setDebounceActive] = useState(false);
	const controlType = isPassword ? (visible ? 'text' : 'password') : (type || 'text');
	const controlIcon = isPassword ? (visible ? 'hidden' : 'visibility') : 'no-alt';
	const controlTooltip = isPassword ? (visible ? labels.hide : labels.show) : labels.clear;
	const instanceId = useInstanceId(AdvTextControl);
	const controlId = id ?? `advanced-text-control-${ instanceId }`;

	const onClear = useCallback(() => {
		setTemporaryValue('');
		onChange('');
	}, [onChange]);

	const onClick = useCallback(() => isPassword ? setVisible(!visible) : onClear(), [isPassword, visible, onClear]);

	// Debounce ---------------------------------------------------------------]

	// using temporaryName while debouncing name changes
	const [ temporaryValue, setTemporaryValue ] = useState(
		setValidatedValue(value, withoutValues, fallbackValue, strict, true)
	);

	// using debouncing to reduce the number of calls to the onChange handler
	// eslint-disable-next-line react-hooks/exhaustive-deps
	const onUpdateValue = useCallback(
		debounce(value => {
			onChange(value);
			setDebounceActive(false);
		}, debounceDelay)
	, [onChange, debounceDelay]);

	const onChangeValue = useCallback(value => {
		setDebounceActive(true);
		setTemporaryValue(value);
		onUpdateValue(value);
	}, [onUpdateValue]);

	// call handler on ENTER key pressed
	const onEnter = useCallback(event => {
		const { keyCode } = event;
		if(keyCode === ENTER && isFunction(onKeyEnter)) {
			onKeyEnter();
		}
	}, [onKeyEnter]);

	// sync 'temporaryValue' and 'value' what can happen if 'value' was changed outside the component и
	// after the component has been mounted and the 'temporaryValue' state has already been initialized
	useEffect(() => {
		if(debounceActive === false) {
			if(temporaryValue !== value) {
				const newValue = setValidatedValue(value, withoutValues, fallbackValue, strict, true);
				if(newValue !== value) onChange(newValue);
				if(newValue !== temporaryValue) setTemporaryValue(newValue);
			}
		}
	}, [ debounceActive, value, onChange, temporaryValue, withoutValues, fallbackValue, strict]);

	// Validate ---------------------------------------------------------------]

	const withButton = isPassword || !withoutClear;

	const onValidatedChange = useCallback(val => {
		const value = setValidatedValue(val, withoutValues, fallbackValue, strict);
		if(value !== null) {
			if(withDebounce) onChangeValue(value);
			else onChange(value);
		}
	}, [strict, withDebounce, onChange, onChangeValue, withoutValues, fallbackValue]);

	const isСombined = isSideBySide && (label || help);

	return (
		<>
		{ isСombined &&
			<div className="__sidebyside components-base-control">
				{ label &&
					<label className="components-base-control__label" htmlFor={ controlId }>{ label }</label>
				}
				{ help &&
					<p className="components-base-control__help">{ help }</p>
				}
			</div>
		}
		<div className={ mergeClasses(
			'components-base-control', 'zukit-text-control', className,
			{
				'__with-label': !isСombined && label && withButton,
				'__with-help': !isСombined && help,
				'__with-label-help': !isСombined && label && help && withButton,
				'__with-button': withButton,
			}
		) }>
			<TextControl
				type={ controlType }
				label={ isСombined ? undefined : label }
				help={ isСombined ? undefined : help }
				value={ (withDebounce ? temporaryValue : value) || '' }
				onChange={ onValidatedChange }
				onKeyDown={ onEnter }
				{ ...(isСombined ? { id: controlId } : {}) }
			/>
			{ withButton &&
				<ConditionalWrap
					wrap={ Tooltip }
					condition={ showTooltip }
					text={ controlTooltip }
					position={ tooltipPosition }
					noArrow={ false }
				>
					<Button
						className={ mergeClasses('__exclude',
						{
							'__with-label': !isСombined && label && withButton,
							'__with-label-help': !isСombined && label && help && withButton,
						}
					) }
						icon={ controlIcon }
						onClick={ onClick }
					/>
				</ConditionalWrap>
			}
		</div>
		</>
	);
}

export default AdvTextControl;
