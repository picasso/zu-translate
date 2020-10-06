// WordPress dependencies

const { map, get, isNil, isPlainObject } = lodash;

// const { __ } = wp.i18n;
// const { compose } = wp.compose;
// const { useState, useCallback } = wp.element; // , useEffect
const { RawHTML } = wp.element;
const { Spinner, Tooltip } = wp.components;
const { BlockIcon } = wp.blockEditor;

// Internal dependencies

import { mergeClasses } from './../utils.js';

// Zukit Table Component

const ZukitTable = ({
		className,
		fixed,
		config,
		head,
		body,
		loading,
}) => {

	// style={ style }"white-space: pre-wrap;"
	const {
		align: cellAlign = [],
		style: cellStyle = [],
		className: cellClass = [],
	} = config || {};

	const withContent = data => {

		if(!isPlainObject(data)) return data;

		const { dashicon, svg, tooltip } = data;
		const icon = (
			<BlockIcon
				icon={ svg ? <RawHTML>{ svg }</RawHTML> : dashicon }
				showColors
			/>
		);
		return !tooltip ? icon : (
			<Tooltip
				text={ tooltip }
			>
				<div>{ icon }</div>
			</Tooltip>
		);
	};

	const withStyle = (index, style) => {
		const commonStyle = get(cellStyle, index);
		if(isNil(style) && !commonStyle) return null;
		return {
			...(commonStyle || {}),
			...(style || {}),
		};
	}

	const withClass = (index, align) => {
		const commonClass = get(cellClass, index);
		const commonAlign = align || get(cellAlign, index) || 'left';
		return {
			[commonClass || '']: commonClass,
			[`has-text-align-${commonAlign}`]: commonAlign,
		};
	}

	return (
		<div className={ mergeClasses('zukit-table', className, {
			'has-fixed-layout': fixed,
			'is-loading': loading,
		}) }>
			<div className="head">
				{ head && map(head, ({ content, align, style }, cellIndex) =>
					<div
						className={ mergeClasses('cell', 'head', withClass(cellIndex, align)) }
						key={ cellIndex }
						aria-label="Header label"
						style={ withStyle(cellIndex, style) }
					>
						{ content }
					</div>
				) }
			</div>
			<div className="body">
				{ body && map(body, (cells, rowIndex) =>
					<div className="row" key={ rowIndex }>
						{ map(cells, ({ content, align, style }, cellIndex) =>
							<div
								className={ mergeClasses('cell', withClass(cellIndex, align)) }
								key={ cellIndex }
								aria-label=""
								style={ withStyle(cellIndex, style) }
							>
								{ withContent(content) }
							</div>
						) }
					</div>
				) }
				{ loading && <Spinner /> }
			</div>
		</div>
	);
}

export default ZukitTable;
