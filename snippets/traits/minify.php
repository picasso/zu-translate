<?php
trait zusnippets_Minify {

	// Simple JS minifier -----------------------------------------------------]
	// https://gist.github.com/taufik-nurrohman/d7b310dea3b33e4732c0

	public function minify_js($input) {
		if(!is_string($input)) return $input;
		// normalize line–break(s)
		$input = str_replace(["\r\n", "\r"], "\n", trim($input));
	    if(!$input) return $input;

		$output = ''; //  = $prev
	    foreach($this->split_patterns($input) as $part) {
	        if(trim($part) === '') continue;
			// remove comments
	        if(strpos($part, '//') === 0 || strpos($part, '/*') === 0 && substr($part, -2) === '*/') continue;
			// keep regex
	        if($part[0] === '/' && (substr($part, -1) === '/' || preg_match('#\/[gimuy]*$#', $part))) {
	            $output .= $part;
	        } else if(
	            $part[0] === '"' && substr($part, -1) === '"' ||
	            $part[0] === "'" && substr($part, -1) === "'" ||
	            $part[0] === '`' && substr($part, -1) === '`' // ES6
	        ) {
	            // TODO: Remove quote(s) where possible …
	            $output .= $part;
	        } else {
	            $output .= preg_replace([
			        // Remove white–space(s) around punctuation(s) [^1]
			        '#\s*([!%&*\(\)\-=+\[\]\{\}|;:,.<>?\/])\s*#',
			        // Remove the last semi–colon and comma [^2]
			        '#[;,]([\]\}])#',
			        // Replace `true` with `!0` and `false` with `!1` [^3]
			        '#\btrue\b#', '#\bfalse\b#', '#\b(return\s?)\s*\b#',
			        // Replace `new Array(x)` with `[x]` … [^4]
			        '#\b(?:new\s+)?Array\((.*?)\)#', '#\b(?:new\s+)?Object\((.*?)\)#'
			    ], [
			        // [^1]
			        '$1',
			        // [^2]
			        '$1',
			        // [^3]
			        '!0', '!1', '$1',
			        // [^4]
			        '[$1]', '{$1}'
			    ], $part);
	        }
	        // $prev = $part;
	    }
	    return $output;
	}

	private function split_patterns($input) {
		$minify_comment_css = '/\*[\s\S]*?\*/';
		$minify_string = '"(?:[^"\\\]|\\\.)*"|\'(?:[^\'\\\]|\\\.)*\'|`(?:[^`\\\]|\\\.)*`';
		$minify_comment_js = '//[^\n]*';
		$minify_pattern_js = '/[^\n]+?/[gimuy]*';
		$patterns = [$minify_comment_css, $minify_string, $minify_comment_js, $minify_pattern_js];
	    return preg_split('#(' . implode('|', $patterns) . ')#', $input, -1, PREG_SPLIT_NO_EMPTY | PREG_SPLIT_DELIM_CAPTURE);
	}

	// Simple HTML minifier ---------------------------------------------------]
	// https://stackoverflow.com/questions/6225351/how-to-minify-php-page-html-output

