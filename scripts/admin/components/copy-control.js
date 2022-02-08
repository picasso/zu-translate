// WordPress dependencies

const { isFunction, map, filter } = lodash;
const { __ } = wp.i18n;
const { Path, SVG, Button, Icon, ToggleControl, NavigableMenu, MenuItem, Popover } = wp.components;
const { useCallback, useState, useRef, useMemo } = wp.element;

// Zukit dependencies

// const { SelectItemControl, TitleIndicator } = wp.zukit.components;

// Internal dependencies

// import { mergeClasses } from './../utils.js'; // getExternalData,
import { copyRawAttributes } from './../data/raw-helpers.js';

// const flagPath = getExternalData('location', []);
// export const withFlags = getExternalData('flags', false);

const copyPrefix = 'components-zu-copy-control';

const chevronUp = (
	<SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
		<Path d="M6.5 12.4L12 8l5.5 4.4-.9 1.2L12 10l-4.5 3.6-1-1.2z" />
	</SVG>
);

const chevronDown = (
	<SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
		<Path d="M17.5 11.6L12 16l-5.5-4.4.9-1.2L12 14l4.5-3.6 1 1.2z" />
	</SVG>
);

const CopyControl = ({
	// className,
	lang,
	options,
	onCopy,
	// ...additionalProps
}) => {

	const [ isOverwriteAllowed, setOverwriteAllowed ] = useState(false);
	const [ isOpened, setIsOpened ] = useState(false);
	const buttonRef = useRef(null);

	// const langCount = options.length - 1;
	const availableLanguages = filter(options, o => o.value !== lang);
	const [ langIndex, setLangIndex ] = useState(0);
	const toLang = availableLanguages[langIndex]?.value;
	const toLabel = availableLanguages[langIndex]?.label;

	const closeOutside = useCallback(event => {
		if(buttonRef && !buttonRef.current.contains(event.relatedTarget)) {
			setIsOpened(false);
		}
	}, []);

	const togglePopup = useCallback(() => setIsOpened(prevIsOpen => !prevIsOpen), []);

	const copyValue = useCallback(fromLang => {
		if(isFunction(onCopy)) onCopy(fromLang, isOverwriteAllowed);
		else copyRawAttributes(fromLang, isOverwriteAllowed);
	}, [onCopy, isOverwriteAllowed]);

	// The menu items are practically unchanged (only if 'options' is updated)
	// and therefore we Memoize them
	const menuItems = useMemo(() => {
		// do nothing if no 'options'
		// if(isEmpty(options)) return [];

		// Use only the items presented in 'options' and not empty
		// const menuOptions = filter(options, o => !isEmpty(options[o.linkDestination]));

		const onChange = index => {
			setLangIndex(index);
			setIsOpened(false);
		};

		return (
			map(availableLanguages, (option, index) => (
				<MenuItem
					key={ option.value }
					// icon={ option.icon }
					onClick={ () => onChange(index) }
				>
					{ option.label }
				</MenuItem>
			))
		);

	}, [availableLanguages]);

	const isDisabled = false;

	return (
		<>
			<div className={ copyPrefix }>
				<Button
					disabled={ isDisabled }
					className={ `${copyPrefix}__action` }
					onClick={ () => copyValue(toLang) }
					// ref={ buttonRef }
				>
					{ __('Copy from', 'zu-translate') }
				</Button>
				<div>
				<Button
					disabled={ isDisabled }
					className={ `${copyPrefix}__lang` }
					aria-expanded={ isOpened }
					onClick={ togglePopup }
					ref={ buttonRef }
				>
					{ toLabel }
					<span className={ `${copyPrefix}__arrow` } aria-hidden="true">
						<Icon icon={ isOpened ? chevronUp : chevronDown }/>
					</span>
				</Button>
				{ isOpened && (
					<Popover
						className={ `${copyPrefix}__popup` }
						position={ "bottom right" }
						onFocusOutside={ closeOutside }
						// anchorRect={ false }
					>
						<NavigableMenu
							className={ `${copyPrefix}__menu` }
							// ref={ menuContainer }
							// onKeyDown={ manageFocusOnInput }
						>
							{ menuItems }
						</NavigableMenu>
					</Popover>
				) }
				</div>
			</div>
			<ToggleControl
				className={  `${copyPrefix}__toggle` }
				label={ __('Allow Overwrite', 'zu-translate') }
				checked={ isOverwriteAllowed }
				onChange={ () => setOverwriteAllowed(!isOverwriteAllowed) }
			/>
		</>
	);
}

export default CopyControl;
