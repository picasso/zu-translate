#### 1.5.0 / 2022-01-25
* color modifiers support for opaque colors in `Debug` module
* some helpers for input/textarea manipulations (compatible with React) in `JQ` module
* minify JS output

#### 1.4.9 / 2022-01-20

##### Core
* refactoring `AdminMenu` methods (*docs update required*)
* implemented `keep_file` and `get_file` static methods to keep file paths
* added `File` field to plugin/theme meta

##### Components
* refactoring `zukit_Table` class and `ZukitTable` component to support CSS Grid layout
* added `ZukitToggle` component with simple markdown support
* use `ZukitToggle` instead of `ToggleControl`

##### Debug
* added simple `__log` method - for debugging without any classes
* added support for `Color Modifiers` in `info` method
* disable __Zukit__ scripts caching with static `zukit_debug` method
* removed `package.json` import (and `ver` getter) in `Debug` module

##### Other
* updated NPM package dependencies
* logo experiments
* improved CSS

#### 1.4.8 / 2022-01-11

* refactoring how __Zukit__ color palette can be extended
* added key `extended_colors` in section `blocks` for config
* added `getColorGetter` that creates custom color getter for plugin/theme

#### 1.4.7 / 2022-01-09

* added `get_full_filepath` scripts helper

#### 1.4.6 / 2022-01-04

##### Core
* added `has_snippet` method
* added `get_callable` method which allows you to use functions as configuration values
* all `set_option` for Ajax requests are now running with the option `rewrite_array` equal to true
* fixed bug in method `set_option` when `rewrite_array` is true and `key` is path

##### Components
* added `onKeyEnter` prop for `AdvTextControl` component
* added `isSideBySide` prop to `ListInputControl` and `AdvTextControl` components
* some CSS fix and `htmlFor` support when `isSideBySide` is true for `ListInputControl` and `AdvTextControl` components
* added `isOpen` and `isNotEmptyLabel` props for `ListInput` Component
* added `more` argument in `transformValue` function for `SelectItemControl` component
* disable animation in `ListInputControl` component when `isOpen` is true

##### Other
* added `scrollTop` DOM helper
* added `jquery-helpers` to global export for Settings Page
* added `noColon` check for `messageWithError` function

#### 1.4.4 / 2021-12-29

* added a new version number that forgot in the past release
* changed the title font for the `Settings Page`
* changed the first section header to the `General Settings`
* small improvements

#### 1.4.3 / 2021-12-28

##### Core
* added `useForceUpdater` custom hook
* fixed bug in `set_option` method when `$value` is array and `$key` is path
* made `path_autocreated` = `true` by default
* added explanation (*in comments*) when `simpleMarkdown` does not work

##### Blocks & Components
* added `TitleIndicator` component
* added `withPlugin` and `withPluginMeta` HOCs to work with predefined WP slots (*PluginDocumentSettingPanel*, *PluginSidebar* and etc.)
* exported `debug` module for __Zukit__ settings

##### CSS
* fix styles of some `standard` controls (checkbox, toggle)
* small improvements

#### 1.4.2 / 2021-12-10

##### Core
* changed parser to ecmaVersion 11
* implemented `do_with_instances` to iterate all __Zukit__ instances for given method
* refactoring `do_addons` to work with `options` and `collect` results
* added `extend_metadata` method which allows you to modify the name, description and other information about the plugin/theme
* refactoring `ConditionalWrap` after understanding how the JSX works with the `createEelement` function
* added custom hooks - `useRefInit` and `useRefDefaults`
* refactoring React custom hooks for `folders`
* added `safe` transformation for path in `sprintf_dir` and `sprintf_uri`
* added `safe` replacement for some formatting characters
* added `externalDataSettings` function in `render` set
* added warning when `getExternalData` was not called
* added `container` option for `simpleMarkdown` function
* added `findWithClientId` jQuery helper
* replacing deprecated jQuery methods
* implemented `getAttrWithClientId` and `getCssWithClientId` jQuery helpers

##### Debug
* refactoring `debug` module with new knowledge about React hooks
* improved `useTraceUpdate`, implemented check for `added` and `removed` keys
* improved `colored` console for Safari
* changed codes for `colored console` blocks

##### REST &  AJAX
* fixed bug with `zudata` Ajax request
* grouped the keys for the REST API
* refactoring REST settings (implemented `setRestBasics` and `restRequestURL` methods)

##### CSS
* converted `instyle` SASS to SCSS
* renaming some colors
* improved `getColorOptions` to work with a list of slugs to be excluded
* added `extend_block_colors` to modify the default __Zukit__ color palette
* modified css for `__code` in markdown
* added `__zu_markdown` class to plugin/theme description
* implemented `markdown` in plugin/theme description
* small improvements

