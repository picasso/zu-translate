// WordPress dependencies

const { isEmpty, isNil, get, includes, repeat, forEach, sortBy } = lodash;
const { __ } = wp.i18n;
const { createHigherOrderComponent } = wp.compose;
const { withSelect, useSelect } = wp.data;

// Internal dependencies

import { isNum } from './../utils.js';
import { setupStore, defaultMerger, defaultGetter } from './generic-store.js';

// Create and register Zukit Core Data store ----------------------------------]

const ZUKIT_STORE = 'zukit/core';
const FolderDepthSymbol = '\u00A0';
const FolderDepthShift = 4;

// Custom Core Data state merger & getter -------------------------------------]

const basicKeys = ['loaders', 'galleries', 'folders'];

function dataMerger(prevState, stateKey, action) {

    const { key, value } = action;
    const prevDataState = get(prevState, stateKey, {});
    const prevKeyState = get(prevDataState, key, {});

    if(includes(basicKeys, key)) {
        return defaultMerger(prevState, stateKey, action);
    } else if(key === 'svg') {
        const { name, folder } = action;
        const prevFolderState = get(prevKeyState, folder, {});
        return {
            ...prevState,
            [stateKey]: {
                ...prevDataState,
                svg: {
                    ...prevKeyState,
                    [folder]: {
                        ...prevFolderState,
                        [name]: value,
                    },
                },
            },
        };
    }

    return prevState;
}

function dataGetter(state, stateKey, key, params) {
    if(includes(basicKeys, key)) {
        return defaultGetter(state, stateKey, key);
    } else if(key === 'svg') {
        const { name, folder } = params;
        return get(state, [stateKey, key, folder, name]);
    }
    return undefined;
}

const { register: registerCoreStore } = setupStore({
    name: ZUKIT_STORE,
    stateKey: 'data',
    routes: 'zudata',
    withSetters: false,
    initialState: {
        data: {
            folders: {},
            loaders: {},
            galleries: {},
            svg: {},
        },
    },
    merger: dataMerger,
    getter: dataGetter,
});

registerCoreStore();

// Custom hooks ---------------------------------------------------------------]

// Custom hook which returns Generic Core Data
export const useCoreDataGeneric = (key, params) => {
	const { data = null } = useSelect((select) => {
		return { data: select(ZUKIT_STORE).getValue(key, params) };
	}, [key, params]);

	return isEmpty(data) ? null : data;
};

// Custom hook which returns SVG from file in folder
export const useSvgFromFileGeneric = (name, folder = 'images/', router = null) => {
	const { svg = null } = useSelect((select) => {
        if(isEmpty(name)) return {};
		return { svg: select(ZUKIT_STORE).getValue('svg', { router, name, folder }) };
    }, [name, folder]);

	return isEmpty(svg) ? null : svg;
};

// Get Folders/Galleries ------------------------------------------------------]

// Higher-order component which add 'folders' to the original component
export const withFolders = createHigherOrderComponent(
	withSelect((select) => {
		return {
			folders: select(ZUKIT_STORE).getValue('folders') || null,
		}
	}),
	'withFolders',
);

export const folderOptions = (folders, initialOption = null) => {

    const sortedFolders = sortBy(folders, 'order');
    // const idRefs = transform(folders, (acc, val, i) => { acc[val.id] = toInteger(i) });

    function folderOps(folder, ops, depth, parentId) {

        if(isNil(folder) || folder.parent_id !== parentId) return;
        ops.push({
            label: repeat(FolderDepthSymbol, depth * FolderDepthShift) + folder.title,
            value: folder.id,
        })
        forEach(folder.childs, id => {
            folderOps(folders[id], ops, ++depth, folder.id);
            --depth;
        });
    }

    let folderDepth = 0;
    let options = initialOption ? [initialOption] : [];
    forEach(sortedFolders, f => {
        if(f.parent_id === 0) folderOps(f, options, folderDepth, 0);
    })
    return options;
}

// Custom hook which returns 'folder/folders' (all folders if folderId is 'null')
export const useFolders = (folderId = null) => {
	const { folders = null } = useSelect((select) => {
		return { folders: select(ZUKIT_STORE).getValue('folders') };
	}, []);

    return isEmpty(folders) ? null : (folderId === null ? folders : get(folders, folderId, null));
};

// Custom hook which returns array with 'folder options'
const emptyOps = [{ value: 0, label: __('Loading...', 'zukit') }];
const initialOp = { value: 0, label: __('Select folder', 'zukit') };
export const useFolderOptions = (withInitial = initialOp) => {
    const folders = useFolders();
    return isEmpty(folders) ? emptyOps : folderOptions(folders, withInitial);
};

// Custom hook which returns 'galleries' (all galleries if postId is 'null')
export const useGalleries = (postId = null) => {
	const { galleries = null } = useSelect((select) => {
		return { galleries: select(ZUKIT_STORE).getValue('galleries') };
	}, []);

	return isEmpty(galleries) ? null : (postId === null ? galleries : get(galleries, postId, null));
};

// Get Loaders ----------------------------------------------------------------]

// Higher-order component which add 'loaderHTML' to the original component
export const withLoaders = createHigherOrderComponent(
	withSelect((select, { loader }) => {
        const loaderIndex = isNum(loader) ? loader : null;
        let loaderRaw = null;
        if(!isNil(loaderIndex)) {
            loaderRaw = select(ZUKIT_STORE).getValue('loaders', { loaderIndex }) || null;
        }
		return {
			loaderHTML: isEmpty(loaderRaw) ? null : loaderRaw,
		}
	}),
	'withLoaders',
);

// Custom hook which returns 'loader' by 'index' (all loaders if index is 'null')
export const useLoaders = (index = null) => {
	const { loaders = null } = useSelect((select) => {
		return { loaders: select(ZUKIT_STORE).getValue('loaders') };
	}, []);

	return isEmpty(loaders) ? null : (index === null ? loaders : get(loaders, index, null));
};
