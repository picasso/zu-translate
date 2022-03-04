<?php
include_once('traits/arrays.php');
include_once('traits/classes.php');
include_once('traits/content.php');
include_once('traits/curve.php');
include_once('traits/date.php');
include_once('traits/extend.php');
include_once('traits/featured.php');
include_once('traits/inline.php');
include_once('traits/loader.php');
include_once('traits/minify.php');
include_once('traits/slugs.php');
include_once('traits/thumbnails.php');
include_once('traits/useful.php');

class zukit_Snippets extends zukit_SingletonLogging {

	use zusnippets_Arrays,
		zusnippets_Classes,
		zusnippets_Content,
		zusnippets_Curve,
		zusnippets_Date,
		zusnippets_Extend,
		zusnippets_Featured,
		zusnippets_Inline,
		zusnippets_Loader,
		zusnippets_Minify,
		zusnippets_Slugs,
		zusnippets_Thumbnails,
		zusnippets_Useful;

	protected function construct_more() {
		$this->prefix = 'zu_snippets';
        $this->version = '1.4.1';
		$this->init_inline_style_scripts();
	}
}

// Common Interface to helpers ------------------------------------------------]

if(!function_exists('zu_snippets')) {
	function zu_snippets() {
		return zukit_Snippets::instance();
	}
}

// A special version of the 'sprintf' function that removes the extra spaces
// from the format string resulting from the 'human-readable' HTML template

if(!function_exists('zu_sprintf')) {
	function zu_sprintf($format, ...$params) {
		// remove HTML comments first
		$format = preg_replace('/<!--[^>]*?>/m', '', $format);
		// remove empty space before and after format
		$format = preg_replace('/^\s+</', '<', $format);
		$format = preg_replace('/>\s+$/', '>', $format);
		// remove empty space between tags
		$format = preg_replace('/>\s+</', '><', $format);
		// remove empty space after format directive and before opening tag
		$format = preg_replace('/\$s\s+</', '$s<', $format);
		// remove empty space after closing tag and before format directive
		$format = preg_replace('/>\s+\%/', '>%', $format);
		// remove new line between format directive
		// keep this: '%1$s %2$s' and flatten this:
		// %1$s
		// %2$s
		// that is, if the format directives are divided by spaces - it is intentionally,
		// and if they are simply located on different rows - then  it's just resulting from the 'human-readable' template
		$format = preg_replace('/\$s\n\s+\%/', '$s %', $format);

		array_unshift($params, $format);
		$output = call_user_func_array('sprintf', $params);

		// remove multiple space inside tags
		if(preg_match_all('/(<[^>]*?>)/', $output, $matches)) {
			  foreach($matches[1] as $tag) {
				  $tag_compressed = preg_replace('/\s+/', ' ', $tag);
				  $tag_compressed = preg_replace('/\s+>/', '>', $tag_compressed);
				  $tag_compressed = preg_replace('/\s+\/>/', '/>', $tag_compressed);
				  // add a space before the closing tag if there are no quotes or no space
				  $tag_compressed = preg_replace('/([^\s|\"])\/>/', '$1 />', $tag_compressed);
				  $output = str_replace($tag, $tag_compressed, $output);
			  }
		  }
		  // replace an intentional 'whitespace' with a space
		  return str_replace(['<whitespace/>', '<whitespace>'], ' ', $output);
	}

	function zu_printf(...$params) {
		$output = call_user_func_array('zu_sprintf', $params);
		print($output);
	}

	function println($output = '') {
		print($output . "\n");
	}

	function zu_printfln(...$params) {
		$output = call_user_func_array('zu_sprintf', $params);
		println($output);
	}
}

if(!function_exists('_zu_log')) {
    function _zu_log(...$params) {
		zu_snippets()->log_with(0, null, ...$params);
    }
	function _zu_logc($context, ...$params) {
		zu_snippets()->log_with(0, $context, ...$params);
    }
	function _zu_logd($info, $var) {
		zu_snippets()->logd($info, $var);
	}
}