##### Snippets
* improved `array_flatten` snippet to work with associative arrays

#### 1.4.0 / 2021-10-16
* adapted to WP 5.8.1

##### Core
* implemented `zukit_ExchangeWithMagic` trait
* refactoring redirect to parent methods with PHP `__call`
* added `construct_more_inner` method to free `construct_more` for users
* implemented `initial_options` method
* renaming `config_singleton` to `singleton_config`
* renaming `call` method to `call_parent`
* redefined `array_with_defaults` method from snippets for convenience
* improved `extend snippets`, `frontend_handles`, `trace_summary` and `prefix_it` methods
* split the `init` for plugins and themes
* added logic to the `do_addons` method for passing the return value and for swap between the parameter and the return value
* arguments `$script_code` and `$js_file` can be arrays
* simplified the error checking method
* fixed bug when closing tag has no space after attribute value in `zu_sprintf`
* refactoring dependencies for scripts and styles to fix errors in WP 5.8 (widgets.php)

##### REST &  AJAX
* renaming `ajax.php` trait to `ajax-rest.php`
* implemented `default_options` AJAX response
* logic of `set_options_ajax` method is changed - if at least one call returns `true`, then the overall result will also be `true`
* refactoring `sanitize helpers`, added `rest_response` and `maybe_fix_sanitize` methods

##### Blocks & Components
* improved `SelectItemControl` component - added `fillNull` option and `smart style` support
* refactoring `zukit_Blocks` to allow use `config` from the class that was inherited from `zukit_Blocks`
* added the ability to create an instance of the `zukit_Blocks` class by name
* added `id` prop to pass it to `<TextControl>`
* implemented `resetOptions` callback and passed it to `<EditComponent>`
* added `afterUpdateCallback` to `updateOptions` helper
* renaming internal `resetOptions` callback to `resetAllOptions`
* improved `svgRef` and `getColor` helpers

##### CSS
* refactoring SASS with `div()` function because using `/` for division is deprecated
* small fixes for Safari browser
* added `__note` global class

##### Snippets
* moving `arrays` methods to separate trait
* added `cast_array`, `array_zip_merge`, `add_inline_script_now`, `build_style` methods
* added `null_on_failure` arg for `to_bool` function
* added `minify` argument for inline styles and scripts
* added `as_array` argument for `get_background_color` method
* added `$reindex` argument to `array_pick_keys`, `array_without_keys` and `array_without_null` methods
* fixed bug in `get_excerpt` function

##### Other
* The Wiki was last updated on Apr 16 2021.

#### 1.3.0 / 2021-08-10
* supports `version` property
* implemented `Extend` trait to dynamically extend snippets with new methods
* added `Exchange` trait to support communication between add-ons
* implemented extended logging for debug `Exchange` methods
* added SVG curves
* added support for main stylesheet (_themes only_)
* added `$dir` and `$uri` properties in `zukit_Addon` class

* implemented snippets for working with arrays: `array_without_keys`, `array_without_null`, `array_pick_keys`, `array_with_defaults`, `array_flatten`, `is_assoc_array`, `array_md5`
* implemented snippets: `cast_bool`, `human_time_diff`, `remove_p`, `minify_js`, `get_default_background_color`
* added `_snippets` method to call snippets without warning if the snippet does not exist
* added `maybe_call` method to call snippets that can be added from plugins
* added static `trace_summary` method for `zukit_Logging` trait
* added `register_snippet`, `get_parent_option` and `is_origin` methods
* added `with_another` method to cross-call add-on methods
* added `println` and `zu_printfln` functions
* added profiling methods (with __QueryMonitor__)

* methods for `featured` have been moved to a separate trait
* methods for `options` have been moved to a separate trait
* refactoring inline methods
* refactoring `plugin_data` method to work with themes
* renaming to `get_file_metadata`
* refactoring `info` method based on recent changes
* improved `split_classes` method with `array_flatten`
* method `is_option` now supports array for `$key` argument and `!` symbol to negate check
* added check for `null` array in array helpers
* improved interaction with `options`
* improved `zu_log_if` function
* support for intentional `whitespace` in `zu_sprintf` function
* improved `zu_sprintf` function to clean up more empty spaces
* strip HTML comments in `minify_html` method
* renaming `add_fonts_style` to `add_inline_fonts_style`

* do not use PHP 7.* features in load.php!
* performance optimization for `insert_svg_from_file`
* fixed bug with mixing admin and front-end inlines
* fixed bug in `get_option` when value is array
* fixed: `add_admin_inline_style` is called only once now
* fixed bug with `GitHub` uri
* small improvements

#### 1.2.3 / 2021-05-03
* fixed bug with headers in `ZukitTable` component
* fixed bug for `Prevent Script Caching` when dealing with `zukit.min.js`

