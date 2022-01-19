<?php
trait zukit_Logging {

	private $basic_trace_shift = 3;

	private $sline = '─';
	private $dline = '═';
	// To filter log messages to some classes only
    private $log_filter = [];

	// static method for trace summary, use self::trace_summary() to call
	// as the second parameter, you can specify the name of the class whose existence you want to check
	public static function trace_summary($title = 'Trace Summary', $class_name = 'Zukit') {
		$trace = str_replace(',', PHP_EOL, wp_debug_backtrace_summary());
		$ajax = wp_doing_ajax() ? 'DOING AJAX' : 'NOT AJAX';
		$cron = wp_doing_cron() ? 'DOING CRON' : 'NOT CRON';
		$exists = class_exists($class_name) ? 'class exists' : 'class NOT exists';
		$log = sprintf(
			'### %7$s ### : %1$s, %2$s, "%5$s" %6$s%4$s%3$s%4$s',
			$ajax,
			$cron,
			$trace,
			PHP_EOL,
			$class_name,
			$exists,
			$title
		);
		error_log($log);
	}

	// Basic error logging ----------------------------------------------------]

	public function log(...$params) {
        $this->log_with(0, null, ...$params);
    }

	// logging with context
	public function logc($context, ...$params) {
        $this->log_with(0, $context, ...$params);
    }

	// or debugging logging methods (to avoid recursion)
	public function logd(...$params) {
        $this->log_internal(...$params);
    }

	// if '$line_shift' is an array then suppose it contains data from 'get_log_data()'
	public function log_with($line_shift, $context, ...$params) {

		if($this->skip_log()) return;

		$data = is_array($line_shift) ? $line_shift : $this->get_log_data($params, $line_shift, $context);
		$log = PHP_EOL.$data['log_line'].PHP_EOL.str_repeat($this->dline, strlen($data['log_line'])).($data['context'] ?? '');
		foreach($data['args'] as $index => $var) {
			if($var['name'] !== '?') $log .= $this->var_label($index, $var['name']);
			$log .= PHP_EOL.$this->dump_log($var['value']).PHP_EOL;
		}
        $this->file_log($log);
    }

	public function get_log_data($params, $line_shift = 0, $context = null) {
		$data = [];
		$data['trace'] = $this->log_trace($line_shift);
		$data['log_line'] = $this->log_label($data['trace'], static::class);
		$data['context'] = $this->context_label($context);
		$data['args'] = [];
		$args_shift = empty($data['context']) ? 0 : 1;
		foreach($params as $key => $val) {
			$data['args'][$key] = [
				'name'	=> $data['trace']['args'][$key + $args_shift] ?? '?',
				'value'	=> $val,
			];
		}
		return $data;
    }

	public function get_log_label($var, $type = 'context') {
		if($type === 'context') return $this->context_label($var);
		else if($type === 'var') return $this->var_label($var['index'] ?? 0, $var['name'] ?? '?');
		else if($type === 'log') return $this->log_label($var['class'] ?? static::class, $var['trace'] ?? []);
		return '';
	}

	public function log_only($class = null) {
        if($class === false) $this->log_filter = [];
        else if($class === null) $this->log_filter[] = static::class;
        else $this->log_filter[] = $class;
    }

	// this methods can be overridden to change the way of logging
	protected function file_log($log) {
		error_log($log);
	}

	protected function dump_log($log) {
		// use 'var_export' instead of 'print_r' since the latter does not display 'false' values
		// this can be overridden in a child class
		return var_export($log, true);
	}

	protected function logfile_clean() {
		$log_location = ini_get('error_log');
		$handle = fopen($log_location, 'w');
		if($handle !== false) {
			fclose($handle);
			return $log_location;
		}
		return null;
	}

	// Profile methods --------------------------------------------------------]

	protected function pstart($context) {
		do_action('qm/start', $this->get_profile_timer($context));
	}

	protected function plap($context) {
		do_action('qm/lap', $this->get_profile_timer($context));
	}

	protected function pstop($context) {
		do_action('qm/stop', $this->get_profile_timer($context));
	}

	private function get_profile_timer($context) {
		return sprintf('%s [%s]', $context, static::class);
	}

	// private helpers --------------------------------------------------------]

	private function skip_log() {
		return !empty($this->log_filter) && in_array(static::class, $this->log_filter);
	}

