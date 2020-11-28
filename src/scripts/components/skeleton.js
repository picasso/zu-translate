// WordPress dependencies

const { keys, has, get, includes, forEach, omit, reduce, first, castArray } = lodash;
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
		<div className={ `${cprefix} edit-post-layout is-mode-visual is-sidebar-opened block-editor-editor-skeleton` }>
			<div className="block-editor-editor-skeleton__body">
				<div
					className="block-editor-editor-skeleton__content"
					role="region"
					aria-label="Settings content"
					tabIndex="-1"
					style={ backdropColor && { backgroundColor: backdropColor } }
				>
					<div className="components-editor-notices__dismissible">
						{ noticeUI }
					</div>
					<div className="edit-post-visual-editor editor-styles-wrapper" tabIndex="-1">
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
					className="block-editor-editor-skeleton__sidebar"
					role="region"
					aria-label="Plugin settings"
					tabIndex="-1"
				>
					<div>
						<div className="edit-post-sidebar">
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
