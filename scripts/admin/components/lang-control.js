// WordPress dependencies

const { map, pick } = lodash;
const { __ } = wp.i18n;
const { PanelBody, Path, SVG } = wp.components;
const { useCallback } = wp.element;

// Zukit dependencies

const { SelectItemControl, TitleIndicator } = wp.zukit.components;

// Internal dependencies

import { getExternalData, emptyGif, mergeClasses } from './../utils.js';

const config = getExternalData('config', []);
const flagPath = getExternalData('location', []);
const langOptions = map(config, (data, key) => ({ value: key, label: data.name, flag: data.flag }));
export const withFlags = getExternalData('flags', false);

const langPrefix = 'components-zu-lang-control';

export const tick = (
<SVG
	width="24"
	height="24"
	viewBox="0 0 24 24"
	xmlns="http://www.w3.org/2000/svg"
>
	<Path d="M18.3 5.6L9.9 16.9l-4.6-3.4-.9 1.2 5.8 4.3 9.3-12.6z"/>
</SVG>
);

const LangIndicator = ({
	title,
	lang,
	colored,
}) => {
	return (
		<TitleIndicator
			title={ title ?? __('Language', 'zu-translate') }
			value={ lang }
			colored={ colored }
		/>
	);
}

const LangControl = ({
	title,
	lang,
	onClick,
	withPanel,
	...additionalProps
}) => {

	const langValue = useCallback((value, label, style, more) => {
		return (
			<span
				className={ mergeClasses('__lang', { '__with-flags': withFlags }) }
				style={ style }
			>
				{ withFlags &&
					<img
						className="__flag"
						src={ more.flag ? flagPath + more.flag : emptyGif }
					/>
				}
				{ label }
				{ lang === value ? tick : null }
			</span>
		);
	}, [lang]);

	const langControl = (
		<SelectItemControl
			className={ langPrefix }
			options={ langOptions }
			selectedItem={ lang }
			onClick={ onClick }
			transformValue={ langValue }
		/>
	);

	if(withPanel) {
		const titleWithIndicator = <LangIndicator title={ title } lang={ lang }/>;
		const panelProps =pick(additionalProps, [
			'buttonProps',
			'className',
			'icon',
			'opened',
			'scrollAfterOpen',
			'initialOpen',
			'onToggle'
		]);
		return (
			<PanelBody
				title={ titleWithIndicator }
				{ ...panelProps }
			>
				{ langControl }
			</PanelBody>
		);
	}
	return langControl;
}

LangControl.Panel = props => <LangControl withPanel { ...props }/>;
LangControl.Indicator = LangIndicator;
export default LangControl;
