// WordPress dependencies

const { __ } = wp.i18n;

// className,
// name,
// title,
// icon,
// slot         kind of SlotFills which will be used:
//              'setting'       - PluginDocumentSettingPanel
//              'sidebar'       - PluginSidebar
//              'status'        - PluginPostStatusInfo
//	            '<slot-name>'   - Panel inside sidebar Slot with this name,
//                                NB! attribute 'slot' should be equal to the name when Slot was added
// moreItem,
// moreTitle,
// moreIcon,
// allowEmptyValues,        when false and metaValues are empty (undefined or null) - nothing will be rendered
// initialOpen

const metadata = {
    slot: 'setting',
    name: 'zu-language',
    title: __('Language', 'zu-translate'),
};

export default metadata;
