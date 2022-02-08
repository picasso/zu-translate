// WordPress dependencies

const { isEmpty, includes, map, transform, set } = lodash;
const { createHigherOrderComponent } = wp.compose;
const { InspectorControls } = wp.blockEditor;
const { useEffect, useCallback, useRef, useMemo } = wp.element;

// Zukit dependencies

const { useForceUpdater } = wp.zukit.data;

// Internal dependencies

import { isSupported, getExternalData, getDebug, getTranslated, getEditorBlocks } from './../utils.js';
import { hasRaw, switchContent, splitAtts, createRawContent, maybeFixRawContent, updateRawContent } from './../raw-utils.js';
import { changeLang, useOnLangChange, useLangHook } from './../data/use-store.js';
import { syncCompleted, syncBlocks } from './../data/sync-blocks.js';
import LangControl from './../components/lang-control.js';

const activateSync = getExternalData('sync', false);
const enableDebug = getExternalData('debug.edit_lang', false);
const debug = getDebug(enableDebug);

const BlockEditLang = (props) => {
	const {
		name,
		clientId,
		setAttributes,
		attributes,
	} = props;
	const {
		qtxRaw,
		qtxLang,
	} = attributes;

	// store 'qtxRaw' on the reference since its update occurs in 'useEffect'
	const rawRef = useRef(null);
	if(rawRef.current === null) {
		rawRef.current = { raw: qtxRaw, id: clientId };
		debug.infoWithId(clientId, `-?Initiated with language {${qtxLang}}`);
	}

	// create a list of attributes and an array of their values ('translatedAtts' is string - see 'utils.js')
	const [translatedAtts, translatedValues] = getTranslated(name, attributes);

	// callback for replacing the values of all 'translated' attributes for the required language
	const replaceContent = useCallback((lang, prevLang = false) => {
		// if sync is not activated and 'prevLang' is false - the call was from the hook
		// and in this mode we ignore the change of language
		if(!activateSync && !prevLang) return;

		const { raw, id } = rawRef.current;
		if(lang !== prevLang) {
			const atts = switchContent(raw, lang, translatedAtts);
			debug.infoWithId(id, `-^{+switching} RAW [${translatedAtts}] for lang {${lang}}`, atts);
			setAttributes({ qtxLang: lang, ...atts });
		} else {
			debug.infoWithId(id, `-^{#skip switching} RAW [${translatedAtts}]`, { lang, prevLang, activateSync });
		}
		syncCompleted(id);
	}, [translatedAtts, setAttributes]);

	const forceUpdate = useForceUpdater();
	// in the hook is checked if the language has changed, then we call 'replaceContent'
	const editorLang = useOnLangChange(clientId, replaceContent, qtxLang);
	// register 'forceUpdate' for subsequent language synchronization
	useLangHook(clientId, forceUpdate);

	const onChangeLang = useCallback(lang => {
		const { id } = rawRef.current;
		if(activateSync) {
			changeLang(lang);
			forceUpdate();
			syncBlocks(id);
		} else {
			syncBlocks(id, true);
			replaceContent(lang, qtxLang);
		}
		debug.infoWithId(id, `-^Language switched [${qtxLang} -> ${lang}]`);
	}, [forceUpdate, replaceContent, qtxLang]);

	const onCopyLang = useCallback((fromLang, overwrite) => {
		const { raw, id } = rawRef.current;
		const atts = splitAtts(translatedAtts);
		const update = switchContent(raw, fromLang, translatedAtts);
		// if the value cannot be copied, then replace the value with 'undefined', then it will be skipped when updating 'raw'
		const values = map(atts, (val, index) => isEmpty(translatedValues[index]) || overwrite ? update[val] : undefined);
		const updatedRaw = updateRawContent(raw, qtxLang, values);
		if(updatedRaw !== raw) {
			// leave only those attributes that were copied (see above)
			const updateAtts = transform(values, (acc, val, index) => val !== undefined ? set(acc, atts[index], val) : false, {});
			rawRef.current.raw = updatedRaw;
			setAttributes({ qtxRaw: updatedRaw, ...updateAtts });
			debug.infoWithId(id, `-^Content copied from [${fromLang}]`, { updateAtts, updatedRaw });
		}
	}, [qtxLang, translatedAtts, translatedValues, setAttributes]);

	// synchronize, create RAW if does not exist and maybe fix it - on mounting only
	useEffect(() => {
		// if RAW does not exist - create it
		if(!hasRaw(rawRef)) {
			const [ raw, update ] = createRawContent(editorLang, translatedValues, translatedAtts);
			rawRef.current.raw = raw;
			setAttributes({ qtxLang: editorLang, qtxRaw: raw, ...update });
			debug.infoWithId(rawRef.current.id, '-?Raw {created} on mounting', {
				qtxLang,
				raw,
				update,
				translatedValues,
				translatedAtts
			});
		} else {
			// fix if RAW was created for wrong amount of attributes
			const { raw, id } = rawRef.current;
			const fixedRaw = maybeFixRawContent(raw, editorLang, translatedValues);
			const wasFixed = fixedRaw !== false;
			debug.infoWithId(id, `-^Raw {${wasFixed ? '!fixed' : '*existed'}} on mounting`, {
				raw,
				fixedRaw: wasFixed ? fixedRaw : null,
				translatedValues,
				translatedAtts
			});
			if(fixedRaw !== false) rawRef.current.raw = fixedRaw;
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// after each change in one of the attributes that require the translation, we update 'qtxRaw'
	useEffect(() => {
		if(hasRaw(rawRef)) {
			const { raw } = rawRef.current;
			const updatedRaw = updateRawContent(raw, qtxLang, translatedValues);
			if(updatedRaw !== raw) {
				rawRef.current.raw = updatedRaw;
				setAttributes({ qtxRaw: updatedRaw });
				debug.infoWithId(rawRef.current.id, '-^Raw {updated}', { updatedRaw, translatedValues });
			}
		}
	// we used a spread element in the dependency array -> we can't statically verify the correct dependencies
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [...translatedValues, qtxLang, setAttributes]);

	return useMemo(() => (
		<InspectorControls>
			<LangControl.Panel
				lang={ qtxLang }
				onClick={ onChangeLang }
				onCopy={ onCopyLang }
			/>
		</InspectorControls>
	), [qtxLang, onChangeLang, onCopyLang]);
}

// HOC in which we add a language editing panel if the block fits our requirements
const withRawEditControl = createHigherOrderComponent(BlockEdit => {
	return (props) => {
		const {
			name,
			clientId,
		} = props;

		const editorIds = getEditorBlocks();

		// 'getEditorBlocks' returns all block client IDs in the editor, check if our block is in this list
		// NOTE: sometimes the blocks of those types that we support are created, but these blocks are not edited in the editor -
		// for example, blocks for visual preview of the editable block
		const isEditableBlock = includes(editorIds, clientId);

		if(!isEditableBlock) debug.infoWithId(clientId, `-^Block [${name}] was skipped`, { editableBlocks: editorIds });
		else debug.infoWithId(clientId, `-^Block [${name}] is editable and {${isSupported(name) ? '*is' : '!is not'} supported}`);

		return (
			<>
				<BlockEdit { ...props }/>
				{ isSupported(name) && isEditableBlock && <BlockEditLang { ...props }/> }
			</>
		);
	};
}, 'withRawEditControl');

export default withRawEditControl;