	private function log_label($trace, $called_class = null) {
        return sprintf(
            'DEBUG:%6$s IN %5$s%4$s%3$s() [%1$s:%2$s]',
            $trace['file'] ?? '?',
            $trace['line'] ?? '?',
            $trace['func'] ?? '?',
            $trace['type'] ?? '',
            $trace['class'] ?? '',
            empty($called_class) ? '' : sprintf(' {CLASS %1$s}', $called_class),
        );
    }
	// ╔─────────────────────╗
	// │ # # # Context # # # │
	// ╚─────────────────────╝
	private function context_label($context) {
		if(empty($context)) return null;
		$mod = substr($context, 0, 1);
		$mod = in_array($mod, ['!', '?', '*']) ? $mod : '#';
		$context = preg_replace('/^[!|?|*]/', '', $context);
		$context = sprintf('│ %2$s %2$s %2$s %1$s %2$s %2$s %2$s │', $context, $mod);
		$line = str_repeat($this->sline, mb_strlen($context) - 2);
		return PHP_EOL.sprintf('╔%s╗', $line).PHP_EOL.$context.PHP_EOL.sprintf('╚%s╝', $line).PHP_EOL;
    }
	//
	//  [0] $my_var_name
	// └────────────────┘
	private function var_label($index, $vname) {
		$name = sprintf(' %2$s', $index, $vname); // ' [%1$s] %2$s'
		$line = sprintf('└%s┘', str_repeat($this->sline, strlen($name) - 1));
		return PHP_EOL.$name.PHP_EOL.$line;
    }

    private function log_trace($line_shift = 0) {
        $trace = array_map(function($val) {
			unset($val['object']);
			return $val;
		}, debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS));

        // NOTE: to research backtrace structure
        // $this->logd($trace);

        $line = $this->basic_trace_shift + $line_shift;
		$args = $this->call_args($trace[$line]['file'], $trace[$line]['line'], $trace[$line]['function']);

		return [
			'file'	=> explode('wp-content', $trace[$line]['file'])[1] ?? '?',
			'line'	=> $trace[$line]['line'],
			'func'	=> $trace[$line + 1]['function'],
			'type'	=> $trace[$line + 1]['type'] ?? '',
			'class'	=> $trace[$line + 1]['class'] ?? '',
			'args'	=> $args,
		];
    }

	private function call_args($file, $line, $func) {
		$lines = file($file);
		$row = $lines[$line - 1];
		// $this->logd($file);
		// $this->logd($line);
		// $this->logd($row);
		preg_match("/$func\(([^;|\n]+);/m", $row, $matches);
		return array_map('trim', explode(',', preg_replace('/\)$/m', '', $matches[1] ?? '?')));
		// $this->logd($names);
		// return $names;
	}

	// this is debug for debugging - always writes to 'error_log' to avoid confusion
	private function log_internal($info , $val = '$undefined', $use_print_r = false) {
		if($val === '$undefined') {
			$val = $info;
			$info = '';
		}
		$marker = sprintf('[* {%s} internal debugging *]', static::class);
		$value = $use_print_r ? print_r($val, true) : var_export($val, true);
		$log = PHP_EOL.$marker.PHP_EOL.'┌'.str_repeat('~', strlen($marker) - 1).PHP_EOL;
		$log .= sprintf(' %s = %s', $info, preg_replace('/\n$/', '', $value));
		$log .= PHP_EOL.str_repeat('~', strlen($marker)).'┘'.PHP_EOL;
		error_log($log);
	}
}

// last resort - this is debug for debugging without any classes (change 'false' to 'true')
if(false && !function_exists('__log')) {
	function __log($info , $val = '$undefined', $use_print_r = false) {
	    if($val === '$undefined') {
	        $val = $info;
	        $info = '';
	    }
	    $marker = '[* internal debugging *]';
	    $value = $use_print_r ? print_r($val, true) : var_export($val, true);
	    $log = PHP_EOL.$marker.PHP_EOL.'┌'.str_repeat('~', strlen($marker) - 1).PHP_EOL;
	    $log .= sprintf(' %s = %s', $info, preg_replace('/\n$/', '', $value));
	    $log .= PHP_EOL.str_repeat('~', strlen($marker)).'┘'.PHP_EOL;
	    error_log($log);
	}
}
