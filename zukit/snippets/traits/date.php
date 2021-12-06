<?php
trait zusnippets_Date {

	// Date conversion functions --------------------------------------------------]

	public function localizedMonths() {

		$names = array();
		for($i = 1; $i <= 12; $i++) {
		    $names[] = date_i18n('F', mktime(0, 0, 0, $i, 1, 1970));
		}
		return $names;
	}

	public function dateToEnglish($date) {
	    $month = [
		    "январь"	=> "january",
		    "февраль"	=> "february",
		    "март"		=> "march",
		    "апрель"	=> "april",
		    "май"		=> "may",
		    "июнь"		=> "june",
		    "июль"		=> "july",
		    "август"	=> "august",
		    "сентябрь"	=> "september",
		    "октябрь"	=> "october",
		    "ноябрь"	=> "november",
		    "декабрь"	=> "december"
		];
	    return str_replace(array_keys($month), $month, mb_convert_case($date, MB_CASE_LOWER, 'UTF-8'));
	}

	public function dateToRussian($date) {
	    $month = [
		    "january"	=> "января",
		    "february"	=> "февраля",
		    "march"		=> "марта",
		    "april"		=> "апреля",
		    "may"		=> "мая",
		    "june"		=> "июня",
		    "july"		=> "июля",
		    "august"	=> "августа",
		    "september"	=> "сентября",
		    "october"	=> "октября",
		    "november"	=> "ноября",
		    "december"	=> "декабря"
		];
	    return str_replace(array_keys($month), $month, mb_convert_case($date, MB_CASE_LOWER, 'UTF-8'));
	}

	public function daysRU($date) {
		$locale = substr(get_locale(), 0, 2);
		if($locale === 'ru') {
			return $this->dateToRussian($date);
		} else {
			return $date;
		}
	}

	public function eng_strtotime($date) {
		$date = $this->dateToEnglish($date);
		return strtotime($date);
	}

	public function date_i18n($date, $with_year = true, $without_day = false) {

		$locale = substr(get_locale(), 0, 2);
		$format = $with_year ? ['ru' => 'j F, Y', 'en' => '%B %e, %G', 'it' => '%e %B, %G'] : ['ru' => 'j F', 'en' => '%B %e', 'it' => '%e %B'];
		$format = $without_day ? ['ru' => 'F, Y', 'en' => '%B, %G', 'it' => '%B, %G'] : $format;

		if($locale === 'ru') {
			return $this->dateToRussian(date($format['ru'], $this->eng_strtotime($date)));
		} else {
			if(!isset($format[$locale])) $locale = 'en';
			return strftime($format[$locale], strtotime($date)); //date_i18n($format[$locale], strtotime($date));
		}
	}

	// Calculate the time difference
	// Based on BuddyPress function `bp_core_time_since()`, which in turn is based on functions created by
	// Dunstan Orchard - http://1976design.com
	//
	// This function will return an text representation of the time elapsed since a
	// given date, giving the two largest units e.g.:
	//
	//  - 2 hours and 50 minutes
	//  - 4 days
	//  - 4 weeks and 6 days
	//
	// if $fallback is nonzero then outputs its value if the difference exceeds $fallback_break in months
	public function human_time_diff($older_timestamp, $newer_timestamp = false, $rel_depth = 2, $fallback = null, $fallback_break = 3) {
	   if(!is_int($older_timestamp)) return '';
	   // if no newer date is given, assume now
	   $newer_timestamp = $newer_timestamp ?: current_time('timestamp');
	   // difference in seconds
	   $since = absint($newer_timestamp - $older_timestamp);

	   if(!$since) return '0 ' . _x('seconds', 'time difference', 'zu');

	   // if the difference exceeds $fallback_break in months: 60 * 60 * 24 * 30
	   if($fallback && $since > 2592000) return $fallback;

	   // hold units of time in seconds, and their pluralised strings (not translated yet)
	   $units = [
		   /* translators: %s: Number of year(s). */
		   [ 31536000, _nx_noop('%s year', '%s years', 'time difference', 'zu') ],  // 60 * 60 * 24 * 365
		   /* translators: %s: Number of month(s). */
		   [ 2592000, _nx_noop('%s month', '%s months', 'time difference', 'zu') ], // 60 * 60 * 24 * 30
		   /* translators: %s: Number of week(s). */
		   [ 604800, _nx_noop('%s week', '%s weeks', 'time difference', 'zu') ],    // 60 * 60 * 24 * 7
		   /* translators: %s: Number of day(s). */
		   [ 86400, _nx_noop('%s day', '%s days', 'time difference', 'zu') ],       // 60 * 60 * 24
		   /* translators: %s: Number of hour(s). */
		   [ 3600, _nx_noop('%s hour', '%s hours', 'time difference', 'zu') ],      // 60 * 60
		   /* translators: %s: Number of minute(s). */
		   [ 60, _nx_noop('%s minute', '%s minutes', 'time difference', 'zu') ],
		   /* translators: %s: Number of second(s). */
		   [ 1, _nx_noop('%s second', '%s seconds', 'time difference', 'zu') ],
	   ];

	   // build output with as many units as specified in $rel_depth
	   $rel_depth = (int) $rel_depth ?: 2;

	   $i = 0;
	   $counted_seconds = 0;
	   $date_partials = [];
	   $amount_date_partials = 0;
	   $amount_units = count($units);

	   while($amount_date_partials < $rel_depth && $i < $amount_units) {
		   $seconds = $units[ $i ][0];
		   $count = (int) floor(($since - $counted_seconds) / $seconds);
		   if(0 !== $count) {
			   $date_partials[] = sprintf(translate_nooped_plural($units[$i][1], $count, 'zu'), $count);
			   $counted_seconds += $count * $seconds;
			   $amount_date_partials = count($date_partials);
		   }
		   $i++;
	   }

	   if(empty($date_partials)) {
		   $output = '';
	   } elseif(count($date_partials) === 1) {
		   $output = $date_partials[0];
	   } else {
		   // combine all but last partial using commas
		   $output = implode(', ', array_slice($date_partials, 0, -1));
		   // add 'and' separator
		   $output .= ' ' . _x('and', 'separator in time difference', 'zu') . ' ';
		   // add last partial
		   $output .= end($date_partials);
	   }
	   return $output;
	}
}
