// WordPress dependencies

const { createHigherOrderComponent } = wp.compose;
const { useContext, createContext } = wp.element; // useCallback, useEffect, useReducer, useMemo,

// Internal dependencies

// import { useUpdateImages }  from './use-images.js';


// Context and reducer to be used for passing 'updateImages' callback down to component tree
// The identity of the 'dispatch' function from 'useReducer' is always stable!

const NoticesContext = createContext();
NoticesContext.displayName = 'NoticesContext';

export function useNoticesContext() {
	return useContext(NoticesContext);
}

export const withNoticesContext = createHigherOrderComponent((WrappedComponent) => {
	return (props) => {

        const {
			noticeOperations,
		} = props;

        return (
            <NoticesContext.Provider value={ noticeOperations }>
                <WrappedComponent { ...props }/>
            </NoticesContext.Provider>
		);
	};
}, 'withNoticesContext');
