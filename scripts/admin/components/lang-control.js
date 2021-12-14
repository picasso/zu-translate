// WordPress dependencies

const { map } = lodash; // split, padEnd, trimEnd
const { __ } = wp.i18n;
const { PanelBody } = wp.components; // , TextControl, Dropdown, Button

// Import debug object and make it available from global scope
window.Zubug = { ...(wp.zukit.debug  || {}) };

// Zukit dependencies

const { SelectItemControl } = wp.zukit.components;

// Internal dependencies

const { language_config: config } = window.qTranslateConfig ?? {};
const langOptions = map(config, (data, key) => ({ value: key, label: data.name }));

const langPrefix = 'components-zu-lang-control';

function transformLangValue(value, label, style) {
	return (
		<span className="__lang" style={ style }>{ label }</span>
	);
}

// Zubug.data({ langOptions });

const LangControl = ({
	title,
	lang = 'en',
	onClick,
	withPanel,
}) => {

	const langControl = (
		<SelectItemControl
			className={ langPrefix }
			// withLabels
			options={ langOptions }
			selectedItem={ lang }
			onClick={ onClick }
			transformValue={ transformLangValue }
		/>
	);

	return !withPanel ? langControl : (
		<PanelBody title={ title || __('Language') }>
			{ langControl }
		</PanelBody>
	);
}

LangControl.Panel = props => <LangControl withPanel { ...props }/>;
export default LangControl;


// "prettier": "^2.4.1",
// "typescript": "^4.5.2"
// "@wordpress/eslint-plugin": "^7.4.0",
