# Zukit: The Developer Framework for WordPress.

[![Zukit Version](https://img.shields.io/github/package-json/v/picasso/zukit?style=for-the-badge)](https://github.com/picasso/zukit/wiki)
[![Zukit: Tested WP Version](https://img.shields.io/github/package-json/testedWP/picasso/zukit?color=4ab866&label=wordpress%20tested&style=for-the-badge)](https://wordpress.org)
[![Zukit Required PHP Version](https://img.shields.io/github/package-json/requiresPHP/picasso/zukit?color=bc2a8d&label=php&style=for-the-badge)](https://www.php.net/)
[![License](https://img.shields.io/github/license/picasso/zukit?color=fcbf00&style=for-the-badge)](https://github.com/picasso/zukit/blob/master/LICENSE)

The __Zukit__ framework serves as the basis for creating plugins or themes for WordPress.
Implements basic functionality for managing scripts and creating plugin or theme settings page based on Gutenberg functionality.

![ZuKit - The Developer Framework for WordPress.](https://raw.githubusercontent.com/wiki/picasso/zukit/assets/banner-1544x500.png)


## Install

To _use_ __Zukit__ framework in your project, you need to load its classes before referring to the class that inherits the framework methods. There are many ways to do this, but the easiest one is [to install the framework](https://github.com/picasso/zukit/wiki/%5BMisc%5D-Install) as a `subtree` in your project.

## Documentation

The best way to learn a framework is to look at working examples of its use. This can be done in plugins that I have already adapted for the new framework: [Zu Contact](https://github.com/picasso/zu-contact), [Zu Media](https://github.com/picasso/zumedia) and [Zu Plus](https://github.com/picasso/zu-plus).

Documentation is available on the [GitHub wiki](https://github.com/picasso/zukit/wiki). There I described the main points of working with the framework.


------------------------------------------------------

### Structure of "Zukit"

- Folder __dist__ contains _production_ versions `JS` and `CSS` files;
- Folder __lang__ contains files needed for translations;
- Folder __snippets__ contains a collection of various functions that I have accumulated during my work with WordPress. They are combined into one class for ease of use;
- Folder __traits__ contains traits that are included in the class `zukit_Plugin`. Used to group functionality in a fine-grained and consistent way;
- Folder __src__ contains _source_ versions of `JS` and `CSS` files.

<!--
коды для emoji unicode
https://apps.timwhitlock.info/emoji/tables/unicode

```diff
- red
+ green
! orange
# gray
```
-->

<!-- See [Dmitry Rudakov Coding](https://dmitryrudakov.com/coding/) for complete docs and demos.
-->
