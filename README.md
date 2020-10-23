# Zukit

_Framework serves as the basis for creating plugins or themes for WordPress._

Implements basic functionality for managing scripts and creating plugin or theme settings page based on Gutenberg functionality.

## Install
To _use_ __Zukit__ in your project, you need to create a `zukit` folder in the plugin root directory and then perform the following sequence of commands:

```shell
# you must be inside the 'zukit' folder!

$ git init                                                                  # create new repository

$ git remote add -f origin https://github.com/picasso/zukit.git             # initialize remote

$ git config core.sparsecheckout true                                       # enable sparse-checkout

$ echo -e '*\n!src/**\n!*.json\n!*.md\n!.*' >> .git/info/sparse-checkout    # configure sparse-checkout by specifying what files are not included

$ git pull origin master                                                    # checkout from the remote

```
See [Git Sparse Checkout](https://www.git-scm.com/docs/git-sparse-checkout) for complete docs and examples.


It is also a good idea to add this line to your `.gitignore` file:
```
zukit/.git/
```

### Download

The latest version of __Zukit__ can downloaded [on GitHub](https://github.com/picasso/zukit/archive/master.zip)

## Description

- Создать новый класс наследующий класс `zukit_Plugin`
```php
class my_Class extends zukit_Plugin {
}
```
- Переопредилить метод `config` в которой вернуть массив с ключами. Практически все ключи являются опциональным кроме ключа `prefix`, который должен содержать некое уникальное имя используемое во многих методах впоследствии.

```php
protected function config() {
    return  [
        'prefix'			=> 'myplugin',
        // set true if 'Zukit' script & CSS should be loaded
        'zukit'				=> true,         
        // default values for plugin options
        'options'			=> [
            'option1'			=> true,
            'option2' 		    => false,
            'option3'		    => 'somevalue',
        ],
    ];
}
```
- Если необходимо сделать что-то в конструкторе класса, то нужно переопределить метод `construct_more`. __Нельзя!__ пользоваться функциями по работе с `options` в этом методе, так там `options` еще не определены:
```php
protected function construct_more() {
    add_action('add_attachment', [$this, 'attachment_save']);
    add_filter('attachment_fields_to_edit', [$this, 'add_attachment_field'], 10, 2);

    // you should avoid ‘options’ getter and setter here!!
    //
    // if($this->is_option('option1')) {
    //     add_action('pre_get_posts', [$this, 'pre_get_attachments']);
    // }
}
```

#### Options
- для получения __options__ и их обновления служат методы `options` and `update_options`
- метод `reset_options` служит для сброса __options__  к default values. На странице настроек плагина автоматические создается кнопка, которая вызывает это метод по AJAX
- метод `set_option` служит для установки значения __options__ по конкретному ключу и их обновления. Если argument `$key` содержит __path__ (dots separated keys), тогда будет найден требуемый ключ in nested options
- метод `is_option` служит для сравнения значения по заданому ключу со вторым аргументом метода. Для типов 'bool', 'int' и 'string' происходит cast to required value type
```php
if($this->is_option('option1')) {
    add_action('pre_get_posts', [$this, 'pre_get_attachments']);
}

if($this->is_option('option3', 'value3')) {
    add_image_size($name, $width, $height, $crop);
}

// will be set ['more_option' => ['nextkey' => true]]
$this->set_option('more_option.nextkey', true);

```

#### Init
Плагину не требуется добавлять action на события `init` and `admin_init` - нужно просто переопределить методы с такими названиями и в них выполнить необходимые инициализации. Внутри этих методов можно безопасно обращаться к `options`.
```php
public function init() {
    if($this->is_option('add_category')) {
        register_taxonomy_for_object_type('category', 'attachment');
    }
}

public function admin_init() {
    if(!session_id()) session_start();
}
```

#### Scripts & Styles

- Для загрузки JS скриптов нужно переопределить метод `should_load_js` в котором вернуть true если скрипт должен быть загружен (если скрипт не нужен то и переопределение метода не требуется). Метод имеет два аргумента: `$is_frontend` and `$hook`. Имя файла скрипта будет сформировано автоматически на основание `prefix` (см. выше). Для скрипта загружаемого на front-end это будет файл `js/<prefix>.min.js`, а для админ страниц будет файл `admin/js/<prefix>.min.js`. Если админ скрипт содержит только управление настройками плагина, то его загрузку лучше ограничить этой страницей с помощью helper method `ends_with_slug` (см. пример).

```php
// for front-end and admin scripts
protected function should_load_js($is_frontend, $hook) {
    return $is_frontend ? true : $this->ends_with_slug($hook);
}

// for admin script only
protected function should_load_js($is_frontend, $hook) {
    return !$is_frontend && $this->ends_with_slug($hook);
}
```

- Для загрузки styles нужно переопределить метод `should_load_css`. Аргументы и логика работы такая же как со скриптами. Для styles загружаемых на front-end это будет файл `css/<prefix>.css`, а для админ страниц будет файл `admin/css/<prefix>.css`.

- По умолчанию an array of dependencies the script depends on is empty for front-end and `['wp-api', 'wp-i18n', 'wp-components', 'wp-element']` for admin script. For styles - is empty for front-end and `['wp-edit-post']` for admin styles. Для измения этих значений нужно переопределить методы `js_deps` или `css_deps` соответственно:

```php
// dependencies for scripts
protected function js_deps($is_frontend) {
    return $is_frontend ? ['jquery'] : parent::js_deps($is_frontend);
}

// dependencies for styles
protected function css_deps($is_frontend) {
    return $is_frontend ? [] : ['wp-edit-post', 'wp-editor-font'];
}
```

- По умолчанию для JS скрипта создается JSON object доступный из скрипта по переменной с именем `zukit_settings` и содержащий необходимые данные для работы __Zukit__. Если требуются дополнительные данные, то нужно переопределить метод `js_data`. Для того чтобы сохранить данные необходимые для работы __Zukit__ рекомендуется merge your data with default set. You also could rename the variable which will be available in javascript via `jsdata_name` key (see example). Обычно дополнительные данные нужны если вы отобразить дополнительные AJAX actions на странице настроек плагина.
```php
protected function js_data($is_frontend, $default_data) {
    return  $is_frontend ? [] : array_merge($default_data, [
        'jsdata_name'	=> 'myplugin_settings',
        'actions' 		=> [
            [
                'label'		=> __('My Action 1', 'myplugin'),
                'value'		=> 'myplugin_action_one',
                'icon'		=> 'update',
                'color'		=> 'green',
                'help'		=> 'Remove stored keys or anything else...',
            ],
            [
                'label'		=> __('My Action 2', 'myplugin'),
                'value'		=> 'myplugin_action_two',
                'icon'		=> 'admin-customizer',
                'color'		=> 'gold',
                // the button will be visible only if this option is 'true'
                'depends'	=> 'option2',
            ],
        ],
    ]);
}
```

- Если требуется загрузить больше, чем один script or styles, то нужно переопределить метод `enqueue_more`. У него тоже два аргумента: `$is_frontend` and `$hook`. Для удобства можно воспользоваться helper методами `sprintf_dir` и `sprintf_uri` которые работают аналогично функции `sprintf`, но добавляют в начало создаваемой строки plugin directory or uri соответственно. Также есть helper методы `enqueue_style` и `enqueue_script` для добавления на front-end страницах и `admin_enqueue_style` и `admin_enqueue_script` для добавления на админ страницах:
```php
protected function enqueue_more($is_frontend, $hook) {
    if($is_frontend) {

        // the styles with path 'css/gallery.css',
        // without dependencies
        // with handle 'gallery'
        // will be added in header
        $this->enqueue_style('gallery');

    } else if(in_array($hook, ['customize.php', 'widgets.php'])) {

        // the script with path 'admin/js/my-colors.min.js',
        // without wp_localize_script() data,
        // with dependency 'jquery'
        // with handle 'my-colors-script'
        // will be added in footer
        $this->admin_enqueue_script('my-colors', null, ['jquery']);

        // the script with path '/dist/js/more.js',
        // without JS data,
        // with dependency 'lodash' and 'jquery-ui-droppable'
        // with handle 'more-script'
        // will be added in header
        $filename = 'more';
        $absolute_path = $this->sprintf_dir('/dist/js/%1$s.js', $filename);
        // if we use absolute path then $file should start with '!'
        $this->admin_enqueue_script('!'.$absolute_path, null, ['lodash','jquery-ui-droppable'], 'more-script', false);
    }
}
```


------------------------------------------------------

### Structure of "Zukit"

- Folder __dist__ contains _production_ versions of js and css files;
- Folder __snippets__ contains a collection of various functions that I have accumulated during my work with WordPress. They are combined into one class for ease of use;
- Folder __traits__ contains traits that are included in the class `zukit_Plugin`. Used to group functionality in a fine-grained and consistent way;
- Folder __src__ contains _source_ versions of js and css files.

<!-- See [Dmitry Rudakov Coding](https://dmitryrudakov.com/coding/) for complete docs and demos.
-->