#### 1.2.2 / 2021-05-03
* implemented dynamic cells for `ZukitTable` component
* implemented support for `GitHub` __uri__ in `info` method
* rows in `Plugin Info` are now hidden through the `value` equal to __null__
* added class to markdown `code` output
* added simple markdown support to `Plugin Info` panel
* refactoring markdown css with SASS placeholders
* added `$template` arg for `format_bytes` method in __snippets__
* min `php` and `wp` versions updated
* refactoring `nonce` for add-ons
* fixed bug with `log` and `logc` methods for add-ons
* small CSS improvements

#### 1.2.0 / 2021-04-13
* refactoring `zukit_Singleton` to use `zukit_Logging` and `zukit_Scripts` traits
* added support for __Zukit__ version
* refactoring logging to work with `Zu Plus`
* all `log**` methods are moved to debug trait
* replaced `log_error` calls to `logс` from the new trait
* added `dump_log` method which can be overridden in a child class
* added `logfile_clean` method
* improved `debug_print` for menu and submenus arrays

* implemented `MoreActionsSlot` slot for additional actions
* support for the `hasMoreActions` key
* implemented `ZukitActionButton` component to make it easier to work with actions
* support for the `moreData` parameter in `ZukitSkeleton` component
* refactoring `selectOption` and `toggleOption` for more complete and consistent data support
* added support for array and logical operator in the `depends` argument

* added `simpleMarkdown` function for strings
* added `raw` and `json` params for `simpleMarkdown` function
* used `simpleMarkdown` in `help` elements
* used `simpleMarkdown` in notices
* replaced HTML in notices with markdown

* added `shrinked` mode for `ZukitTable` component
* added support for cell params, `markdown` and `link` cell
* added option to get table without `head`
* improved table css

* added `validate_url` method to __snippets__
* added `icons` set to __Zukit__ export
* force `$deps` to be an array in scripts params
* implemented `doing_rest` method
* added `getExternalData` function
* fixed `_doing_it_wrong` calls
* fixed bug with clearing when `debounce` is enabled in `AdvTextControl` component
* added states sync when `value` was changed outside the `AdvTextControl` component
* fixed bug with combined `data` and `status` in `onSuccessAjax` function
* fixed bug with `backdrop` color

* changed the license from GNU to MIT
* added banner and badges from img.shields.io
* other small fixes

#### 1.1.6 / 2021-03-26
* added inline style for submenu separators
* added `fillMissing` prop for `SelectItemControl` component
* tested for compatibility with WP 5.7

#### 1.1.5 / 2021-03-24
* added `compareVersions` function to `utils`
* passed a WP version to the script and basic containers
* improved JS and CSS for WP with version earlier than 5.5
* fixed bug `prefix already exists` in `zukit.sh`
* other small fixes

#### 1.1.4 / 2021-03-21
* added `ModalMessage` and `RawHTML` components for the Settings Page export
* added default size and `bottomHalf` option for `ZukitDivider` component
* added `ends_with_slug` helper for add-ons
* added `Settings Page` media breakpoints
* added media breakpoints for `sidebar` and some controls
* added `extend_actions` method
* added `style` support for `iconcell`
* added `re-init` flow for subtree shell script
* refactoring `refresh_scripts` support
* improved CSS for `interface-interface-skeleton` class
* fixed width calculation for `SelectItemControl`
* fixed bug with nested `depends` for `toggleOption` function
* fixed bug with `actions` data
* fixed bytes abbreviation on `B` instead of `b` in `format_bytes` function
* other small improvements

#### 1.1.3 / 2021-02-10
* changed configuration structure
* added access to nested configuration sections
* refactoring to use `config` instead of `js_params` and `css_params`
* refactoring to use plugin configuration for `zukit_Blocks` class
* added `handle_only` option for enqueue methods
* removed `is_config` method
* fixed bug when nested key is equal parent key in options/config
* fixed bug with recursive merging of config
* fixed `get_filepath` method
* added `called_class` for log methods when called non static
* moved most of the documentation from README to __wiki__
* other small improvements

#### 1.1.2 / 2021-01-08
* fixed bug with `lookbehind` regex (Safari does not support it)
* fixed bug with `shape` type in `LoaderControl` component
* improved CSS to be compatible with WP 5.6

#### 1.1.0 / 2021-01-06
* added `withDebounce` and `withoutValues` params for `AdvTextControl` component
* renaming `ListInput` and `SelectItem` components
* implemented `ModalMessage` component
* implemented alternative `RawHTML` component
* implemented `Loader` and `LoaderControl` components
* added `jquery-helpers` and `data-store`
* added `render` set for `zukit-blocks`

