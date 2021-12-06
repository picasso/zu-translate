<?php

// The zukit_Singleton class defines the `instance` method that serves as an
// alternative to constructor and lets clients access the same instance of this
// class over and over.
class zukit_Singleton {

    public $prefix;
    public $version;
    public $debug;

    // To indicate to child classes that __construct is complete
    protected $created = false;

    // The zukit_Singleton's instance is stored in a static property. This property is an
    // array, because we'll allow our zukit_Singleton to have subclasses. Each item in
    // this array will be an instance of a specific zukit_Singleton's subclass.
    private static $instances = [];

    // We can only have one definition of the 'zukit_Singleton' class and therefore
    // store its location in a static property so that we can access its JS and CSS files later.
    protected static $zukit_root = __FILE__;

    // The zukit_Singleton's constructor should always be private to prevent direct
    // construction calls with the `new` operator.
    private function __construct($params) {
        $theme = wp_get_theme();
        $this->prefix = str_replace(' ', '_', strtolower($theme->get('Name')));
        $this->version = $theme->get('Version');
        $this->debug = false;

        if(method_exists($this, 'singleton_config_scripts')) $this->singleton_config_scripts();
        $this->singleton_config($params);
        $this->construct_more();
        $this->created = true;
    }

    // singleton should not be cloneable.
    final public function __clone() {
        _doing_it_wrong(__FUNCTION__, 'Singleton object -> we do not want it to be cloned', '1.0.0');
    }

    // singletons should not be restorable from strings.
    final public function __wakeup() {
        _doing_it_wrong(__FUNCTION__, 'Unserializing instances of this class is forbidden', '1.0.0');
    }

    // This is the static method that controls the access to the singleton
    // instance. On the first run, it creates a singleton object and places it
    // into the static property. On subsequent runs, it returns the client existing
    // object stored in the static field.

    // This implementation lets you subclass the zukit_Singleton class while keeping
    // just one instance of each subclass around.
    final public static function instance($params = null) {
        $calledClass = static::class;
        if(!isset(self::$instances[$calledClass])) {
            self::$instances[$calledClass] = new $calledClass($params);
        }
        return self::$instances[$calledClass];
    }

    protected function singleton_config($params) {}
    protected function construct_more() {}
}

require_once('traits/logging.php');
require_once('traits/scripts.php');

class zukit_SingletonLogging extends zukit_Singleton {
    use zukit_Logging;
}

class zukit_SingletonScripts extends zukit_SingletonLogging {
    use zukit_Scripts;
}
