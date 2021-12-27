// WordPress dependencies

const { get, map, castArray, join, includes, without } = lodash;
const { __ } = wp.i18n;
const { Button, CheckboxControl } = wp.components; // BaseControl,
const { useCallback } = wp.element;

// Zukit dependencies

const { ZukitDivider, ZukitPanel } = wp.zukit.components; // , AdvTextControl
const { simpleMarkdown, getExternalData } = wp.zukit.utils;


const blockEditorKey = 'zutranslate_blockeditor_options';
const supported = getExternalData('supported', {});

function contentAtts(atts) {
	const comment = __('Content attributes:', 'zu-translate');
	return simpleMarkdown(`${comment}\`${join(castArray(atts), '` `')}\``);
}

const ZutranslateBlockEditor = ({
	data,
	options,
	updateOptions,
	// resetOptions,
	// ajaxAction,
}) => {

	const blockEditorOps = get(options, blockEditorKey, {});
	const excludedBlocks = get(blockEditorOps, 'excluded', []);
	const resetRules = useCallback(() => {
		// resetOptions([
		// 	`${blockEditorKey}.add_rewrite`,
		// 	`${blockEditorKey}.rewrite`,
		// 	'tag_rewrite',
		// 	'category_rewrite'
		// ], () => ajaxAction('zumedia_flush_rewrite')); resetOptions, ajaxAction
	}, []);

	const excludeBlock = useCallback((checked, block) => {
		let excluded = get(blockEditorOps, 'excluded', []);
		if(checked) excluded = without(excluded, block);
		else excluded.push(block);
		updateOptions({ [`${blockEditorKey}.excluded`]: excluded });
	}, [blockEditorOps, updateOptions]);

	return (
			<ZukitPanel id="gutenberg" options={ options } initialOpen={ true }>
				<div className="__note">
					{ simpleMarkdown(data.note, { br: true }) }
				</div>
				<h3 className="__subtitle">{ data.blockTitle }</h3>
				<div className="__supported">
					{ map(supported, ({ name, atts }, key) =>
						<CheckboxControl
							key={ key }
							label={ name }
							help={ contentAtts(atts) }
							checked={ !includes(excludedBlocks, key) }
							onChange={ (value) => excludeBlock(value, key) }
						/>
					) }
				</div>
				<ZukitDivider bottomHalf size={ 2 }/>
				<div className="__flex __right">
					<Button
						isSecondary
						className="__plugin_actions __auto magenta"
						label={ data.resetAll }
						icon="image-rotate"
						onClick={ resetRules }
					>
						{ data.resetAll }
					</Button>
				</div>
			</ZukitPanel>
	);
};

// <ListInputControl
// 	strict="email"
// 	label={ notify.label }
// 	inputLabel={ notify.input }
// 	help={ notify.help }
// 	value={ options.notify }
// 	onChange={ onNotifyChange }
// />

// { blockEditorOps.add_rewrite  &&
// 	// use <BaseControl> here to separate the label from the text control and allow 'flex' to align the boxes
// 	<BaseControl label={ data.folders_rewrite } id="folders-rewrite-text-control">
// 		<div className="__flex __rules">
// 			<AdvTextControl
// 				value={ blockEditorOps.rewrite || '' }
// 				onChange={ value => updateOptions({ [`${blockEditorKey}.rewrite`]: value }) }
// 			/>
// 			<div className="__tag">
// 				<span>^<i>{ blockEditorOps.rewrite  }</i>/([0-9]+)/?</span>
// 			</div>
// 			<div className="__rule">
// 				<span>index.php?post_type=<i>attachment</i>&<i>{ blockEditorOps.rewrite }_id</i>=$matches[1]</span>
// 			</div>
// 		</div>
// 	</BaseControl>
// }

// { options.add_tags  &&
// 	<BaseControl label={ data.tag_rewrite } id="tag-rewrite-text-control">
// 		<div className="__flex __rules">
// 			<AdvTextControl
// 				id="tag-rewrite-text-control"
// 				value={ options.tag_rewrite || '' }
// 				onChange={ value => updateOptions({ tag_rewrite: value }) }
// 			/>
// 			<div className="__tag">
// 				<span>^<i>{ options.tag_rewrite }</i>/([^/]*)/?</span>
// 			</div>
// 			<div className="__rule">
// 				<span>index.php?post_type=<i>attachment</i>&<i>tag</i>=$matches[1]</span>
// 			</div>
// 		</div>
// 	</BaseControl>
// }


export default ZutranslateBlockEditor;