	public function minify_html($buffer, $remove_ending_tags = true, $strip_comments = true) {

		//remove redundant (white-space) characters
		$replace = [
		    // remove tabs before and after HTML tags
		    '/\>[^\S ]+/s'   => '>',
		    '/[^\S ]+\</s'   => '<',
		    // shorten multiple whitespace sequences; keep new-line characters because they matter in JS!!!
		    '/([\t ])+/s'  => ' ',
		    // remove leading and trailing spaces
		    '/^([\t ])+/m' => '',
		    '/([\t ])+$/m' => '',
		    //  remove JS line comments (simple only); do NOT remove lines containing URL (e.g. 'src="http://server.com/"')!!!
		    '~//[a-zA-Z0-9 ]+$~m' => '',
		    // remove empty lines (sequence of line-end and white-space characters)
		    '/[\r\n]+([\t ]?[\r\n]+)+/s'  => "\n",
		    // remove empty lines (between HTML tags); cannot remove just any line-end characters because in inline JS they can matter!
		    '/\>[\r\n\t ]+\</s'    => '><',
		    // remove "empty" lines containing only JS's block end character; join with next line (e.g. "}\n}\n</script>" --> "}}</script>"
		    '/}[\r\n\t ]+/s'  => '}',
		    '/}[\r\n\t ]+,[\r\n\t ]+/s'  => '},',
		    // remove new-line after JS's function or condition start; join with next line
		    '/\)[\r\n\t ]?{[\r\n\t ]+/s'  => '){',
		    '/,[\r\n\t ]?{[\r\n\t ]+/s'  => ',{',
		    // remove new-line after JS's line end (only most obvious and safe cases)
		    '/\),[\r\n\t ]+/s'  => '),',
			// remove places where quotes connect with a closing tag to avoid errors in the next step
			'~\"/>~s' => '" />',
		    // remove quotes from HTML attributes that does not contain spaces; keep quotes around URLs!
			// $1 and $4 insert first white-space character found before/after attribute
		    '~([\r\n\t ])?([a-zA-Z0-9]+)="([a-zA-Z0-9_/\\-]+)"([\r\n\t ])?~s' => '$1$2=$3$4',
		];

		$buffer = preg_replace(array_keys($replace), array_values($replace), $buffer);
		//remove optional ending tags (see http://www.w3.org/TR/html5/syntax.html#syntax-tag-omission)
		$remove = array(
		    '</option>', '</li>', '</dt>', '</dd>', '</tr>', '</th>', '</td>'
		);
		$buffer = $remove_ending_tags ? str_ireplace($remove, '', $buffer) : $buffer;
		// strip HTML comments (it strips conditional comments too, be careful!)
		$buffer = $strip_comments ? preg_replace('/(?=<!--)([\s\S]*?)-->/', '', $buffer) : $buffer;

		return $buffer;
	}

	// Simple regex CSS minifier/compressor -----------------------------------]
	// http://stackoverflow.com/questions/15195750/minify-compress-css-with-regex

	public function minify_css($str) {
	    // remove comments first (simplifies the other regex)
$re1 = <<<'EOS'
(?sx)
  # quotes
  (
    "(?:[^"\\]++|\\.)*+"
  | '(?:[^'\\]++|\\.)*+'
 )
|
  # comments
  /\* (?> .*? \*/)
EOS;

$re2 = <<<'EOS'
(?six)
  # quotes
  (
    "(?:[^"\\]++|\\.)*+"
  | '(?:[^'\\]++|\\.)*+'
 )
|
  # ; before } (and the spaces after it while we're here)
  \s*+ ; \s*+ (}) \s*+
|
  # all spaces around meta chars/operators
  \s*+ ([*$~^|]?+= | [{};,>~+-] | !important\b) \s*+
|
  # spaces right of ([ :
  ([[(:]) \s++
|
  # spaces left of) ]
  \s++ ([])])
|
  # spaces left (and right) of :
  \s++ (:) \s*+
  # but not in selectors: not followed by a {
  (?!
    (?>
      [^{}"']++
    | "(?:[^"\\]++|\\.)*+"
    | '(?:[^'\\]++|\\.)*+'
   )*+
    {
 )
|
  # spaces at beginning/end of string
  ^ \s++ | \s++ \z
|
  # double spaces to single
  (\s)\s+
EOS;

	    $str = preg_replace("%$re1%", '$1', $str);
	    return preg_replace("%$re2%", '$1$2$3$4$5$6$7', $str);
	}

	// Get base URL with PHP --------------------------------------------------]
	// https://stackoverflow.com/questions/2820723/how-to-get-base-url-with-php

    public function base_url($at_root = false, $at_core = false, $parse = false) {
        if(isset($_SERVER['HTTP_HOST'])) {
            $http = isset($_SERVER['HTTPS']) && strtolower($_SERVER['HTTPS']) !== 'off' ? 'https' : 'http';
            $hostname = $_SERVER['HTTP_HOST'];
            $dir =  str_replace(basename($_SERVER['SCRIPT_NAME']), '', $_SERVER['SCRIPT_NAME']);

            $core = preg_split('@/@', str_replace($_SERVER['DOCUMENT_ROOT'], '', realpath(dirname(__FILE__))), NULL, PREG_SPLIT_NO_EMPTY);
            $core = $core[0];

            $tmplt = $at_root ? ($at_core ? "%s://%s/%s/" : "%s://%s/") : ($at_core ? "%s://%s/%s/" : "%s://%s%s");
            $end = $at_root ? ($at_core ? $core : $hostname) : ($at_core ? $core : $dir);
            $base_url = sprintf($tmplt, $http, $hostname, $end);
        }
        else $base_url = 'http://localhost/';

        if($parse) {
            $base_url = parse_url($base_url);
            if(isset($base_url['path'])) if($base_url['path'] == '/') $base_url['path'] = '';
        }

        return $base_url;
    }
}
