// WordPress dependencies

const { isEmpty, map, get, reject, find, pick, includes, reduce } = lodash;
const { __, sprintf } = wp.i18n;
const { Popover, Button, SelectControl } = wp.components;
const { BlockIcon } = wp.blockEditor;
const { useState, useRef, useCallback } = wp.element;
const { useSelect } = wp.data;

// Zukit dependencies
// window.Zubug = { ...(wp.zukit.debug  || {}) };

const { close: closeIcon } = wp.zukit.icons;
const { getExternalData, simpleMarkdown, unescapeHtml } = wp.zukit.utils;
const { ZukitSidebar, ZukitToggle } = wp.zukit.components;

const convertPrefix = 'zutranslate_convert';
const convertIcon = 'superhero';
const splitIcon = 'star-half';
const rejectTypes = ['attachment', 'wp_block', 'nav_menu_item', 'wp_template', 'wp_template_part', 'wp_navigation'];
const loadingOptions = [{ value: 0, label: 'Loading...' }];

const enabledLangs = reduce(getExternalData('qtxlangs', {}), (options, val) => {
	options.push({ value: val.code, label: val.name, active: val.active });
	return options;
}, []);

const ZutranslateConvert = ({
		data,
		ajaxAction,
}) => {

	const [ isOpen, setIsOpen ] = useState(false);
	const [ action, setAction ] = useState('convert');

	const isConvert = action === 'convert';
	const dataRef = useRef({ types: null, posts: null });

	const [ postType, setPostType ] = useState(0);
	const [ selectLabel, setSelectLabel ] = useState('');
	const [ onlySelected, setOnlySelected ] = useState(false);
	const [ selectedId, setSelectedId ] = useState(0);
	const [ primaryLang, setPrimaryLang ] = useState(find(enabledLangs, ['active', true])?.value);

	const anchorConvertRef = useRef(null);
	const anchorSplitRef = useRef(null);

	const typeOptions = useSelect(select => {
		if(dataRef?.current.types === null) {
			const types = select('core').getPostTypes();
			if(!isEmpty(types)) {
				const selectedTypes = reject(
					map(types, t => pick(t, ['name', 'slug', 'labels'])),
					// remove unused properties and types (Media & Block)
					r => includes(rejectTypes, r.slug)
				);
				dataRef.current.types = reduce(selectedTypes, (options, val) => {
					options.push({ value: val.slug, label: val.labels.singular_name });
					return options;
				}, [{ value: 0, label: 'Select type' }]);
			}
		}
		return dataRef?.current.types ? dataRef.current.types : loadingOptions;
	});

	const selectPostLabel = isConvert ? data.convertSelect : data.splitSelect;
	const selectPostType = useCallback(value => {
		const label = find(typeOptions, { value })?.label.toLowerCase();
		setPostType(value);
		setSelectLabel([
			sprintf(selectPostLabel, label),
			sprintf(__('Select %s', 'zu-translate'), label),
		]);
		dataRef.current.posts = null;
	}, [selectPostLabel, typeOptions]);

	const { postOptions, hasResolved } = useSelect(select => {
		const { getEntityRecords, hasFinishedResolution } = select('core');
		const postsParameters = ['postType', postType];
		if(postType && onlySelected && dataRef?.current.posts === null) {
			const posts = getEntityRecords(...postsParameters);
			if(!isEmpty(posts)) {
				dataRef.current.posts = reduce(posts, (options, val) => {
					options.push({ value: val.id, label: unescapeHtml(val.title.rendered) });
					return options;
				}, [{ value: 0, label: selectLabel[1] }]);
			}
		}
		return {
			postOptions: dataRef?.current.posts,
			hasResolved: postType && onlySelected && hasFinishedResolution('getEntityRecords', postsParameters),
		};
	}, [postType, onlySelected, selectLabel]);

	const openLinkUI = useCallback(action => {
		setIsOpen(!isOpen);
		setAction(action);
	}, [isOpen]);

	const closeLinkUI = useCallback(() => {
		setIsOpen(false);
	}, []);

	const convertPost = useCallback(() => {
		setIsOpen(false);
		ajaxAction({
			action: `zutranslate_${action}_classic`,
			value: {
				id: onlySelected ? selectedId : 0,
				postType,
				primaryLang
			},
		});
	}, [action, selectedId, postType, primaryLang, onlySelected, ajaxAction]);

	const conversionDisabled = onlySelected ? selectedId === 0 : postType === 0;
	const anchorRect = get(isConvert ? anchorConvertRef : anchorSplitRef, 'current')?.getBoundingClientRect();

	return (
		<ZukitSidebar.MoreActions>
			<ZukitSidebar.ActionButton
				color="magenta"
				icon={ convertIcon }
				onClick={ () => openLinkUI('convert') }
				label={ data.convertLabel }
				help={ data.convertHelp }
				ref={ anchorConvertRef }
			/>
			<ZukitSidebar.ActionButton
				color="blue"
				icon={ splitIcon }
				onClick={ () => openLinkUI('split') }
				label={ data.splitLabel }
				help={ data.splitHelp }
				ref={ anchorSplitRef }
			/>
			{ isOpen && (
				<Popover
					position="middle left"
					noArrow={ false }
					onClose={ closeLinkUI }
					anchorRect={ anchorRect }
					focusOnMount={ false }
				>
					<div className={ convertPrefix }>
						<div className="__title">
							<BlockIcon icon={ isConvert ? convertIcon : splitIcon }/>
							<span>{ isConvert ? data.convertTitle : data.splitTitle }</span>
							<Button
								className="__close"
								icon={ closeIcon }
								onClick={ closeLinkUI }
							/>
						</div>
						<div className="__body">
							<SelectControl
								label={ isConvert ? data.convertTypeLabel : data.splitTypeLabel }
								value={ postType }
								onChange={ selectPostType }
								options={ typeOptions }
							/>
							{ !!postType &&
								<ZukitToggle
									label={ isConvert ? data.convertOnlySelected : data.splitOnlySelected }
									checked={ onlySelected }
									onChange={ () => setOnlySelected(!onlySelected) }
								/>
							}
							{ onlySelected &&
								<SelectControl
									label={ selectLabel[0] }
									value={ selectedId }
									onChange={ setSelectedId }
									options={ hasResolved ? postOptions : loadingOptions }
								/>
							}
							{ isConvert &&
								<SelectControl
									className="__lang"
									label={ data.primaryLabel }
									help={ simpleMarkdown(data.primaryHelp) }
									value={ primaryLang }
									onChange={ setPrimaryLang }
									options={ enabledLangs }
								/>
							}
							<div className="__submit">
								<Button
									isPrimary
									disabled={ conversionDisabled }
									icon={ "editor-table" }
									onClick={ convertPost }
								>
									{ isConvert ? data.convertAction : data.splitAction }
								</Button>
							</div>
						</div>
					</div>
				</Popover>
			) }
		</ZukitSidebar.MoreActions>
	);
};

export default ZutranslateConvert;
