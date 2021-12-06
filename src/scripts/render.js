// WordPress dependencies

const { get, set, map, has, forEach, defaultsDeep } = lodash;
const { __ } = wp.i18n;
const { render, Fragment } = wp.element;
const { ToggleControl, SelectControl, Button } = wp.components;

// Internal dependencies

import { externalData, checkDependency, simpleMarkdown } from './utils.js';
import { setRestRouter } from './fetch.js';
import ZukitSkeleton from './components/skeleton.js'
import ZukitDivider from './components/divider.js'

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

export function toggleOption(toggleData, options, updateOptions, withPath = null) {
	const fullKey = k => withPath ? `${withPath}.${k}` : k;
	const optionValue = k => get(options, fullKey(k)); //  withPath ? `${withPath}.${k}` : k

	return map(toggleData, (item, key) => checkDependency(item, options, false, withPath) &&
		<Fragment key={ key }>
			{ checkDivider(item) &&
				<ZukitDivider
					size={ item.divider }
				/>
			}
			<ToggleControl
				label={ item.label }
				help={ simpleMarkdown(item.help, { br: true }) }
				checked={ !!optionValue(key) }
				onChange={ () => updateOptions({ [fullKey(key)]: !optionValue(key) }) }
			/>
		</Fragment>
	);
}

export function selectOption(optionData, options, updateOptions, withPath = null) {

	const { id = '?', options: selectOptions = [], label = '', help, defaultValue } = optionData;
	const selectId = withPath ? `${withPath}.${id}` : id;
	const value = get(options, selectId, defaultValue);

	return (checkDependency(optionData, options, false, withPath) &&
		<>
			{ checkDivider(optionData) &&
				<ZukitDivider
					size={ optionData.divider }
				/>
			}
			<label className="components-base-control__label __select_label" htmlFor={ id }>
				{ label }
			</label>
			<div className="__select_block">
				<div className="__select_control">
					<SelectControl
						id={ id }
						value={ value }
						onChange={ value => updateOptions({ [selectId]: value }) }
						options={ selectOptions }
					/>
					{ defaultValue !== undefined &&
						<Button
							isSecondary
							className="__reset"
							onClick={ () => updateOptions({ [selectId]: defaultValue }) }
						>
							{ __('Reset', 'zukit') }
						</Button>
					}
				</div>
				<p className="components-base-control__help">{ simpleMarkdown(help, { br: true }) }</p>
			</div>
		</>
	);
}

export function testComponentWithUpdate(component, updateOptions) {

	const TestComponent = get(wp, `zukit.components.${component}`);
	return !TestComponent ? null : (
		<TestComponent updateOptions={ updateOptions }/>
	);
}

// Subset of functions for 'zukit-blocks'
export const blocksSet = {
	toggleOption,
	selectOption,
};
