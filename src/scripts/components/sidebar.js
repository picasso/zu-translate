// WordPress dependencies

const { get, map, isEmpty, isNil, omitBy } = lodash;
const { __ } = wp.i18n;
const { Fragment, useCallback } = wp.element;
const { PanelBody, PanelRow, Button, ExternalLink, ToggleControl, Spinner } = wp.components;

// Internal dependencies

import { mergeClasses, checkDependency } from './../utils.js';

// Zukit Sidebar Component

const ZukitSidebar = ({
		// id,
		version,
		title,
		author,
		link,
		description,
		icon = null,
		more,

		actions,
		actionLoading,
		debug,
		ajaxAction,

		options,
		updateOptions,

		panels,
		updatePanels,
		// noticeOperations = {},
}) => {

	const moreItems = omitBy(more, isNil);
	const pluginActions = omitBy(actions, isNil);
	const debugActions = omitBy(debug, isNil);

	const hasMoreItems = !isEmpty(moreItems);
	const hasActions = !isEmpty(pluginActions);
	const hasDebugActions = !isEmpty(debugActions) && get(panels, '_debug.value') === true;
	const hasPanels = !isEmpty(panels);

	const resetOptions = useCallback(() => {
		ajaxAction('reset_options', options => updateOptions(options, true));
	}, [ajaxAction, updateOptions]);

	return (

			<div className="block-editor-block-inspector">
				<div className="block-editor-block-card">
					{ icon }
					<div className="block-editor-block-card__content">
						<h2 className="block-editor-block-card__title">
							{ title }
						</h2>
						<span className="block-editor-block-card__description">
						{ description }
						</span>
					</div>
				</div>
				<PanelBody title={ __('Plugin Info') } initialOpen={ false }>
					<PanelRow>
						<span>{ __('Version') }</span>
						<span>{ version }</span>
					</PanelRow>
					<PanelRow>
						<span>{ __('Author') }</span>
						<ExternalLink href={ link }>{ author }</ExternalLink>
					</PanelRow>
					{ hasMoreItems && map(moreItems, ({ label, value, link }, moreKey) =>
							<PanelRow key={ moreKey }>
								<span>{ label }</span>
								{ link ?
									<ExternalLink href={ link }>{ value }</ExternalLink>
									:
									<span>{ value }</span>
								}
							</PanelRow>
					) }
					<PanelRow>
						<Button
							className="__plugin_actions admin-blue"
							icon={ 'admin-settings' }
							isSecondary
							isLarge
							onClick={ resetOptions }
						>
							{ __('Reset Plugin Options') }
						</Button>
					</PanelRow>
				</PanelBody>
				{ hasActions &&
					<PanelBody title={ __('Actions') } initialOpen={ true }>
						{ map(pluginActions, ({ label, value, icon, color, help, depends }, actionKey) => (
							checkDependency(depends, options, true) &&
								<Fragment key={ actionKey }>
									<PanelRow>
										<Button
											className={ mergeClasses('__plugin_actions', {
												[color]: color,
												'is-loading': get(actionLoading, value),
												})
											}
											icon={ icon }
											isSecondary
											isLarge
											onClick={ () => ajaxAction(value) }
										>
											{ label }
											{ get(actionLoading, value) && <Spinner/> }
										</Button>
									</PanelRow>
									{ help && <p className={ mergeClasses('__help', { [color]: color }) }>{ help }</p> }
								</Fragment>
							)
						) }
					</PanelBody>
				}
				{ hasPanels &&
					<PanelBody title={ __('Screen Options') } initialOpen={ false }>
						{ map(panels, ({ label, value, help }, panelKey) =>
							<ToggleControl
								key={ panelKey }
								label={ label }
								help={ help  }
								checked={ value }
								onChange={ () => updatePanels({ [panelKey]: !value }) }
							/>
						) }
					</PanelBody>
				}
				{ hasDebugActions &&
					<PanelBody title={ __('Debug Actions') } initialOpen={ false }>
						{ map(debugActions, ({ label, value, icon, color }, actionKey) =>
							<PanelRow key={ actionKey }>
								<Button
									className={ mergeClasses('__plugin_actions', { [color]: color }) }
									icon={ icon }
									isSecondary
									isLarge
									onClick={ () => ajaxAction(value) }
								>
									{ label }
								</Button>
							</PanelRow>
						) }
					</PanelBody>
				}
				</div>
	);
}

export default ZukitSidebar;
