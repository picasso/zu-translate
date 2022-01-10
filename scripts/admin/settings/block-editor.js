// WordPress dependencies

const {
	isEmpty,
	castArray,
	get,
	has,
	map,
	mapKeys,
	join,
	split,
	compact,
	includes,
	without,
	pick,
	omit,
	keys,
} = lodash;
const { __ } = wp.i18n;
const { Button, CheckboxControl } = wp.components;
const { useCallback, useState } = wp.element;

// Zukit dependencies

const { toggleOption } = wp.zukit.render;
const { ZukitDivider, ZukitPanel, AdvTextControl, ListInputControl } = wp.zukit.components;
const { simpleMarkdown, getExternalData, messageWithError } = wp.zukit.utils;
const { scrollTop } = wp.zukit.jq;

const blockEditorKey = 'blockeditor';
const supported = getExternalData('supported', {});

function contentAtts(atts) {
	const comment = __('Content attributes:', 'zu-translate');
	return simpleMarkdown(`${comment}\`${join(castArray(atts), '` `')}\``);
}

function testCustomBlock(name, blockAtts, customBlocks) {
	const nameRegex = /^(?!\d)[\w$]+\/(?!\d)[\w$]+$/;
	const atts = compact(split(blockAtts, ','));
	let error = nameRegex.test(name) ? null : { msg: 'errName', value: isEmpty(name) ? null : name };
	if(error === null && has(customBlocks, name)) error = { msg: 'errDups', value: name };
	if(error === null && atts.length === 0) error = { msg: 'errAtts', value: null };
	return { name, atts, error };
}

const ZutranslateBlockEditor = ({
	data,
	options,
	updateOptions,
	resetOptions,
	ajaxAction,
	noticeOperations,
}) => {

	const { createNotice } = noticeOperations;
	const beOptions = get(options, blockEditorKey, {});
	const { excluded: excludedBlocks, custom: customBlocks } = beOptions;

	const [ customName, setCustomName ] = useState('');
	const [ customAtts, setCustomAtts ] = useState('');
	const [ supportedBlocks, setSupportedBlocks ] = useState(supported);

	const resetBEOptions = useCallback(() => {
		resetOptions(blockEditorKey,
			() => ajaxAction('zutranslate_reset_supported', blocks => {
				setSupportedBlocks(blocks);
				scrollTop();
			})
		);
	}, [resetOptions, ajaxAction]);

	const updateBEOptions = useCallback(update => {
		const folderUpdate = mapKeys(update, (_, key) => `${blockEditorKey}.${key}`);
		updateOptions(folderUpdate);
	}, [updateOptions]);

	const excludeBlock = useCallback((checked, block) => {
		if(checked) updateBEOptions({ excluded: without(excludedBlocks, block) });
		else updateBEOptions({ excluded: [...excludedBlocks, block] });
	}, [excludedBlocks, updateBEOptions]);

	const addBlock = useCallback(() => {
		const { name, atts, error } = testCustomBlock(customName, customAtts, customBlocks);

		if(error === null) {
			updateBEOptions({ custom: { ...customBlocks, [name]: { title: name, atts } } });
			setCustomName('');
			setCustomAtts('');
		} else {
			// Can be one of: success, info, warning, error
			createNotice({
				status: 'warning',
				content: messageWithError(data[error.msg], error.value),
				isDismissible: true,
				__unstableHTML: true,
			});
			scrollTop();
		}
	}, [customBlocks, customName, customAtts, updateBEOptions, createNotice, data]);

	const standardBlocks = omit(supportedBlocks, keys(customBlocks));
	const hasCustomBlocks = !isEmpty(customBlocks);

	return (
			<ZukitPanel id="gutenberg" options={ options } initialOpen={ true }>
				{ toggleOption(pick(data, ['sync', 'session']), beOptions, updateBEOptions) }
				<h3 className="__subtitle">{ data.blockTitle }</h3>
				<div className="__supported">
					{ map(standardBlocks, ({ title, atts }, key) =>
						<CheckboxControl
							key={ key }
							label={ title }
							help={ contentAtts(atts) }
							checked={ !includes(excludedBlocks, key) }
							onChange={ (value) => excludeBlock(value, key) }
						/>
					) }
				</div>
				{ hasCustomBlocks &&
					<>
						<ZukitDivider bottomHalf size={ 2 }/>
						<div className="__supported">
							{ map(customBlocks, ({ title, atts }, key) =>
								<CheckboxControl
									key={ key }
									label={ title }
									help={ contentAtts(atts) }
									checked={ !includes(excludedBlocks, key) }
									onChange={ (value) => excludeBlock(value, key) }
								/>
							) }
						</div>
					</>
				}
				<div className="__note">
					{ simpleMarkdown(data.note, { br: true }) }
				</div>
				<div className="__custom">
					<AdvTextControl
						isSideBySide
						label={ data.custom.nameLabel }
						help={ simpleMarkdown(data.custom.nameHelp, { br: true }) }
						value={ customName }
						onChange={ setCustomName }
						onKeyEnter={ addBlock }
					/>
					<ListInputControl
						isOpen
						isNotEmptyLabel
						isSideBySide
						strict={ /^(?!\d)[\w$]+$/ }
						label={ data.custom.attsLabel }
						inputLabel={ simpleMarkdown(data.custom.attsInput, { br: true }) }
						inputHelp={ simpleMarkdown(data.custom.attsInputHelp, { br: true }) }
						value={ customAtts }
						onChange={ setCustomAtts }
					/>
					<Button
						isSecondary
						className="__plugin_actions __auto green"
						label={ data.custom.addBlock }
						icon="plus-alt"
						onClick={ addBlock }
					>
						{ data.custom.addBlock }
					</Button>
				</div>

				<div className="__flex __right">
					<Button
						isSecondary
						className="__plugin_actions __auto magenta"
						label={ data.resetAll }
						icon="image-rotate"
						onClick={ resetBEOptions }
					>
						{ data.resetAll }
					</Button>
				</div>
			</ZukitPanel>
	);
};

export default ZutranslateBlockEditor;
