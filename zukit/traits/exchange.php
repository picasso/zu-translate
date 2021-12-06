<?php

// NOTE: All methods for Exchange must be public!

// Plugin Exchange Trait ------------------------------------------------------]

trait zukit_Exchange {

	static private $providers_logged = false;
	private $methods = [];
	private $defaults = [];

	private function register_exchange_defaults($default_values) {
		$this->defaults = array_merge($this->defaults, is_array($default_values) ? $default_values : [$default_values]);
	}

	private function method_exists($name) {
		return array_key_exists($name, $this->methods);
	}

	// if default value is '$1' then first element from $params(func arguments) will be returned
	// same for '$2', '$3' etc.
	private function get_default($name, $params) {
		$default_value = $this->defaults[$name] ?? null;
		if(is_string($default_value)) {
			// argument index begins with zero - therefore minus 1
			$index = preg_match('/\$(\d+)/', $default_value, $matches) ? absint($matches[1] - 1) : false;
			if($index !== false) $default_value = $params[$index] ?? null;
		}
		return $default_value;
	}

	public function register_provider($name, $provider = null, $suffix = null) {
		$method_name = $suffix ? "{$name}_{$suffix}" : $name;
		$this->methods[$name] = [$provider ?: $this, $method_name];
	}

	public function call_provider($name, ...$params) {
		$default_value = $this->get_default($name, $params);
		if($this->method_exists($name)) {
			$func = $this->methods[$name];
			return is_callable($func) ? call_user_func_array($func, $params) : $default_value;
		}
		return $default_value;
	}

	public function check_provider($name, ...$params) {
		$method = $this->methods[$name] ?? null;
		return [
			'exists'	=> $this->method_exists($name) ? 'yes' : 'no',
			'func'		=> $method[1] ?? '?',
			'defaults'	=> $this->get_default($name, $params),
			'class'		=> is_object($method[0] ?? null) ? get_class($method[0]) : null,
		];
	}

	public function log_providers() {
		if(wp_doing_cron() || wp_doing_ajax()) return;
		// with a large volume of Exchange - it is a very resource-intensive operation,
		// so log all providers only once at the very beginning
		if(self::$providers_logged === false) {
			$methods = $this->methods;
			foreach($methods as $key => $value) {
				$name = is_object($value[0]) ? get_class($value[0]) : false;
				if($name !== false) $methods[$key][0] = "instance of $name";
			}
			zu_logc('*Exchange providers', $methods);
			self::$providers_logged = true;
		}
	}
}

trait zukit_ExchangeWithMagic {

	use zukit_Exchange;
	
	public function __call($method, $args) {
		if(!$this->method_exists($method)) {
			$this->log_providers();
			$this->logc('?Trying to call an unavailable method', [
				'method'		=> $method,
				'args'			=> $args,
			]);
			return null;
		}
		return $this->call_provider($method, ...$args);
	}
}

// Add-on Provider Trait ------------------------------------------------------]

trait zukit_Provider {

	static private $logged_providers = [];
	protected function debug_providers() {}

	protected function register_provider($name) {
		return $this->plugin->register_provider($name, $this); //, 'origin');
	}

	private function log_calls($method, $args) {
		$debug = $this->debug_providers() ?? [];
		// skip logging if array is empty or contains '!all' element
		if(empty($debug) || in_array('!all', $debug)) return;
		if(in_array($method, $debug) || in_array('all', $debug)) {
			$check = $this->plugin->check_provider($method, ...$args);
			$context = 'Check provider';
			// if there is a key 'missing' then log only non-existent methods
			if(in_array('missing', $debug)) {
			  $check = $check['exists'] === 'yes' ? null : $check;
			  if($check !== null) $context = '?Missing provider';
			}
			// exclude method logging if it is present in the array with a minus sign
			// do not log information for each call, only once
			if($check && !in_array("-$method", $debug) && !in_array($method, self::$logged_providers)) {
				$this->plugin->log_providers();
				zu_logc("$context [$method]", $check);
				self::$logged_providers[] = $method;
			}
		}
	}

	public function call_addon_provider($method, $args) {
		$this->log_calls($method, $args);
		return $this->plugin->call_provider($method, ...$args);
	}
}
