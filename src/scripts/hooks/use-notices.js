// WordPress dependencies

const { useContext, createContext } = wp.element;
const { createHigherOrderComponent } = wp.compose;

// Context to make Notices be accessible by many components in the tree,
// and at different nesting levels
const NoticesContext = createContext();
NoticesContext.displayName = 'ZukitNoticesContext';

export function useNoticesContext() {
	return useContext(NoticesContext);
}

export const withNoticesContext = createHigherOrderComponent((WrappedComponent) => {
	return (props) => {
        return (
            <NoticesContext.Consumer>
				{
					context => {
						return (
							<WrappedComponent noticeOperations={ context } { ...props }/>
						)
					}
				}
            </NoticesContext.Consumer>
		);
	};
}, 'withZukitNoticesContext');

export default NoticesContext;
