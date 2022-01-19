// WordPress dependencies

const { map, get, isEmpty, isNil, isPlainObject, forEach, noop } = lodash;

const { RawHTML, useState, useCallback, useEffect } = wp.element;
const { Spinner, Tooltip, ExternalLink } = wp.components;
const { BlockIcon } = wp.blockEditor;

// Internal dependencies

import { mergeClasses, simpleMarkdown, getExternalData, hexToRGBA } from './../utils.js';
import ConditionalWrap from './conditional-wrap.js';

const getRowStyles = (index, colors, template = null) => {

	const borderOpacity = 0.3;
	const headBorderOpacity = 0.6;
	const oddOpacity = 0.4;
	const isEven = index % 2 == 0;
	const { backdrop, header, title } = colors;

	const grid = !template ? {} : {
		gridTemplateColumns: template,
	}

	if(index === 'body' && template) return grid;

	return index === 'table' ? {
		borderBottomColor: hexToRGBA(title, borderOpacity),
	} : (index === 'head' ? {
		backgroundColor: header,
		borderColor: hexToRGBA(title, headBorderOpacity),
		...grid,
	} : {
		color: title,
		backgroundColor: isEven ? backdrop : hexToRGBA(header, oddOpacity),
		borderBottomColor: hexToRGBA(title, borderOpacity),
	});
};

const makeRef = (row, id) => `${row}:${id}`;

// Zukit Table Component

const ZukitTable = ({
		className,
		css = 'grid',		// supports 'flex' and 'grid', 'flex' is obsolete implementation
		fixed,
		config,
		head,
		body,
		loading,
		onDynamic = noop,
		dynamic: dynamicCells,
}) => {

	const isCssGrid = css === 'grid';
	const gridTemplate = isCssGrid ? (config?.template ?? null) : null;
	const colors = getExternalData('info.colors', {});

	// check if there are dynamic cells and call the parent handler if any
	useEffect(() => {
		if(isEmpty(dynamicCells)) {
			forEach(body, (cells, row) => {
				forEach(cells, (cellData, cell) => {
					const dynamic = get(cellData, ['params', 'dynamic']);
					const id = get(dynamic, 'id');
					if(dynamic) onDynamic({ row, cell, ref: makeRef(row, id), ...dynamic });
				});
			});
		}
	}, [body, onDynamic, dynamicCells]);

	const {
		align: cellAlign = [],
		style: cellStyle = [],
		className: cellClass = [],
	} = config || {};

	const processDynamic = (row, kind, dynamicParams, content = null) => {
		// process dynamic cells, if value is 'undefined' then request it from the parent
		const id = get(dynamicParams, 'id');
		return id ? get(dynamicCells, [makeRef(row, id), kind], content) : undefined;
	};

	const withContent = (rowIndex, content, params) => {
		if(isPlainObject(content)) {
			const { dashicon, svg, tooltip } = content;
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
		} else {
			const { markdown = false, link, dynamic } = params || {};
			if(markdown) return simpleMarkdown(content, { br: true, json: true });
			if(get(link, 'href')) {
				const { title, href } = link;
				return <ExternalLink href={ href }>{ title }</ExternalLink>
			}
			// process dynamic cells, if null then show <Spinner/>
			const dynamicValue = processDynamic(rowIndex, 'content', dynamic, content);
			if(dynamicValue !== undefined) {
				if(dynamicValue === null) return <Spinner/>;
				const { markdown: asMarkdown = false } = dynamic || {};
				return asMarkdown ? simpleMarkdown(dynamicValue, { br: true, json: true }) : dynamicValue;
			}
			return content;
		}
	};

	const withStyle = (index, style, rowIndex = false) => {
		const commonStyle = get(cellStyle, index);
		const rowStyle = rowIndex === false ? null : getRowStyles(rowIndex, colors);

		if(isNil(style) && !rowStyle && !commonStyle) return null;
		return {
			...(commonStyle ?? {}),
			...(rowStyle ?? {}),
			...(style ?? {}),
		};
	}

	const withClass = (rowIndex, cellIndex, align, params) => {
		const commonClass = get(cellClass, cellIndex);
		const commonAlign = align || get(cellAlign, cellIndex) || 'left';
		const { className: additionalСlassName, dynamic } = params || {};
		const dynamicClassName = processDynamic(rowIndex, 'className', dynamic);

		return {
			[commonClass || '']: commonClass,
			[`has-text-align-${commonAlign}`]: commonAlign,
			'__zu_markdown': get(params, 'markdown') || get(dynamic, 'markdown'),
			'__zu_link': get(params, 'link.href'),
			[additionalСlassName]: additionalСlassName,
			[dynamicClassName]: dynamicClassName,
		};
	}

	const hasHead = !isEmpty(head);
	const hasRows = !isEmpty(body);

	return (
		<div
			className={ mergeClasses('zukit-table', className, {
				'has-fixed-layout': fixed,
				'css-grid': css === 'grid',
				'css-flex': css === 'flex',
				'is-loading': loading,
			}) }
			style={ getRowStyles('table', colors) }
		>
			{ hasHead &&
				<div className="head" style={ getRowStyles('head', colors, gridTemplate) }>
					{ map(head, ({ content, align, style }, cellIndex) =>
						<div
							className={ mergeClasses('cell', 'head', withClass(null, cellIndex, align)) }
							key={ cellIndex }
							aria-label="Header label"
							style={ withStyle(cellIndex, style) }
						>
							{ content }
						</div>
					) }
				</div>
			}
			<div className="body" style={ getRowStyles(loading ? 0 : 'body', colors, loading ? 0 : gridTemplate) }>
				{ hasRows && map(body, (cells, rowIndex) =>
					<ConditionalWrap
						wrap="<div>"
						condition={ !isCssGrid }
						className="row"
						key={ rowIndex }
						style={ getRowStyles(rowIndex, colors) }
					>
						{ map(cells, ({ content, align, style, params }, cellIndex) =>
							<div
								className={ mergeClasses('cell', withClass(rowIndex, cellIndex, align, params)) }
								key={ cellIndex }
								aria-label=""
								style={ withStyle(cellIndex, style, isCssGrid ? rowIndex : false) }
							>
								{ withContent(rowIndex, content, params) }
							</div>
						) }
					</ConditionalWrap>
				) }
				{ loading && <Spinner/> }
			</div>
		</div>
	);
}

export function useDynamicCells() {
	const [dynamicCells, setDynamicCells] = useState({});

	const updateCells = useCallback((value, ref, kind) => {
		setDynamicCells(prev => ({
			...prev,
			[ref]: {
				...get(prev, ref, {}),
				[kind]: value,
			},
		}));
	}, []);

	return [dynamicCells, updateCells];
}

ZukitTable.useDynamicCells = useDynamicCells;
export default ZukitTable;
