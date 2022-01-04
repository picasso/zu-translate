#### 1.0.1 / 2022-01-04
* refactoring with `Zukit` components
* created custom `store` for RAW values
* added `shortcode` support
* added `tick` to language buttons
* added `flags` for language buttons
* added `panelIndicator` for language panel
* added `title indicator` to document plugin
* added `request_after_callbacks` action
* added `zutranslate_reset_supported` action
* added `Input Listeners` to track `attributes` changes
* added `settings` styles, refactoring `settings` file structure
* synchronize switching after editing blocks
* implemented RAW split on content blocks for each attribute
* passing URL language with JS data, because we need it before creating a document panel
* conditional creation of blocks for Gutenberg support
* added check for *broken* RAW values
* fixed bug in `getTranslatedValues` function
* fixed `Auto Draft` in empty `title`

#### 1.0.0 / 2021-12-14
* refactoring for __Zukit__
* added basic files and folders
* added CSS for `editor` blocks
* implemented `PluginDocumentSettingPanel` as root language switcher
* implemented `LangControl` as separate component
* moving `utils` to root level
* added filters for `rest_prepare`

#### 0.9.6 / 2017-05-22
* css improved
* fixed bug with `Copy Content Only` button
* new implementation of language switcher for widgets (which now use CodeMirror editor)

#### 0.9.4 / 2017-04-10
* added `span` processing in attachment modal
* added `location` field processing
* css optimization

#### 0.9.3 / 2017-04-09
* added option `media_details` which activate JS for attachment details modal
* script `tplus-admin-upload.js` was rewritten to keep translated attachment fields via AJAX update
* file `admin\qtx_admin_utils.php` was modified (line #20) to include TPLUS_VERSION in loaded JS
* css optimization

#### 0.9.2 / 2017-03-25
* css optimization

#### 0.9.1 / 2017-03-25
* css improved
* added functions to work with multilingual content - `tplus_get_content()`, `tplus_cut_content()`, `tplus_modify_content()`

#### 0.8.5 / 2017-03-20
* renamed submenu for `qTranslate-X`
* plugin settigns put below `qTranslate-X` submenu
* added separator

#### 0.8.3 / 2017-03-14
* updated `i18n-config.json` to work with `upload.php`
* new script `tplus-admin-upload.js` to translate media attachment fields
* css optimization

#### 0.8.2 / 2017-11-01
* `tplus_options` bug fixed

#### 0.8.1 / 2017-10-13
* adaptation to ZU+
* css optimization

#### 0.7.6 / 2017-08-24
* refactored `include_once(`dr-debug.php`)` to avoid reference to fixed path
* added _GitHub Plugin URI_ to main file

#### 0.7.5 / 2017-08-24
* added support for [GitHub Updater](https://github.com/afragen/github-updater/)
