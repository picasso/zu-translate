// WordPress dependencies

const { keys, has, get, includes, isEmpty, forEach, omit, reduce, first, castArray } = lodash;
const { __ } = wp.i18n;
const { compose } = wp.compose;
const { RawHTML } = wp.element;
const { BlockIcon } = wp.blockEditor;
const { withNotices, SlotFillProvider } = wp.components;
const { useState, useCallback, useEffect, useMemo } = wp.element;

// Internal dependencies

import { ajaxDoAction } from './../fetch.js';
import { compareVersions } from './../utils.js';
import { useOptions } from './../hooks/use-options.js';
import { usePanels } from './../hooks/use-panels.js';
import NoticesContext from './../hooks/use-notices.js';
import ZukitSidebar from './sidebar.js';

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

function editorClasses(element, more = '', wp = null) {
	const layout = 'edit-post-layout is-mode-visual is-sidebar-opened';
	const prefix50 = 'block-editor-editor-skeleton';
	const prefix55 = 'interface-interface-skeleton';
	const prefixZu = 'zukit-skeleton';

	let classes = `${prefix50}__${element} ${prefix55}__${element} ${prefixZu}__${element}`;
	if(isEmpty(element)) {
		const ver = isEmpty(wp) ? '' : wp.replace(/\./g, '_');
		const v2digs = 'wp_' + ver.replace(/(\d+_\d+)_\d+/g, '$1');
		const verClass = `wp_${ver}${ver !== v2digs ? ' '+v2digs : ''}` + (compareVersions(wp, '5.4') < 0 ? ' wp_less_5_4' : '');
		classes = `${verClass} ${prefix50} ${prefix55} ${prefixZu} ${layout}`;
	} else if(element === 'editor') classes = `${prefixZu}__${element}`;

	return (`${classes} ${more}`).trim();
}

// Zukit Skeleton Component

const cprefix = 'zukit-skeleton';

const ZukitSkeleton = ({
		id,
		wp,
		edit: EditComponent,
		options: initialOptions = {},
		panels: initialPanels = {},
		info = {},
		actions,
		inhouse,
		noticeUI,
		noticeOperations = {},
		...moreParams
}) => {

	const { createNotice } = noticeOperations;
	const [moreInfo, setMoreInfo] = useState(info.more || {});
	const [loading, setLoading] = useState(
		// create object {action_value: state} from 'actions'
		reduce(actions, (acc, val) => (acc[val.value] = false, acc),
			// from 'inhouse.actions'
			reduce(inhouse.actions, (acc, val) => (acc[val.value] = false, acc), {}))
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
	const [getPanel, setPanel, PanelsContext] = usePanels(initialPanels, createNotice, inhouse);

	// function that allows you to selectively reset options to their original values
	// first get all initial values through 'ajaxAction', and then create an object with updates
	// and calls 'updateOptions'. Accepts an array of keys (or one key as string) as an argument
	// and 'afterCallback', which will be called after the options are updated
	const resetOptions = useCallback((toBeReset, afterCallback = null) => {
		ajaxAction('default_options', options => {
			const update = reduce(castArray(toBeReset), (acc, value) => {
				const resetValue = get(options, value, null);
				if(resetValue !== null) acc[value] = resetValue;
				return acc;
			}, {});
			updateOptions(update, false, afterCallback);
		});
	}, [ajaxAction, updateOptions]);

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

	// additional data that was passed to the script from the PHP code
	// they are practically unchanged and therefore we Memoize them
	const moreData = useMemo(() => {
		return omit(moreParams, ['router', 'noticeList']);
	}, [moreParams]);

	const pluginOptionsEdit = !EditComponent ? null : (
		<NoticesContext.Provider value={ noticeOperations }>
			<PanelsContext.Provider value={ getPanel }>
				<EditComponent
					id={ id }
					wp={ wp }
					info={ info }
					title={ __('General Settings', 'zukit') }
					options={ options }
					updateOptions={ updateOptions }
					resetOptions={ resetOptions }
					ajaxAction={ ajaxAction }
					noticeOperations={ noticeOperations }
					setUpdateHook={ setUpdateHook }
					moreData={ moreData }
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
		<div className={ editorClasses(null, cprefix, wp) }>
			<div className={ editorClasses('body') }>
				<SlotFillProvider>
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
									wp={ wp }
									icon={ pluginIcon }
									more={ moreInfo }
									actions={ actions }
									actionLoading={ loading }
									inhouse={ inhouse }
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
				</SlotFillProvider>
			</div>
		</div>
	);
}

export default compose([
	withNotices,
])(ZukitSkeleton);
