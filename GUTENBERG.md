# qTranslate-XT and Gutenberg

> &#x1F383; I wrote this note most likely for myself — so as not to forget over time the main ideas and pitfalls of this implementation. Perhaps it will be useful to those who are also looking for a solution to this problem.

Since the WordPress Block Editor (*Gutenberg*) is implemented on React, multilingual support must also be written on React. In addition, now all blocks and components "do not know" anything about multilingual content and we have to look for workarounds and tricks to achieve the goal.

The current implementation is split into two solutions.

* The first is for all blocks that are edited in the Block Editor (*regular blocks*). Since __Gutenberg__ has a hook mechanism, this allows us to modify existing blocks to a certain extent. This solution is rather formal and uses only the public API and no hacks.

* The second solution is for the attributes that are presented on the Block Editor page, but are not blocks in the literal sense (although the internal implementation is also blocks, these blocks do not support the hook mechanism and therefore do not work with the first solution). To edit these attributes (*non-regular blocks*), a simple, but still not a standard solution was found (that is, without the Gutenberg API).


## For Regular Blocks

The work algorithm for regular blocks is as follows:

* The plugin has a list of supported blocks and the names of the attributes of these blocks that require translation;

* In the handler on the `blocks.registerBlockType` hook, the block name is checked and if the block is supported, then __two more attributes__ are added to its current attributes - `qtxRaw` and `qtxLang`;

* In the handler on the `editor.BlockEdit` hook, the block name is checked (*if the block is supported*) and the `clientId` of the block is checked to be in the list of __editable blocks__. The second check is needed because sometimes the blocks of those types that we support are created, but these blocks are not edited in the editor - for example, blocks for __visual preview__ of the editable block. If both checks are passed, then a panel with language switching buttons is added to the block options sidebar;

* When you change the attributes that are registered as content for the block, the qtxRaw attribute is updated. Since there can be more than one attribute for the content of the content, I have expanded the standard format for RAW content.

If before RAW looked like this:
```
[:en]Mom washed the window[:ru]Мама мыла раму[:]
```
Now (sometimes, when there are more than one attributes) RAW may look like this:
```
[:en]Mom washed the window[:ru]Мама мыла раму[:][,][:en]ABC-book[:ru]Букварь[:]
```
Notice the appearance of the `[,]` element, which separates the two RAW content.

* After switching the language, the `qtxLang` attribute is updated and the current values of the content attributes __are replaced__ with the values for the active language;

* On save a block, the new `qtxRaw` and `qtxLang` attributes are saved with the block. Since the block considers these attributes to be its "*native*" ones, standard mechanisms are used to store and change them. The block stores the values of the __content attributes__ with the values for the language that was __last edited__;

* On the front-end, when the page is being rendered, __qTranslate-XT__ replaces the RAW values with the content for the active language in the `'the_posts'` filter. We also connect to this filter with a __priority of 0__ (*that is, before qTranslate-XT*) and perform the replacement in blocks.
For each supported block on the page and for each content attribute, we get the RAW value from `qtxRaw`, use `qtxLang` to determine the last edited language and replace the value for that language __with the RAW value__. Then `qTranslate-XT` will replace RAW with the desired values in the next step.
> &#x2757; There is definitely some unnecessary processing of the page, but it is worth optimizing this step together with the developers of qTranslate-XT.

## For Non-Regular Blocks

Currently, the `'title'` and `'excerpt'` attributes are supported as non-regular blocks (*but the addition of new blocks is already included in the algorithm*). For non-regular blocks, the algorithm is as follows:

* In the filter `rest_prepare_{$post_type}` we add the RAW values for the required attributes to the REST response;

* When initializing the Block Editor, a custom Redux Store is created to store RAW values, the current language and hooks for all editable blocks;

* The store is initialized with RAW values that we added to the REST response in the first step;

* Using the plugin mechanism (*other plugins, these are plugins for extending the document editing panels in the Block Editor*), a language switching panel is added to the document;

* For each tracked attribute, an __input element__ (`textarea` or `input`) is found and an `EventListener` is attached to it. Since when switching to the block editing mode, as well as when closing the panels (*where the attribute is located*), all input elements will be deleted and our `EventListeners` will die along with them - we also add a __Mutation Observer__ and watch when these input elements reappear in the DOM, and then we add the `EventListener` again;

* Do the initial synchronization for the active language;

* When the tracked attribute changes, our `EventListeners` receive notifications and we change the RAW value in the store;

* When switching the language, we save the new language in the store, change the values of the tracked attributes to the values for the active language and call all the registered hooks for the blocks to synchronize the language switching;

* When saving the document, we embed in __apiFetch__ and change the values of the saved attributes to RAW values;

* On the server, add the `'rest_request_after_callbacks'` filter and change the RAW values (*which have already been saved in the database*) to the values for the active language (because the Block Editor uses the values from the REST response to update the attributes on the page). Since we have stored the RAW values in the database, no additional post-processing is required for the front-end.

## Known Problems and Pitfalls

- [x] ~~implement that after switching the language, the status of the editor left "unchanged" if before switching it was "unchanged". That is, to avoid Gutenberg to detect that data changes occurred if we just switched the language~~
- [ ] when publishing new material, the message "Are you ready to publish?" appears in which the RAW values of the site name are visible
- [ ] if there are several attributes and their values will be equal, then when replacing the attributes with their RAW values, confusion will occur (on the front-end). It is not clear how real this situation is... and how to deal with it?
- [ ] It is not clear what will happen after converting a page that was edited in the classic editor and then switched to Gutenberg
- [ ] JS:createRawContent - the option when more than one attribute contained RAW is not processed, this seems to be impossible because before this plugin the RAW was not split by attributes
- [ ] JS:qTranslateConfig:setupLanguageSwitch - we have to call `setupLanguageSwitch` since `'qtx'` does not export the `onTabSwitch` function. If this function was available for integration, it was much easier
- [x] ~~PHP:modify_rest_response - is the `editor_lang` attribute needed now?~~
- [ ] PHP:restore_post_content - now the case is not processed when one (or more) attribute is in content, and the other is in the special comment to the block (`<!-- wp:<block name>`). I have not met such a situation, but suddenly it is possible?
- [ ] `'core/table'` cannot be translated - first I need to implement the processing of the attribute which is an array of values that require translation
