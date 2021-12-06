<?php
trait zusnippets_Extend {

	private $ex_methods = [];
	private $ex_defaults = [];
	private $soft_exception = true;

    // Dynamically Extend snippets with new methods ---------------------------]

	public function method_exists($name) {
		return method_exists($this, $name) || array_key_exists($name, $this->ex_methods);
	}

	public function register_method($name, $instance, $default = null) {
		$this->ex_methods[$name] = [$instance, $name];
		$this->ex_defaults[$name] = $default;
	}

	public function __call($method, $args) {
		if(!array_key_exists($method, $this->ex_methods)) {
			$this->logc('?Snippets method not found!', [
				'method'		=> $method,
				'args'			=> $args,
				'ex_methods'	=> $this->ex_methods,
			]);
			if($this->soft_exception === false) throw new BadMethodCallException();
			return null;
		}

		return $this->get_call_or_default($method, $args);
	}

	private function get_call_or_default($method, $args) {
		$func = $this->ex_methods[$method] ?? null;
		// zu_log($method, $func, is_callable($func), $this->ex_defaults[$method]);
		return is_callable($func) ? call_user_func_array($func, $args) : ($this->ex_defaults[$method] ?? null);
	}

	private function maybe_call($method, ...$args) {
		return $this->method_exists($method) ? $this->get_call_or_default($method, $args) : null;
	}
}
