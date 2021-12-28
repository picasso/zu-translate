// WordPress dependencies

const { map, pick } = lodash;
const { __ } = wp.i18n;
const { PanelBody, Path, SVG } = wp.components;
const { useCallback } = wp.element;

// Import debug object and make it available from global scope
window.Zubug = { ...(wp.zukit.debug  || {}) };

// Zukit dependencies

const { SelectItemControl, TitleIndicator } = wp.zukit.components;

// Internal dependencies

const { language_config: config } = window.qTranslateConfig ?? {};
const langOptions = map(config, (data, key) => ({ value: key, label: data.name }));

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
	// const { title, lang, onClick, withPanel, ...additionalProps } = props;
	// Zubug.useTrace(props);

	const langValue = useCallback((value, label, style) => {
		return (
			<span
				className="__lang"
				style={ style }
			>
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
