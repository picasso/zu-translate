# Zu Translate: qTranslate-XT on steroids.

[![WordPress Plugin Version](https://img.shields.io/wordpress/plugin/v/zu-translate?style=for-the-badge)](https://wordpress.org/plugins/zu-translate/)
[![WordPress Plugin: Tested WP Version](https://img.shields.io/wordpress/plugin/tested/zu-translate?color=4ab866&style=for-the-badge)](https://wordpress.org)
[![WordPress Plugin Required PHP Version](https://img.shields.io/wordpress/plugin/required-php/zu-translate?color=bc2a8d&style=for-the-badge)](https://www.php.net/)
[![License](https://img.shields.io/github/license/picasso/zu-translate?color=fcbf00&style=for-the-badge)](https://github.com/picasso/zu-translate/blob/master/LICENSE)

 <!-- ![WordPress Plugin Downloads](https://img.shields.io/wordpress/plugin/dt/zu-translate?color=00aced&style=for-the-badge) -->

This plugin is not independent. It adds functionality and implements *Gutenberg* (__WordPress Block Editor__) support for the [qTranslate-XT](https://github.com/qtranslate/qtranslate-xt/) plugin. Perhaps someday it will be integrated into `qTranslate-XT`, and perhaps never.

![Zu Translate - qTranslate-XT on steroids.](https://user-images.githubusercontent.com/399395/148209305-38c43421-1e8d-44e6-8015-6733efd7610b.png)


## Description

After the WordPress changed the `TinyMCE` to the Block Editor (*Gutenberg*), editing the multilingual content significantly complicated. The old algorithms of the __qTranslate-XT__ plugin, which successfully worked before - stopped working. This plugin is an attempt to find a new solution for editing multilingual content in the Block Editor. In addition, there were always nuances that did not suit me in __qTranslate-XT__ plugin. Solutions of these "*problems*" are also implemented in this plugin. Use it or not - already your choice.

> &#x1F383; Testing this plugin cannot be called comprehensive. Therefore, use it at your own risk.

### Features

* Support for switching language in the __Block Editor__
* Synchronize language switch for all editable blocks
* Ability to add custom blocks to the list supported by this plugin
* Control of the appearance of buttons to switch language
* Ability to switch language in the list of posts/pages
* Ability to switch language in the modal window of __Media Library__
* Supports adding a language switcher to any post or page using a `shortcode`
* Ability to use `shortcode` in the WordPress __menu__

### Shortcode attributes

You can also personalize the form by adding attributes to the shortcode:

* __class__ - additional classes that will be added to the main element: `class="my-switcher"`
* __as_code__ - use language codes as the name of the switcher items: `as_code=true`
* __unsorted__ - if sorted (default) then the active language will be always on top: `unsorted=true`
* __post_id__ - post ID for which you want to create a language switcher (default for the current post): `post_id=123`

#### Examples

* With language codes and "unsorted":

`[zu-lang unsorted=true as_code=true]`

* With custom class for Post ID 1209:

`[zu-lang class="my-switcher" post_id=1209]`


## Download

+ [Zu Translate on GitHub](https://github.com/picasso/zu-translate/archive/refs/heads/master.zip)

## Installation

1. Upload the `zu-translate` folder to the `/wp-content/plugins/` directory.
2. Activate the plugin using the `Plugins` menu in your WordPress admin panel.
3. You can adjust the necessary settings using your WordPress admin panel in `Settings > Zu Translate`.

## Public methods

In order to take advantage of the switching language implemented in this plugin, Plugins and themes can add their custom blocks using these functions:

+ __zutrans_is_multilang()__
+ __zutrans_register_blocks(`$blocks`)__
+ __zutrans_get_all_languages(`$sorted = true`)__
+ __zutrans_convert_text(`$text`, `$lang = null`, `$flags = 0`)__
+ __zutrans_convert_url(`$url`, `$lang = null`, `$flags = 0`)__

If you are using the __Zukit__ framework, you can use the internal methods of your class - `snippets` and `_snippets`.