* added support for Custom Blocks addon
* implemented many helpers for Custom Blocks
* implemented `force_frontend_enqueue` method to load plugin/themes scripts with Custom Blocks
* added `Zukit Blocks` injection for Gutenberg pages
* added colors support for `Zukit Blocks`

* improvements to support data stores and REST API extending
* added support for custom stores
* added `api_basics` for `js_blocks_data`
* refactoring `get_zudata` method, added support for `extend_zudata`
* created Core Data store and Custom Hooks for Core Data
* all components changed based on REST API changes

* improved debug logging
* added `Debug` module to __Zukit__ Blocks
* added `log_error` method
* added `context` to log method
* added `_zlg` function for one variable logging
* added error logging for SVG loading
* changed `zukit` path detection

* using `get` method instead of direct config access
* all frontend scripts now use `suffix` param from config
* added `is_config` method, now is possible to cancel prefixing script name with `add_prefix` param
* method `enqueue only` now accept array as `$handle` param
* added method for marking active theme with body class
* changed filter name to `zukit_no_excerpt_blocks`

* removed `isLarge` param from all buttons
* added CSS for `zukit-modal` class
* improved body class snippets
* updated `loaders` and refactored with `group`
* other small improvements

#### 1.0.0 / 2020-12-06
* adapted to changes in WP 5.5
* refactoring use of plugin data
* added `falsely` type for `getPanel`
* implemented support for `depends` key in __Panels__
* improved compatibility check
* improved translations loading
* added basic debug log methods
* bug fixing

#### 0.9.9 / 2020-12-01
* refactoring compatibility check (for PHP and WordPress)
* improved `export-ignore` generation for archive
* updated `README` file

#### 0.9.8 / 2020-11-29
* bug fixing and improvements

#### 0.9.7 / 2020-11-28
* added translations
* fixed `Text Domain` for some translation calls
* implemented loading of translations for both `.MO` and `.JSON` forms
* created scripts for `JSON` translations
* added `testComponentWithUpdate` method
* implemented custom appearance for `Settings Page`
* added `loading` state to Debug Actions
* improved `ajax_error` method
* improved `README` file

#### 0.9.6 / 2020-11-24
* added `editMode` for `ListInput` component
* created new `AdvTextControl` component
* all debug methods moved to a separate trait
* added *debug options* to `Debug Panel` in sidebar
* added `array_prefix`, `to_bool`, `to_float`, `cast` and `shortcode_atts_with_cast` to __snippets__
* modified `insert_svg_from_file` and `array_prefix_keys` methods in __snippets__
* added `del_option` method
* implemented `del_option` via REST API
* added `path_autocreated` switch for `set_option` method
* improved __options__ hooks for cases when `key` contains `path`
* improved `log_error` method
* added `async` and `defer` options for script params
* css improvements and cleaning

#### 0.9.5 / 2020-11-09
* created a new component `ListInput`
* added `loaders` to __snippets__
* refactoring `js_data` methods
* renaming `renderPlugin` to `renderPage`
* implemented work with __options__ and __panels__ via useReducer to decrease re-renders
* refactoring `skeleton` and `sidebar` to work with new hooks
* fixed bug with `ZukitPanel` component created via inline function (*constantly unmounting*)
* fixed bugs in menu reordering
* improved output of `log_error` method
* improved css
* several sections are added to README

#### 0.9.4 / 2020-10-30
* fixed bug in `is_zukit_slug` method
* added `router` support for REST API methods
* added `router` support in `fetch.js`
* improved error processing in *fetch* functions
* changed the methods for creating additional info and actions for the sidebar
* css improvements

#### 0.9.3 / 2020-10-28
* method `enqueue_only` now enqueue both script and style when called without params
* implemented logic when `null` is replaced with default value in `js_params` and `css_params`
* added __bash script__ to install the framework
* store all Zukit slugs in *static* property to check with `is_zukit_slug` method
* store `zukit_Singleton` class location in a static property to use in `get_zukit_filepath`
* added `get_filepath_and_src` method
* moved enqueue of Zukit files in `zukit_enqueue` method
* small improvements

#### 0.9.2 / 2020-10-26
* refactored scripts methods to to separate `register` and `enqueue` phases
* added `enqueue_only` and `register_only` methods
* fixed bug in `zu_printf`
* added check to load Zukit scripts only once

#### 0.9.1 / 2020-10-23
* implemented `zu_sprintf` - special version of the `sprintf` function
* fixed bug with `wp_enqueue_scripts` action name
* added `merge_js_data` method
* added README in *mixed* language

#### 0.9.0 / 2020-10-22
* renaming __snippets__ index file
* small improvements

#### 0.8.0 / 2020-10-06
* initial commit (split from Zu Media)
