// WordPress dependencies

const { isEmpty, map, reject, find, pick, includes, reduce } = lodash;
const { __, sprintf } = wp.i18n;
const { Popover, Button, SelectControl } = wp.components;
const { useState, useRef, useCallback } = wp.element;
const { useSelect } = wp.data;

// Zukit dependencies
// window.Zubug = { ...(wp.zukit.debug  || {}) };

const { close: closeIcon } = wp.zukit.icons;
const { getExternalData, simpleMarkdown } = wp.zukit.utils;
const { ZukitSidebar, ZukitToggle } = wp.zukit.components;

const convertPrefix = 'zutranslate_convert';
const buttonIcon = 'superhero';
const rejectTypes = ['attachment', 'wp_block', 'nav_menu_item', 'wp_template', 'wp_template_part', 'wp_navigation'];
const loadingOptions = [{ value: 0, label: 'Loading...' }];

const enabledLangs = reduce(getExternalData('qtxlangs', {}), (options, val) => {
	options.push({ value: val.code, label: val.name, active: val.active });
	return options;
}, []);

function decodeHtml(html) {
    var txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
}

const ZutranslateConvert = ({
		data,
		ajaxAction,
}) => {

// Zubug.data({ data });
	const [ isOpen, setIsOpen ] = useState(false);
	const dataRef = useRef({ types: null, posts: null });

	const [ postType, setPostType ] = useState(0);
	const [ selectLabel, setSelectLabel ] = useState('');
	const [ onlySelected, setOnlySelected ] = useState(false);
	const [ selectedId, setSelectedId ] = useState(0);
	const [ primaryLang, setPrimaryLang ] = useState(find(enabledLangs, ['active', true])?.value);

	const anchorRef = useRef(null);

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

	const selectPostType = useCallback(value => {
		const label = find(typeOptions, { value })?.label.toLowerCase();
		setPostType(value);
		setSelectLabel([
			sprintf(
				__('Select the %s for conversion', 'zu-translate'), label
			),
			sprintf(
				__('Select %s', 'zu-translate'), label
			),
		]);
		dataRef.current.posts = null;
	}, [typeOptions]);

	const { postOptions, hasResolved } = useSelect(select => {
		const { getEntityRecords, hasFinishedResolution } = select('core');
		const postsParameters = ['postType', postType];
		if(postType && onlySelected && dataRef?.current.posts === null) {
			const posts = getEntityRecords(...postsParameters);
			if(!isEmpty(posts)) {
				dataRef.current.posts = reduce(posts, (options, val) => {
					options.push({ value: val.id, label: decodeHtml(val.title.rendered) });
					return options;
				}, [{ value: 0, label: selectLabel[1] }]);
			}
		}
		return {
			postOptions: dataRef?.current.posts,
			hasResolved: postType && onlySelected && hasFinishedResolution('getEntityRecords', postsParameters),
		};
	}, [postType, onlySelected, selectLabel]);

	const openLinkUI = useCallback(() => {
		setIsOpen(!isOpen);
	}, [isOpen]);

	const closeLinkUI = useCallback(() => {
		setIsOpen(false);
	}, []);

	const convertPost = useCallback(() => {
		closeLinkUI();
		ajaxAction({
			action: 'zutranslate_convert_classic',
			value: {
				id: onlySelected ? selectedId : 0,
				postType,
				primaryLang
			},
		});
	}, [selectedId, postType, primaryLang, onlySelected, ajaxAction, closeLinkUI]);

	const conversionDisabled = onlySelected ? selectedId === 0 : postType === 0;

	return (
		<ZukitSidebar.MoreActions>
			<ZukitSidebar.ActionButton
				color="magenta"
				icon={ buttonIcon }
				onClick={ openLinkUI }
				label={ data.buttonLabel }
				help={ data.buttonHelp }
				ref={ anchorRef }
			/>
			{ isOpen && (
				<Popover
					position="middle left"
					noArrow={ false }
					onClose={ closeLinkUI }
					anchorRect={ anchorRef.current ? anchorRef.current.getBoundingClientRect() : null }
					focusOnMount={ false }
				>
					<div className={ convertPrefix }>
						<div className="__title">
							<span>{ data.title }</span>
							<Button
								className="__close"
								icon={ closeIcon }
								onClick={ closeLinkUI }
							/>
						</div>
						<div className="__body">
							<SelectControl
								label={ data.typeLabel }
								value={ postType }
								onChange={ selectPostType }
								options={ typeOptions }
							/>
							{ !!postType &&
								<ZukitToggle
									label={ data.onlySelected }
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
							<SelectControl
								className="__lang"
								label={ data.primaryLabel }
								help={ simpleMarkdown(data.primaryHelp) }
								value={ primaryLang }
								onChange={ setPrimaryLang }
								options={ enabledLangs }
							/>
							<div className="__submit">
								<Button
									isPrimary
									disabled={ conversionDisabled }
									icon={ "editor-table" }
									onClick={ convertPost }
								>
									{ data.action }
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
