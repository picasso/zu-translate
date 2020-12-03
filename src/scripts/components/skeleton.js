// WordPress dependencies

const { keys, has, get, includes, isEmpty, forEach, omit, reduce, first, castArray } = lodash;
const { __ } = wp.i18n;
const { compose } = wp.compose;
const { RawHTML } = wp.element;
const { BlockIcon } = wp.blockEditor;
const { withNotices } = wp.components;
const { useState, useCallback, useEffect } = wp.element;

// Internal dependencies

import { ajaxDoAction } from './../fetch.js';
import { useOptions } from './../hooks/use-options.js';
import { usePanels } from './../hooks/use-panels.js';
import NoticesContext from './../hooks/use-notices.js';
import ZukitSidebar from './sidebar.js';

// Zukit Skeleton Component

const cprefix = 'zukit-skeleton';

function editorClasses(element, more = '') {
	const layout = 'edit-post-layout is-mode-visual is-sidebar-opened';
	const prefix50 = 'block-editor-editor-skeleton';
	const prefix55 = 'interface-interface-skeleton';
	const prefixZu = 'zukit-skeleton';

	let classes = `${prefix50}__${element} ${prefix55}__${element} ${prefixZu}__${element}`;
	if(isEmpty(element)) classes = `${prefix50} ${prefix55} ${prefixZu} ${layout}`;
	else if(element === 'editor') classes = `${prefixZu}__${element}`;

	return (`${classes} ${more}`).trim();
}

// const editorClasses = {
// 	skeleton: 'block-editor-editor-skeleton',
// 	body: 'block-editor-editor-skeleton__body',
// 	content: 'block-editor-editor-skeleton__content',
// 	sidebar: 'block-editor-editor-skeleton__sidebar',
// };
//
// const editorClasses55 = {
// 	skeleton: 'interface-interface-skeleton',
// 	body: 'interface-interface-skeleton__body',
// 	content: 'interface-interface-skeleton__content',
// 	sidebar: 'interface-interface-skeleton__sidebar',
// };


const ZukitSkeleton = ({
		id,
		edit: EditComponent,
		options: initialOptions = {},
		panels: initialPanels = {},
		info = {},
		actions,
		debug,
		noticeUI,
		noticeOperations = {},
}) => {

	const { createNotice } = noticeOperations;
	const [moreInfo, setMoreInfo] = useState(info.more || {});
	const [loading, setLoading] = useState(
		// create object {action_value: state} from 'actions'
		reduce(actions, (acc, val) => (acc[val.value] = false, acc),
			// from 'debug.actions'
			reduce(debug.actions, (acc, val) => (acc[val.value] = false, acc), {}))
	);

	const updateLoading = useCallback(update => {
		const updateKey = first(keys(update));
		// update only if we have this 'key' in 'loading'
		if(has(loading, updateKey)) {
			setLoading(prevLoading => ({ ...(prevLoading || {}), ...(update || {}) }));
		}
	}, [loading]);

	// create 'options' and setter
	const [options, updateOptions, setUpdateHook] = useOptions(initialOptions, createNotice);
	// create getter and setter for 'panels'
	const [getPanel, setPanel, PanelsContext] = usePanels(initialPanels, createNotice);

	const ajaxAction = useCallback((params, callback) => {
		ajaxDoAction(params, callback, createNotice, updateLoading);
	}, [createNotice, updateLoading]);

	// set hooks to update info.more items when dependency keys (in 'depends') are updated in 'options'
	useEffect(() => {
		const infoKeys = reduce(moreInfo, (acc, value) => {
			forEach(castArray(get(value, 'depends', [])), val => includes(acc, val) ? null : acc.push(val));
			return acc;
		}, []);

		setUpdateHook(infoKeys, () => {
			ajaxAction('zukit_more_info', infoData => {
				setMoreInfo(get(infoData, 'more', {}));
			});
		});
	}, [moreInfo, setUpdateHook, ajaxAction]);

	const pluginOptionsEdit = !EditComponent ? null : (
		<NoticesContext.Provider value={ noticeOperations }>
			<PanelsContext.Provider value={ getPanel }>
				<EditComponent
					id={ id }
					info={ info }
					title={ `${info.title} ${__('Settings', 'zukit')}` }
					options={ options }
					updateOptions={ updateOptions }
					ajaxAction={ ajaxAction }
					noticeOperations={ noticeOperations }
					setUpdateHook={ setUpdateHook }
				/>
			</PanelsContext.Provider>
		</NoticesContext.Provider>
	);

	const pluginIcon = !info.icon ? null : (
		<BlockIcon
			icon={ <RawHTML>{ info.icon }</RawHTML> }
			showColors
		/>
	);

	// custom appearance
	const backdropColor = get(info, 'colors.backdrop');
	const headerColor = get(info, 'colors.header');
	const titleColor = get(info, 'colors.title');

	return (
		<div className={ editorClasses(null, cprefix) }>
			<div className={ editorClasses('body') }>
				<div
					className={ editorClasses('content') }
					role="region"
					aria-label="Settings content"
					tabIndex="-1"
					style={ backdropColor && { backgroundColor: backdropColor } }
				>
					<div className="components-editor-notices__dismissible">
						{ noticeUI }
					</div>
					<div className={ editorClasses('editor', 'editor-styles-wrapper') } tabIndex="-1">
						<div className="block-editor-block-list__layout">
							<div className="wp-block block-editor-block-list__block">
								<div className="editor-post-title" style={ headerColor && { backgroundColor: headerColor } }>
									<div className="wp-block editor-post-title__block">
										<h1
											style={ titleColor && { color: titleColor } }
										>
											{ info.title }
										</h1>
										{ pluginIcon }
									</div>
								</div>
								{ pluginOptionsEdit }
							</div>
						</div>
					</div>
				</div>
				<div
					className={ editorClasses('sidebar') }
					role="region"
					aria-label="Plugin settings"
					tabIndex="-1"
				>
					<div>
						<div className="interface-complementary-area edit-post-sidebar">
							<ZukitSidebar
								id={ id }
								icon={ pluginIcon }
								more={ moreInfo }
								actions={ actions }
								actionLoading={ loading }
								debug={ debug }
								ajaxAction={ ajaxAction }

								options={ options }
								updateOptions={ updateOptions }

								getPanel={ getPanel }
								setPanel={ setPanel }

								{ ...omit(info, ['icon', 'more']) }
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default compose([
	withNotices,
])(ZukitSkeleton);
