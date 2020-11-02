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
}
