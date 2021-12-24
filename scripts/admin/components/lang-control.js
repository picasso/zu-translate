// WordPress dependencies

const { map, pick } = lodash;
const { __ } = wp.i18n;
const { PanelBody, Path, SVG } = wp.components;
const { useCallback } = wp.element;

// Import debug object and make it available from global scope
window.Zubug = { ...(wp.zukit.debug  || {}) };

// Zukit dependencies

const { SelectItemControl } = wp.zukit.components;

// Internal dependencies

import PanelTitleIndicator from './panel-indicator.js';
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

// function transformLangValue(value, label, style) {
// 	return (
// 		<span className="__lang" style={ style }>{ label }tick</span>
// 	);
// }

// Zubug.data({ langOptions });

const LangControl = (props
// 	{
// 	title,
// 	lang,
// 	onClick,
// 	withPanel,
// 	...additionalProps
// }
) => {
	const { title, lang, onClick, withPanel, ...additionalProps } = props;
	Zubug.useTrace(props);

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
			// withLabels
			options={ langOptions }
			selectedItem={ lang }
			onClick={ onClick }
			transformValue={ langValue }
		/>
	);

	if(withPanel) {
		const titleWithIndicator = (
			<PanelTitleIndicator
				// isColor
				title={ title ?? __('Language', 'zu-translate') }
				value={ lang }
			/>
		);
		const panelProps =pick(additionalProps, [
			'buttonProps',
			'className',
			'icon',
			'opened',
			'scrollAfterOpen',
			'initialOpen',
			'onToggle'
		]);
// Zubug.data({ titleWithIndicator, panelProps, lang });
		return (
			<PanelBody
				title={ titleWithIndicator }
				// onToggle={ onPanelToggle }
				// initialOpen={ initialOpen }
				{ ...panelProps }
			>
				{ langControl }
			</PanelBody>
		);
	}
	return langControl;
}

LangControl.Panel = props => <LangControl withPanel { ...props }/>;
export default LangControl;


// "prettier": "^2.4.1",
// "typescript": "^4.5.2"
// "@wordpress/eslint-plugin": "^7.4.0",
