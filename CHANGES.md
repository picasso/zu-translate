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
