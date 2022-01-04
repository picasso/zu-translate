// WordPress dependencies

const { isString, trim } = lodash;
const { createElement } = wp.element;

// Conditional Wrap Component
// condition ? wrap(children) : children

const ConditionalWrap = ({
		condition,					// if true 'children' will be wrapped in <WrappingComponent> component with additionalProps
		wrap: WrappingComponent,	// could be a string (for built-in components) or a class/function (for composite components)
									// built-in components can be wrapped in angular brackets like <div> or <div/> (for clarity)
		children,
		...additionalProps			// all additional props go to Wrapping Component
}) => {

	if(condition) {
		if(isString(WrappingComponent)) {
			// built-in components can be wrapped in angular brackets
			const elementType = trim(WrappingComponent, '</>');
			return createElement(elementType, additionalProps, children);
		}
		return <WrappingComponent { ...additionalProps }>{ children }</WrappingComponent>;
	}
	return children;
}

export default ConditionalWrap;
