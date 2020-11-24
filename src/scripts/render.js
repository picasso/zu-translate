// WordPress dependencies

const { get, set, map, has, forEach, defaultsDeep } = lodash;
const { __ } = wp.i18n;
const { render, Fragment } = wp.element;
const { ToggleControl, SelectControl, Button } = wp.components;

// Internal dependencies

import { externalData, checkDependency } from './utils.js';
import { setRestRouter } from './fetch.js';
import ZukitSkeleton from './components/skeleton.js'
import ZukitDivider from './components/divider.js'

// const debugPanelKey = '_debug';

export function renderPage(pageId, settings = {}) {

	const pageData = externalData(`${pageId}_settings`);

	// restRouter serves to identify the plugin/theme that currently uses the REST API
	setRestRouter(pageData.router);

	if(get(settings, 'panels') !== undefined) {
		// Get 'debug' options key
		const debugPanelKey = get(pageData, 'debug.prefix', null);
		// Add 'Debug Actions' panel defaults if 'debug' key is found
		if(debugPanelKey !== null) {
			defaultsDeep(settings.panels, {
				[debugPanelKey]: { label:  __('Debug Plugin', 'zukit'), value: false },
			});
		}
		// Sync 'panels' with saved 'options' if presented
		if(get(pageData, 'options.panels') !== undefined) {
			const { options: { panels } } = pageData;
			forEach(panels, (value, key) => set(settings, `panels.${key}.value`, value));
		}
	}

	if(document.getElementById(pageId) !== null) {
		render(
			<ZukitSkeleton id={ pageId } { ...pageData } { ...settings }/>,
			document.getElementById(pageId)
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
