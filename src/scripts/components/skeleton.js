// WordPress dependencies

const {
	keys,
	has,
	get,
	set,
	includes,
	forEach,
	pickBy,
	omit,
	mapValues,
	reduce,
	first,
	castArray,
} = lodash;
const { __ } = wp.i18n;
const { compose } = wp.compose;
const { RawHTML } = wp.element;
const { BlockIcon } = wp.blockEditor;
const { withNotices } = wp.components;
const { useState, useCallback, useRef, useEffect } = wp.element;

// Internal dependencies

import { ajaxUpdateOptions, ajaxDoAction } from './../fetch.js';
import { checkDependency } from './../utils.js';
import ZukitSidebar from './sidebar.js';
import { withZukitPanel } from './panel.js';

// Zukit Skeleton Component

const cprefix = 'zukit-skeleton';

function availablePanels(panels, options) {
	return pickBy(panels, p => checkDependency(p, options));
}

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
	const hooks = useRef(null);
	const [options, setOptions] = useState(initialOptions);
	const [panels, setPanels] = useState(initialPanels);
	const [moreInfo, setMoreInfo] = useState(info.more || {});
	const [loading, setLoading] = useState(
		// create object {action_value: state}
		reduce(actions, (acc, val) => (acc[val.value] = false, acc), {})
	);

	const updateLoading = useCallback(update => {
		const updateKey = first(keys(update));
		// update only if we have this 'key' in 'loading'
		if(has(loading, updateKey)) {
			setLoading(prevLoading => ({ ...(prevLoading || {}), ...(update || {}) }));
		}
	}, [loading]);

	const updateOptions = useCallback((update, reset = false) => {
		// если 'reset' is true - вызываем c null вместо 'keys' что приведет к проверке всех 'hooks'
		if(reset) {
			ajaxUpdateOptions(null, { prev: options, next: update }, null, hooks.current);
		} else {
			ajaxUpdateOptions(keys(update), update, createNotice, hooks.current);
			// используем функцию 'set' вместо простого присвоения, потому что 'key'
			// может представлять из себя 'path'
			forEach(update, (value, key) => set(options, key, value));
		}
		// если 'reset' is true - просто обновляем state значением из 'update'
		setOptions({ ...(reset ? update : options) });
	}, [options, createNotice]);

	const ajaxAction = useCallback((params, callback) => {
		ajaxDoAction(params, callback, createNotice, updateLoading);
	}, [createNotice, updateLoading]);

	const updatePanels = useCallback(update => {
		// используем функцию 'set' чтобы поменять только 'value', а не весь объект
		forEach(update, (value, key) => set(panels, `${key}.value`, value));
		// не используем функцию 'setOptions' чтобы не вызывать не нужное обновление 'options'
		// чтоб приведет к излишним renders - нам нужно только сохранить 'panels' в базе
		ajaxUpdateOptions('panels', mapValues(panels, p => p.value), createNotice);
		setPanels({ ...panels });
	}, [panels, createNotice]);

	const setUpdateHook = useCallback((key, callback) => {
		var keys = castArray(key);
		// create object for all keys {key: callback}
		var callbacks = reduce(keys, (acc, val) => (acc[val] = callback, acc), {});
		hooks.current = { ...(hooks.current || {}), ...callbacks };
	}, []);

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

	const pluginEdit = !EditComponent ? null : (
		<EditComponent
			id={ id }
			info={ info }
			title={ `${info.title} ${__('Settings')}` }
			// panels={ panels }
			options={ options }
			zukitPanel={ withZukitPanel(panels) }
			updateOptions={ updateOptions }
			ajaxAction={ ajaxAction }
			noticeOperations={ noticeOperations }
			setUpdateHook={ setUpdateHook }
		/>
	);

	const pluginIcon = !info.icon ? null : (
		<BlockIcon
			icon={ <RawHTML>{ info.icon }</RawHTML> }
			showColors
		/>
	);

	return (
		<>
			<div className={ `${cprefix} edit-post-layout is-mode-visual is-sidebar-opened block-editor-editor-skeleton` }>
				<div className="block-editor-editor-skeleton__body">
					<div
						className="block-editor-editor-skeleton__content"
						role="region"
						aria-label="Settings content"
						tabIndex="-1"
					>
						<div className="components-editor-notices__dismissible">
							{ noticeUI }
						</div>
						<div className="edit-post-visual-editor editor-styles-wrapper" tabIndex="-1">
							<div className="block-editor-block-list__layout">
								<div className="wp-block block-editor-block-list__block">
									<div className="editor-post-title">
										<div className="wp-block editor-post-title__block">
											<h1>{ info.title }</h1>
											{ pluginIcon }
										</div>
									</div>
									{ pluginEdit }
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

									panels={ availablePanels(panels, options) }
									updatePanels={ updatePanels }

									noticeOperations={ noticeOperations }
									{ ...omit(info, ['icon', 'more']) }
								/>
							</div>
						</div>
					</div>
				</div>
			</div>

		</>
	);
}

export default compose([
	withNotices,
])(ZukitSkeleton);
