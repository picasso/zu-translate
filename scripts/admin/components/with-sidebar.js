// WordPress dependencies

const { forEach, isString, isNil, isEmpty, noop, filter, merge, transform } = lodash;
const { createHigherOrderComponent, compose } = wp.compose;
const { PluginSidebarMoreMenuItem, PluginDocumentSettingPanel, PluginPostStatusInfo, PluginSidebar } = wp.editPost;
const { Fill, PanelBody } =  wp.components;
const { withSelect, withDispatch } = wp.data;

// Higher-order component which renders the original component inside requested SlotFills

const withSidebarPlugin = createHigherOrderComponent(
	(WrappedComponent) => (ownProps) => {

		const {
			className,
			name,
			title,
			icon,
			slot = 'setting', 			// kind of SlotFills which will be used:
										//	'setting'		- 	PluginDocumentSettingPanel
										//	'sidebar'		-	PluginSidebar
										//	'status'		-	PluginPostStatusInfo
										//	'<slot name>'	-	Panel inside sidebar Slot
			moreItem = false,
			moreTitle,
			moreIcon,

			metaValues,
			allowEmptyValues = true,
			initialOpen = true,

		} = ownProps;

		// when allowEmptyValues is false and metaValues are empty (undefined or null) - nothing will be rendered
		if(!allowEmptyValues && (isNil(metaValues) || isEmpty(filter(metaValues)))) return null;

		if(slot == 'status') return (
			<PluginPostStatusInfo>
				<WrappedComponent { ...ownProps } />
			</PluginPostStatusInfo>
		);

		if(slot == 'setting') return (
			<PluginDocumentSettingPanel
				name={ name }
				title={ title }
				className={ className }
			>
				<WrappedComponent { ...ownProps } />
			</PluginDocumentSettingPanel>
		);

		if(slot == 'sidebar') return (
			<>
				{ moreItem &&
					<PluginSidebarMoreMenuItem
						target={ name }
						icon={ moreIcon }
					>
						{ moreTitle || title }
					</PluginSidebarMoreMenuItem>
				}
				<PluginSidebar
					name={ name }
					title={ title }
					icon={ icon }
					className={ className }
				>
					<WrappedComponent { ...ownProps } />
				</PluginSidebar>
			</>
		);

		// otherwise fill in the requested slot
		return (
			<Fill
				name={ slot }
				className={ className }
			>
				<PanelBody initialOpen={ initialOpen } title={ title }>
					<WrappedComponent { ...ownProps } />
				</PanelBody>
			</Fill>
		);
	},
	'withSidebarPlugin'
);

const withSidebar = (sidebarProps) =>
	compose([
		// get Sidebar props
		createHigherOrderComponent(
			(WrappedComponent) => (ownProps) => {
				return <WrappedComponent { ...ownProps } { ...sidebarProps } />;
			},
			'withSidebarProps'
		),
		// get meta values by keys
		withSelect(( select, { metaKeys }) => {

			// if metaKeys is null or missing(empty) - do nothing
			if(isEmpty(metaKeys))	return { metaValues: null, meta: null };

			// metaValues	- object { key: value }
			// meta:		- value of first key in metaKeys array, more often than not - this is the only value

			const { getEditedPostAttribute } = select('core/editor');
			const metaValues = isString(metaKeys) ?
				{ [metaKeys]: getEditedPostAttribute('meta')[metaKeys] }
			:
				transform(metaKeys, (values, key)  => {
					values[key] = getEditedPostAttribute('meta')[key];
				}, {});

			return {
				meta: metaValues[isString(metaKeys) ? metaKeys : metaKeys[0]],
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

			// setMetaValue(object)				- updates meta in the current post for the first key in metaKeys array,
			// 										more often than not - this is the only key
			// setMetaAttributes(object)		- updates attributes for the first key in metaKeys array
			//
			// setMetaValues(object)			- updates meta in the current post from single object { metKey: value }

			const { editPost } = dispatch( 'core/editor' );
			// const updateValue = ;
			const firstKey = isString(metaKeys) ? metaKeys : metaKeys[0];

			return {
				createNotice,
				setMetaValue: value => editPost({ meta: { [firstKey]: value }}),
				setMetaAttributes: attributes => editPost({ meta: { [firstKey]: merge({}, meta, attributes) } }),
				setMetaValues: values => forEach(values, (value, key) => editPost({ meta: { [key]: value }}) ),
			};
		}),
		withSidebarPlugin,
	]);

export default withSidebar;
