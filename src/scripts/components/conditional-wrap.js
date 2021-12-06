// Conditional Wrap Component
// condition ? wrap(children) : children

const ConditionalWrap = ({
		className,
		condition,					// if true "children" will be wrapped in <WrappingComponent> component with additionalProps
		elseDiv,					// if true then "children" will be wrapped in <div> with the same className
		wrappingDiv,				// if !undefined then <div> will be used as Wrapping Component
		wrappingLink,				// if !undefined then <a> will be used as Wrapping Component
		wrap,						// will be used only if wrappedDiv and wrappedLink are undefined
		children,
		...additionalProps			// all additional props go to Wrapping Component
}) => {

	// maybe Wrapping Component is <div>
	let wrappingComponent = !wrappingDiv ? null : (
		<div
			className={ className }
			{ ...additionalProps }
		>
			{ children }
		</div>
	);

	// maybe Wrapping Component is <a>
	if(wrappingLink) wrappingComponent = (
		<a
			className={ className }
			{ ...additionalProps }
		>
			{ children }
		</a>
	);

	// if wrappingComponent is still undefined then use "wrap" as component
	if(!wrappingComponent) {
		const Wrap = wrap;
		wrappingComponent = (
			<Wrap
				className={ className }
				{ ...additionalProps }>
				{ children }
			</Wrap>
		);
	}

	return condition ? wrappingComponent : (elseDiv ? <div className={ className }>{ children }</div> : children);
}

export default ConditionalWrap;
