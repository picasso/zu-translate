// WordPress dependencies

const { get, set, map, has, forEach, defaultsDeep } = lodash;
const { __ } = wp.i18n;
const { render, Fragment } = wp.element;
const { ToggleControl, SelectControl, Button } = wp.components;

// Internal dependencies

import { externalData, checkDependency } from './utils.js';
import ZukitSkeleton from './components/skeleton.js'
import ZukitDivider from './components/divider.js'

const debugPanelKey = '_debug';

export function renderPlugin(pluginId, settings = {}) {

	const pluginData = externalData(`${pluginId}_settings`);

	if(get(settings, 'panels') !== undefined) {
		// Add 'Debug Actions' panel defaults
		defaultsDeep(settings.panels, {
			[debugPanelKey]: { label: __('Debug Actions', 'zumedia'), value: false },
		});
		// Sync 'panels' with saved 'options' if presented
		if(get(pluginData, 'options.panels') !== undefined) {
			const { options: { panels } } = pluginData;
			forEach(panels, (value, key) => set(settings, `panels.${key}.value`, value));
		}
	}

	if(document.getElementById(pluginId) !== null) {
		render(
			<ZukitSkeleton id={ pluginId } { ...pluginData } { ...settings }/>,
			document.getElementById(pluginId)
		);
	}
}

function checkDivider(item) {
	return has(item, 'divider') ? true : null;
}

export function toggleOption(toggleOptions, options, updateOptions, withPath = null) {
	const optionValue = k => get(options, withPath ? `${withPath}.${k}` : k);

	return map(toggleOptions, (item, key) => checkDependency(item, options) &&
		<Fragment key={ key }>
			<ToggleControl
				label={ item.label }
				help={ item.help  }
				checked={ !!optionValue(key) }
				onChange={ () => updateOptions({ [key]: !optionValue(key) }) }
			/>
			{ checkDivider(item, options) &&
				<ZukitDivider
					size={ item.divider }
				/>
			}
		</Fragment>
	);
}

export function selectOption(value, option, updateOptions) {

	const { id, options = [], label = '', help, defaultValue } = option;
	return (
		<>
			<label className="components-base-control__label __select_label" htmlFor={ id }>
				{ label }
			</label>
			<div className="__select_block">
				<div className="__select_control">
					<SelectControl
						id={ id }
						value={ value }
						onChange={ value => updateOptions({ [id]: value }) }
						options={ options }
					/>
					<Button
						isSecondary
						className="__reset"
						onClick={ () => updateOptions({ [id]: defaultValue }) }
					>
						{ __('Reset') }
					</Button>
				</div>
				<p className="components-base-control__help">{ help }</p>
			</div>
		</>
	);
}
