// WordPress dependencies

const { isString, } = lodash;
const { Button } = wp.components;
const { useCallback } = wp.element;

// Zukit dependencies

const { ZukitPanel, ListInputControl, ZukitToggle } = wp.zukit.components;
const { simpleMarkdown } = wp.zukit.utils;
const { scrollTop } = wp.zukit.jq;

const ZutranslateAdvanced = ({
	data,
	options,
	updateOptions,
	resetOptions,
	noticeOperations,
}) => {

	const { createNotice } = noticeOperations;
	const { list_exclude: ignoreTypes } = options;

	const resetAdvancedOptions = useCallback(() => {
		resetOptions(['list_exclude'], () => {
			createNotice({
				status: 'info',
				content: data.resetNotice,
				isDismissible: true,
				__unstableHTML: true,
			});
			scrollTop();
		});
	}, [resetOptions, createNotice, data.resetNotice]);

	return (
			<ZukitPanel id="advanced" options={ options } initialOpen={ true }>
				<div className="__advanced">
					{ isString(ignoreTypes) &&
						<ListInputControl
							strict={ /^[a-z0-9_-]+$/ }
							label={ simpleMarkdown(data.list_exclude.label, { br: true }) }
							inputLabel={ simpleMarkdown(data.list_exclude.input, { br: true }) }
							inputHelp={ simpleMarkdown(data.list_exclude.inputHelp, { br: true }) }
							value={ ignoreTypes }
							onChange={ value => updateOptions({ list_exclude: value }) }
						/>
					}
					<ZukitToggle
						label={ data.list_exclude.ignoreAll.label }
						help={ data.list_exclude.ignoreAll.help }
						checked={ isString(ignoreTypes) ? false : true }
						onChange={ () => updateOptions({ list_exclude: isString(ignoreTypes) ? true : '' }) }
					/>
				</div>
				<div className="__flex __right">
					<Button
						isSecondary
						className="__plugin_actions __auto magenta"
						label={ data.resetAll }
						icon="image-rotate"
						onClick={ resetAdvancedOptions }
					>
						{ data.resetAll }
					</Button>
				</div>
			</ZukitPanel>
	);
};

export default ZutranslateAdvanced;
