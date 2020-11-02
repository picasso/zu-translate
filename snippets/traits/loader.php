<?php
trait zusnippets_Loader {

	// Loader  function -------------------------------------------------------]

	public function loader($loader = 0, $duration = 0.6, $classes = 'zu-loader', $opacity = 0.2) {

		$default_loader = 0;
		$loaders = [];

		// $loader = -1 to get all loaders as array
		$getAll = $loader === -1;

		$xmlns = 'http://www.w3.org/2000/svg';

		$classes = $this->merge_classes($classes, false);
		$classes[] = in_array('zu-loader', $classes) ? '' : 'zu-loader';
		$classes = $this->merge_classes($classes);

		$wrapper = $getAll ? '' : sprintf('<div class="%1$s">', $classes);
		$wrapper_closing = $getAll ? '' : '</div>';

		$loaders[] = zu_sprintf(
			'%1$s
			  <svg version="1.1" id="loader-%4$s" data-id="%4$s" xmlns="%3$s" viewBox="0 0 40 40" preserveAspectRatio="xMidYMin slice">
				  <path opacity="%6$s" d="M20.201,5.169c-8.254,0-14.946,6.692-14.946,14.946c0,8.255,6.692,14.946,14.946,14.946
				    s14.946-6.691,14.946-14.946C35.146,11.861,28.455,5.169,20.201,5.169z M20.201,31.749c-6.425,0-11.634-5.208-11.634-11.634
				    c0-6.425,5.209-11.634,11.634-11.634c6.425,0,11.633,5.209,11.633,11.634C31.834,26.541,26.626,31.749,20.201,31.749z"/>
				  <path d="M26.013,10.047l1.654-2.866c-2.198-1.272-4.743-2.012-7.466-2.012h0v3.312h0
				    C22.32,8.481,24.301,9.057,26.013,10.047z">
				    <animateTransform attributeType="xml"
				      attributeName="transform"
				      type="rotate"
				      from="0 20 20"
				      to="360 20 20"
				      dur="%2$ss"
				      repeatCount="indefinite"/>
				    </path>
			  </svg>
			%5$s',
			$wrapper,
			$duration,
			$xmlns,
			count($loaders),
			$wrapper_closing,
			$opacity
		);

		$loaders[] = zu_sprintf(
			'%1$s
			  <svg version="1.1" id="loader-%4$s" data-id="%4$s" xmlns="%3$s" viewBox="0 0 50 50" preserveAspectRatio="xMidYMin slice">
			  <path d="M25.251,6.461c-10.318,0-18.683,8.365-18.683,18.683h4.068c0-8.071,6.543-14.615,14.615-14.615V6.461z">
			    <animateTransform attributeType="xml"
			      attributeName="transform"
			      type="rotate"
			      from="0 25 25"
			      to="360 25 25"
			      dur="%2$ss"
			      repeatCount="indefinite"/>
			    </path>
			  </svg>
			%5$s',
			$wrapper,
			$duration,
			$xmlns,
			count($loaders),
			$wrapper_closing
		);

		$loaders[] = zu_sprintf(
			'%1$s
			  <svg version="1.1" id="loader-%4$s" data-id="%4$s" xmlns="%3$s" viewBox="0 0 50 50" preserveAspectRatio="xMidYMin slice">
			  <path d="M43.935,25.145c0-10.318-8.364-18.683-18.683-18.683c-10.318,0-18.683,8.365-18.683,18.683h4.068c0-8.071,6.543-14.615,14.615-14.615c8.072,0,14.615,6.543,14.615,14.615H43.935z">
			    <animateTransform attributeType="xml"
			      attributeName="transform"
			      type="rotate"
			      from="0 25 25"
			      to="360 25 25"
			      dur="%2$ss"
			      repeatCount="indefinite"/>
			    </path>
			  </svg>
			%5$s',
			$wrapper,
			$duration,
			$xmlns,
			count($loaders),
			$wrapper_closing
		);

		$loaders[] = zu_sprintf(
			'%1$s
			  <svg version="1.1" id="loader-%7$s" data-id="%7$s" xmlns="%6$s" viewBox="0 0 20 30" preserveAspectRatio="xMidYMin slice">
			    <rect x="0" y="10" width="4" height="10" opacity="%5$s">
			      <animate attributeName="opacity" attributeType="XML" values="0.2; 1; .2" begin="0s" dur="%2$ss" repeatCount="indefinite" />
			      <animate attributeName="height" attributeType="XML" values="10; 20; 10" begin="0s" dur="%2$ss" repeatCount="indefinite" />
			      <animate attributeName="y" attributeType="XML" values="10; 5; 10" begin="0s" dur="%2$ss" repeatCount="indefinite" />
			    </rect>
			    <rect x="8" y="10" width="4" height="10"  opacity="%5$s">
			      <animate attributeName="opacity" attributeType="XML" values="0.2; 1; .2" begin="%3$ss" dur="%2$ss" repeatCount="indefinite" />
			      <animate attributeName="height" attributeType="XML" values="10; 20; 10" begin="%3$ss" dur="%2$ss" repeatCount="indefinite" />
			      <animate attributeName="y" attributeType="XML" values="10; 5; 10" begin="%3$ss" dur="%2$ss" repeatCount="indefinite" />
			    </rect>
			    <rect x="16" y="10" width="4" height="10"  opacity="%5$s">
			      <animate attributeName="opacity" attributeType="XML" values="0.2; 1; .2" begin="%4$ss" dur="%2$ss" repeatCount="indefinite" />
			      <animate attributeName="height" attributeType="XML" values="10; 20; 10" begin="%4$ss" dur="%2$ss" repeatCount="indefinite" />
			      <animate attributeName="y" attributeType="XML" values="10; 5; 10" begin="%4$ss" dur="%2$ss" repeatCount="indefinite" />
			    </rect>
			  </svg>
			%8$s',
			$wrapper,
			$duration,
			($duration / 3),
			($duration / 3) * 2,
			$opacity,
			$xmlns,
			count($loaders),
			$wrapper_closing
		);

		$duration_long = $duration * 5;
		$loaders[] = zu_sprintf(
			'%1$s
			  <svg version="1.1" id="loader-%4$s" data-id="%4$s" xmlns="%3$s" viewBox="0 0 55 80" preserveAspectRatio="xMidYMin slice">
					<g transform="matrix(1 0 0 -1 0 80)">
					    <rect width="10" height="20" rx="3">
					        <animate attributeName="height"
					             begin="0s" dur="%2$ss"
					             values="20;45;57;80;64;32;66;45;64;23;66;13;64;56;34;34;2;23;76;79;20" calcMode="linear"
					             repeatCount="indefinite" />
					    </rect>
					    <rect x="15" width="10" height="80" rx="3">
					        <animate attributeName="height"
					             begin="0s" dur="%7$ss"
					             values="80;55;33;5;75;23;73;33;12;14;60;80" calcMode="linear"
					             repeatCount="indefinite" />
					    </rect>
					    <rect x="30" width="10" height="50" rx="3">
					        <animate attributeName="height"
					             begin="0s" dur="%5$ss"
					             values="50;34;78;23;56;23;34;76;80;54;21;50" calcMode="linear"
					             repeatCount="indefinite" />
					    </rect>
					    <rect x="45" width="10" height="30" rx="3">
					        <animate attributeName="height"
					             begin="0s" dur="%6$ss"
					             values="30;45;13;80;56;72;45;76;34;23;67;30" calcMode="linear"
					             repeatCount="indefinite" />
					    </rect>
					</g>
				</svg>
			%8$s',
			$wrapper,
			$duration_long,
			$xmlns,
			count($loaders),
			($duration_long / 3),
			($duration_long / 3) * 2,
			($duration_long / 2),
			$wrapper_closing
		);

		$loaders[] = zu_sprintf(
			'%1$s
			  <svg version="1.1" id="loader-%4$s" data-id="%4$s" xmlns="%3$s" viewBox="0 0 24 30" preserveAspectRatio="xMidYMin slice">
			    <rect x="0" y="0" width="4" height="10">
			      <animateTransform attributeType="xml"
			        attributeName="transform" type="translate"
			        values="0 0; 0 20; 0 0"
			        begin="0" dur="%2$ss" repeatCount="indefinite" />
			    </rect>
			    <rect x="10" y="0" width="4" height="10">
			      <animateTransform attributeType="xml"
			        attributeName="transform" type="translate"
			        values="0 0; 0 20; 0 0"
			        begin="%5$ss" dur="%2$ss" repeatCount="indefinite" />
			    </rect>
			    <rect x="20" y="0" width="4" height="10">
			      <animateTransform attributeType="xml"
			        attributeName="transform" type="translate"
			        values="0 0; 0 20; 0 0"
			        begin="%6$ss" dur="%2$ss" repeatCount="indefinite" />
			    </rect>
			  </svg>
			%7$s',
			$wrapper,
			$duration,
			$xmlns,
			count($loaders),
			($duration / 3),
			($duration / 3) * 2,
			$wrapper_closing
		);

		$loaders[] = zu_sprintf(
			'%1$s
			  <svg version="1.1" id="loader-%4$s" data-id="%4$s" xmlns="%3$s" viewBox="0 0 120 30" preserveAspectRatio="xMidYMin slice">
				    <circle cx="15" cy="15" r="15" fill="currentColor">
				        <animate attributeName="r" from="15" to="15"
				                 begin="0s" dur="%2$ss"
				                 values="15;9;15" calcMode="linear"
				                 repeatCount="indefinite" />
				        <animate attributeName="fill-opacity" from="%8$s" to="%8$s"
				                 begin="0s" dur="%2$ss"
				                 values="1;.5;1" calcMode="linear"
				                 repeatCount="indefinite" />
				    </circle>
				    <circle cx="60" cy="15" r="9" fill="currentColor">
				        <animate attributeName="r" from="9" to="9"
				                 begin="0s" dur="%2$ss"
				                 values="9;15;9" calcMode="linear"
				                 repeatCount="indefinite" />
				        <animate attributeName="fill-opacity" from="%6$" to="%6$"
				                 begin="0s" dur="%2$ss"
				                 values=".5;1;.5" calcMode="linear"
				                 repeatCount="indefinite" />
				    </circle>
				    <circle cx="105" cy="15" r="15" fill="currentColor">
				        <animate attributeName="r" from="15" to="15"
				                 begin="0s" dur="%2$ss"
				                 values="15;9;15" calcMode="linear"
				                 repeatCount="indefinite" />
				        <animate attributeName="fill-opacity" from="%8$s" to="%8$s"
				                 begin="0s" dur="%2$ss"
				                 values="1;.5;1" calcMode="linear"
				                 repeatCount="indefinite" />
				    </circle>
				</svg>
			%7$s',
			$wrapper,
			$duration,
			$xmlns,
			count($loaders),
			$opacity,
			($opacity * 3) > 1 ? 1 : ($opacity * 3),
			$wrapper_closing,
			$opacity,
		);

		if($getAll) return $loaders;

		$loader = ($loader < 0 || $loader > count($loaders)) ? $default_loader :  $loader;

		return $loaders[$loader];
	}
}
