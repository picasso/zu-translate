// WordPress dependencies

const { isFunction, map, filter } = lodash;
const { __ } = wp.i18n;
const { Path, SVG, Button, Icon, ToggleControl, NavigableMenu, MenuItem, Popover } = wp.components;
const { useCallback, useState, useRef, useMemo } = wp.element;
const { ESCAPE } = wp.keycodes;
const { withSafeTimeout } = wp.compose;

// Internal dependencies

import { getExternalData, mergeClasses, emptyGif } from './../utils.js';
import { copyRawAttributes } from './../data/raw-helpers.js';
const flagPath = getExternalData('location', []);

const copyPrefix = 'components-zu-copy-control';
const flagIcon = option => (<img src={ option.flag ? flagPath + option.flag : emptyGif }/>);

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
	lang,
	options,
	onCopy,
	setTimeout,
}) => {

	const [ isOverwriteAllowed, setOverwriteAllowed ] = useState(false);
	const [ isOpened, setIsOpened ] = useState(false);
	const [ isFlashing, setIsFlashing ] = useState(false);
	const buttonRef = useRef(null);

	const availableLanguages = filter(options, o => o?.value !== lang);
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
		const func = isFunction(onCopy) ? onCopy : copyRawAttributes;
		const result = func(fromLang, isOverwriteAllowed);
		if(!result) {
			setIsFlashing(true);
			setTimeout(() => setIsFlashing(false), 1900);
		}
	}, [onCopy, isOverwriteAllowed, setTimeout]);

	const onEscape = useCallback(event => {
		if(event.keyCode === ESCAPE) {
			event.preventDefault();
			event.stopPropagation();
			setIsOpened(false);
		}
	}, []);

	// The menu items are practically unchanged (only if 'availableLanguages' is updated)
	// and therefore we Memoize them
	const menuItems = useMemo(() => {
		// do nothing if no languages
		if(!availableLanguages.length) return [];

		const onChange = index => {
			setLangIndex(index);
			setIsOpened(false);
		};

		return (
			map(availableLanguages, (option, index) => (
				<MenuItem
					key={ option.value }
					icon={ flagIcon(option) }
					onClick={ () => onChange(index) }
				>
					{ option.label }
				</MenuItem>
			))
		);

	}, [availableLanguages]);

	const isDisabled = availableLanguages.length === 1;

	return (
		<>
			<div className={ copyPrefix }>
				<Button
					disabled={ isDisabled }
					className={  mergeClasses(`${copyPrefix}__action`, { 'is-flashing': isFlashing }) }
					onClick={ () => copyValue(toLang) }
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
						>
							<NavigableMenu
								// ref={ menuContainer }
								onKeyDown={ onEscape }
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

export default withSafeTimeout(CopyControl);
