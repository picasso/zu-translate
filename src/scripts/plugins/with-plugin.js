// WordPress dependencies

const { forEach, isString, isNil, isEmpty, isFunction, noop, filter, merge, transform, castArray } = lodash;
const { createHigherOrderComponent, compose } = wp.compose;
const { PluginSidebarMoreMenuItem, PluginDocumentSettingPanel, PluginPostStatusInfo, PluginSidebar } = wp.editPost;
const { Fill, PanelBody } = wp.components;
const { withSelect, withDispatch } = wp.data;

// Internal dependencies

import { useForceUpdater } from './../data/use-store.js';

// Higher-order component which renders the original component inside requested SlotFills

export const withSidebarPlugin = createHigherOrderComponent(
	(WrappedComponent) => (ownProps) => {

		const {
			className,
			name,
			icon,

			title,						// 'title' can be a React component and then the component will be created with 'titleProps'
			titleProps,					// 'titleProps' can be a function and then it will be called and
										// its result will be used as a props for the 'title' component

			slot = 'setting', 			// kind of SlotFills which will be used:
										//	'setting'		- 	PluginDocumentSettingPanel
										//	'sidebar'		-	PluginSidebar
										//	'status'		-	PluginPostStatusInfo
										//	'<slot name>'	-	Panel inside sidebar Slot
										//   NB! attribute 'slot' should be equal to the name when Slot was created
			moreItem = false,
			moreTitle,
			moreIcon,

			metaValues,
			// metaKeys,     			// string|array (usually passed as part of metadata when calling 'withPluginMeta')
										// if metaKeys is null or missing - meta data will not be requested
										// and functions for updating them will not be created

			allowEmptyValues = true,	// when false and metaValues are empty (undefined or null) - nothing will be rendered
			initialOpen = true,

		} = ownProps;

		// we pass to the 'WrappedComponent' a function that allows us to update the parent component
		const forceUpdate = useForceUpdater();

		// when 'allowEmptyValues' is false and 'metaValues' are empty (undefined or null) - nothing will be rendered
		if(!allowEmptyValues && (isNil(metaValues) || isEmpty(filter(metaValues)))) return null;
		// if 'title' is a React component - then create the component with 'titleProps'
		const titleElement = isFunction(title) ? title(isFunction(titleProps) ? titleProps() : titleProps) : title;

		if(slot === 'status') return (
			<PluginPostStatusInfo>
				<WrappedComponent forceUpdate={ forceUpdate } { ...ownProps } />
			</PluginPostStatusInfo>
		);

		if(slot === 'setting') return (
			<PluginDocumentSettingPanel
				name={ name }
				title={ titleElement }
				className={ className }
			>
				<WrappedComponent forceUpdate={ forceUpdate } { ...ownProps } />
			</PluginDocumentSettingPanel>
		);

		if(slot === 'sidebar') return (
			<>
				{ moreItem &&
					<PluginSidebarMoreMenuItem
						target={ name }
						icon={ moreIcon }
					>
						{ moreTitle || titleElement }
					</PluginSidebarMoreMenuItem>
				}
				<PluginSidebar
					name={ name }
					title={ titleElement }
					icon={ icon }
					className={ className }
				>
					<WrappedComponent forceUpdate={ forceUpdate } { ...ownProps } />
				</PluginSidebar>
			</>
		);

		// otherwise fill in the requested slot
		return (
			<Fill
				name={ slot }
				className={ className }
			>
				<PanelBody initialOpen={ initialOpen } title={ titleElement }>
					<WrappedComponent forceUpdate={ forceUpdate } { ...ownProps } />
				</PanelBody>
			</Fill>
		);
	},
	'withSidebarPlugin'
);

export const withPlugin = (pluginProps) => compose([
	// get Plugin props
	createHigherOrderComponent(
		(WrappedComponent) => (ownProps) => {
			return <WrappedComponent { ...ownProps } { ...pluginProps } />;
		},
		'withPlugin'
	),
	withSidebarPlugin,
]);

export const withPluginMeta = (pluginProps) => compose([
	// get plugin props
	createHigherOrderComponent(
		(WrappedComponent) => (ownProps) => {
			return <WrappedComponent { ...ownProps } { ...pluginProps } />;
		},
		'withPluginAndMeta'
	),
	// get meta values by keys
	withSelect(( select, { metaKeys }) => {
		// if metaKeys is null or missing(empty) - do nothing
		if(isEmpty(metaKeys))	return { metaValues: null, meta: null };

		const { getEditedPostAttribute } = select('core/editor');
		const metaValues = transform(castArray(metaKeys), (values, key)  => {
			values[key] = getEditedPostAttribute('meta')[key];
		}, {});

		// const metaValues = isString(metaKeys) ?
		// 	{ [metaKeys]: getEditedPostAttribute('meta')[metaKeys] }
		// :
		// 	transform(metaKeys, (values, key)  => {
		// 		values[key] = getEditedPostAttribute('meta')[key];
		// 	}, {});
		const firstKey = isString(metaKeys) ? metaKeys : metaKeys[0];
		return {
			// meta:
			// - value of first key in metaKeys array, more often than not - this is the only value
			meta: metaValues[firstKey],
			// metaValues:
			// - object { key: value }
			metaValues,
		}
	}),
	// create function to update meta
	withDispatch((dispatch, { metaKeys, meta }) => {
		// provide inteface to create notices
		const { createNotice } = dispatch('core/notices');
		// if metaKeys is null or missing(empty) -  then do nothing else
		if(isEmpty(metaKeys))	return {
			createNotice,
			setMetaValues: noop,
			setMetaValue: noop,
			setMetaAttributes: noop,
		};

		const { editPost } = dispatch( 'core/editor' );
		const firstKey = isString(metaKeys) ? metaKeys : metaKeys[0];
		return {
			createNotice,
			// setMetaValue(object)
			// - updates meta in the current post for the first key in metaKeys array,
			// 	 more often than not - this is the only key
			setMetaValue: value => editPost({ meta: { [firstKey]: value }}),
			// setMetaAttributes(object)
			// - updates attributes for the first key in metaKeys array
			setMetaAttributes: attributes => editPost({ meta: { [firstKey]: merge({}, meta, attributes) } }),
			// setMetaValues(object)
			// - updates meta in the current post from single object { metKey: value }
			setMetaValues: values => forEach(values, (value, key) => editPost({ meta: { [key]: value }}) ),
		};
	}),
	withSidebarPlugin,
]);
