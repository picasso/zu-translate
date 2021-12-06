<?php
trait zusnippets_Loader {

	// SVG loaders ------------------------------------------------------------]

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

		// index 0
		$loaders[] = zu_sprintf(
			'%1$s
				<svg version="1.1" id="loader-%4$s" data-id="%4$s" xmlns="%3$s" viewBox="5 5 30 30" preserveAspectRatio="xMidYMin slice">
					<g fill="currentColor">
						<path opacity="%6$s" d="M20.201,5.169c-8.254,0-14.946,6.692-14.946,14.946c0,8.255,6.692,14.946,14.946,14.946s14.946-6.691,
							14.946-14.946C35.146,11.861,28.455,5.169,20.201,5.169z M20.201,31.749c-6.425,0-11.634-5.208-11.634-11.634c0-6.425,5.209-11.634,
							11.634-11.634c6.425,0,11.633,5.209,11.633,11.634C31.834,26.541,26.626,31.749,20.201,31.749z"/>
						<path d="M26.013,10.047l1.654-2.866c-2.198-1.272-4.743-2.012-7.466-2.012h0v3.312h0C22.32,8.481,24.301,9.057,26.013,10.047z">
							<animateTransform attributeType="xml"
								attributeName="transform"
								type="rotate"
								from="0 20 20"
								to="360 20 20"
								dur="%2$ss"
								repeatCount="indefinite"
							/>
					    </path>
					</g>
			  </svg>
			%5$s',
			$wrapper,
			$duration,
			$xmlns,
			count($loaders),
			$wrapper_closing,
			$opacity
		);

		// index 1
		$loaders[] = zu_sprintf(
			'%1$s
				<svg version="1.1" id="loader-%4$s" data-id="%4$s" xmlns="%3$s" viewBox="7 7 50 50" preserveAspectRatio="xMidYMin slice">
					<g stroke-width="4" stroke-linecap="round" stroke="currentColor">
					    <line y1="12" y2="20" transform="translate(32,32) rotate(180)">
					        <animate attributeName="stroke-opacity" dur="%2$ss" values="1;.85;.7;.65;.55;.45;.35;.25;.15;.1;0;1" repeatCount="indefinite"/>
					    </line>
					    <line y1="12" y2="20" transform="translate(32,32) rotate(210)">
					        <animate attributeName="stroke-opacity" dur="%2$ss" values="0;1;.85;.7;.65;.55;.45;.35;.25;.15;.1;0" repeatCount="indefinite"/>
					    </line>
					    <line y1="12" y2="20" transform="translate(32,32) rotate(240)">
					        <animate attributeName="stroke-opacity" dur="%2$ss" values=".1;0;1;.85;.7;.65;.55;.45;.35;.25;.15;.1" repeatCount="indefinite"/>
					    </line>
					    <line y1="12" y2="20" transform="translate(32,32) rotate(270)">
					        <animate attributeName="stroke-opacity" dur="%2$ss" values=".15;.1;0;1;.85;.7;.65;.55;.45;.35;.25;.15" repeatCount="indefinite"/>
					    </line>
					    <line y1="12" y2="20" transform="translate(32,32) rotate(300)">
					        <animate attributeName="stroke-opacity" dur="%2$ss" values=".25;.15;.1;0;1;.85;.7;.65;.55;.45;.35;.25" repeatCount="indefinite"/>
					    </line>
					    <line y1="12" y2="20" transform="translate(32,32) rotate(330)">
					        <animate attributeName="stroke-opacity" dur="%2$ss" values=".35;.25;.15;.1;0;1;.85;.7;.65;.55;.45;.35" repeatCount="indefinite"/>
					    </line>
					    <line y1="12" y2="20" transform="translate(32,32) rotate(0)">
					        <animate attributeName="stroke-opacity" dur="%2$ss" values=".45;.35;.25;.15;.1;0;1;.85;.7;.65;.55;.45" repeatCount="indefinite"/>
					    </line>
					    <line y1="12" y2="20" transform="translate(32,32) rotate(30)">
					        <animate attributeName="stroke-opacity" dur="%2$ss" values=".55;.45;.35;.25;.15;.1;0;1;.85;.7;.65;.55" repeatCount="indefinite"/>
					    </line>
					    <line y1="12" y2="20" transform="translate(32,32) rotate(60)">
					        <animate attributeName="stroke-opacity" dur="%2$ss" values=".65;.55;.45;.35;.25;.15;.1;0;1;.85;.7;.65" repeatCount="indefinite"/>
					    </line>
					    <line y1="12" y2="20" transform="translate(32,32) rotate(90)">
					        <animate attributeName="stroke-opacity" dur="%2$ss" values=".7;.65;.55;.45;.35;.25;.15;.1;0;1;.85;.7" repeatCount="indefinite"/>
					    </line>
					    <line y1="12" y2="20" transform="translate(32,32) rotate(120)">
					        <animate attributeName="stroke-opacity" dur="%2$ss" values=".85;.7;.65;.55;.45;.35;.25;.15;.1;0;1;.85" repeatCount="indefinite"/>
					    </line>
					    <line y1="12" y2="20" transform="translate(32,32) rotate(150)">
					        <animate attributeName="stroke-opacity" dur="%2$ss" values="1;.85;.7;.65;.55;.45;.35;.25;.15;.1;0;1" repeatCount="indefinite"/>
					    </line>
					</g>
				</svg>
			%5$s',
			$wrapper,
			$duration * 1.5,
			$xmlns,
			count($loaders),
			$wrapper_closing
		);

		// index 2
		$loaders[] = zu_sprintf(
			'%1$s
			  <svg version="1.1" id="loader-%4$s" data-id="%4$s" xmlns="%3$s" viewBox="0 0 44 44" preserveAspectRatio="xMidYMin slice">
			      <g fill="none" fill-rule="evenodd"  stroke="currentColor" stroke-width="2">
			          <circle cx="22" cy="22" r="1">
			              <animate attributeName="r"
			                  begin="0s" dur="%2$ss"
			                  values="1; 20"
			                  calcMode="spline"
			                  keyTimes="0; 1"
			                  keySplines="0.165, 0.84, 0.44, 1"
			                  repeatCount="indefinite"
						  />
			              <animate attributeName="stroke-opacity"
			                  begin="0s" dur="%2$ss"
			                  values="1; 0"
			                  calcMode="spline"
			                  keyTimes="0; 1"
			                  keySplines="0.3, 0.61, 0.355, 1"
			                  repeatCount="indefinite"
						  />
			          </circle>
			          <circle cx="22" cy="22" r="1">
			              <animate attributeName="r"
			                  begin="-%5$ss" dur="%2$ss"
			                  values="1; 20"
			                  calcMode="spline"
			                  keyTimes="0; 1"
			                  keySplines="0.165, 0.84, 0.44, 1"
			                  repeatCount="indefinite"
						  />
			              <animate attributeName="stroke-opacity"
			                  begin="-%5$ss" dur="%2$ss"
			                  values="1; 0"
			                  calcMode="spline"
			                  keyTimes="0; 1"
			                  keySplines="0.3, 0.61, 0.355, 1"
			                  repeatCount="indefinite"
						  />
			          </circle>
			      </g>
			  </svg>
			%6$s',
			$wrapper,
			$duration * 3,
			$xmlns,
			count($loaders),
			$duration * 1.5,
			$wrapper_closing
		);

		// index 3
		$loaders[] = zu_sprintf(
			'%1$s
				<svg version="1.1" id="loader-%5$s" data-id="%5$s" xmlns="%4$s" viewBox="0 0 100 100" preserveAspectRatio="xMidYMin slice">
					<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-miterlimit="10">
						<circle stroke-width="8" cx="50" cy="50" r="45" opacity="0.5"/>
						<line stroke-width="4" x1="50" y1="50" x2="80" y2="50.5">
							<animateTransform
								attributeName="transform"
								dur="%2$ss"
								type="rotate"
								from="0 50 50"
								to="360 50 50"
								repeatCount="indefinite"
							/>
						</line>
						<line stroke-width="4" x1="50" y1="50" x2="49.5" y2="69">
							<animateTransform
								attributeName="transform"
								dur="%3$ss"
								type="rotate"
								from="0 50 50"
								to="360 50 50"
								repeatCount="indefinite"
							/>
						</line>
					</g>
			  </svg>
			%6$s',
			$wrapper,
			$duration * 2,
			$duration * 2 * 3,
			$xmlns,
			count($loaders),
			$wrapper_closing
		);

		// index 4
		$loaders[] = zu_sprintf(
			'%1$s
				<svg version="1.1" id="loader-%4$s" data-id="%4$s" xmlns="%3$s" viewBox="0 0 100 100" preserveAspectRatio="xMidYMin slice">
					<g fill="currentColor">
						<path d="M31.6,3.5C5.9,13.6-6.6,42.7,3.5,68.4c10.1,25.7,39.2,38.3,64.9,28.1l-3.1-7.9c-21.3,
							8.4-45.4-2-53.8-23.3c-8.4-21.3,2-45.4,23.3-53.8L31.6,3.5z">
					        <animateTransform
					           attributeName="transform"
					           attributeType="XML"
					           type="rotate"
					           dur="%5$ss"
					           from="0 50 50" to="360 50 50"
					           repeatCount="indefinite"
						   />
						</path>
						<path d="M42.3,39.6c5.7-4.3,13.9-3.1,18.1,2.7c4.3,5.7,3.1,13.9-2.7,18.1l4.1,5.5c8.8-6.5,10.6-19,
							4.1-27.7c-6.5-8.8-19-10.6-27.7-4.1L42.3,39.6z">
					        <animateTransform
					           attributeName="transform"
					           attributeType="XML"
					           type="rotate"
					           dur="%2$ss"
					           from="0 50 50" to="-360 50 50"
					           repeatCount="indefinite"
							/>
						</path>
						<path d="M82,35.7C74.1,18,53.4,10.1,35.7,18S10.1,46.6,18,64.3l7.6-3.4c-6-13.5,0-29.3,13.5-35.3s29.3,
							0,35.3,13.5L82,35.7z" opacity="%6$s">
					        <animateTransform
					           attributeName="transform"
					           attributeType="XML"
					           type="rotate"
					           dur="%5$ss"
					           from="0 50 50" to="360 50 50"
					           repeatCount="indefinite"
						   />
						</path>
					</g>
				</svg>
			%7$s',
			$wrapper,
			$duration,
			$xmlns,
			count($loaders),
			$duration * 2,
			$opacity,
			$wrapper_closing
		);

		// index 5
		$duration_long = $duration * 5;
		$loaders[] = zu_sprintf(
			'%1$s
			  <svg version="1.1" id="loader-%4$s" data-id="%4$s" xmlns="%3$s" viewBox="0 0 55 55" preserveAspectRatio="xMidYMin slice">
					<g transform="matrix(1 0 0 -1 0 55)" fill="currentColor">
					    <rect width="10" height="14" rx="3">
					        <animate attributeName="height"
					             begin="0s" dur="%2$ss"
					             values="14;31;39;55;44;22;45;31;44;16;45;9;44;39;23;23;1;16;52;54;14" calcMode="linear"
					             repeatCount="indefinite"
							 />
					    </rect>
					    <rect x="15" width="10" height="55" rx="3">
					        <animate attributeName="height"
					             begin="0s" dur="%7$ss"
					             values="55;38;23;3;52;16;50;23;8;10;41;55" calcMode="linear"
					             repeatCount="indefinite"
							 />
					    </rect>
					    <rect x="30" width="10" height="34" rx="3">
					        <animate attributeName="height"
					             begin="0s" dur="%5$ss"
					             values="34;23;54;16;39;16;23;52;55;37;14;34" calcMode="linear"
					             repeatCount="indefinite"
							 />
					    </rect>
					    <rect x="45" width="10" height="21" rx="3">
					        <animate attributeName="height"
					             begin="0s" dur="%6$ss"
					             values="21;31;9;55;39;50;31;52;23;16;46;21" calcMode="linear"
					             repeatCount="indefinite"
							 />
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

		// index 6
		$loaders[] = zu_sprintf(
			'%1$s
				<svg version="1.1" id="loader-%4$s" data-id="%4$s" xmlns="%3$s" viewBox="0 0 120 30" preserveAspectRatio="xMidYMin slice">
					<g fill="currentColor">
					    <circle cx="15" cy="15" r="15">
					        <animate
								attributeName="r"
								from="15" to="15"
				                begin="0s" dur="%2$ss"
				                values="15;9;15" calcMode="linear"
								repeatCount="indefinite"
							 />
					        <animate
								attributeName="fill-opacity"
								from="%8$s" to="%8$s"
					            begin="0s" dur="%2$ss"
					            values="1;.5;1" calcMode="linear"
					            repeatCount="indefinite"
							/>
					    </circle>
					    <circle cx="60" cy="15" r="9">
					        <animate attributeName="r" from="9" to="9"
								begin="0s" dur="%2$ss"
								values="9;15;9" calcMode="linear"
								repeatCount="indefinite"
							 />
					        <animate attributeName="fill-opacity" from="%6$" to="%6$"
								begin="0s" dur="%2$ss"
								values=".5;1;.5" calcMode="linear"
								repeatCount="indefinite"
							/>
					    </circle>
					    <circle cx="105" cy="15" r="15">
					        <animate attributeName="r" from="15" to="15"
								begin="0s" dur="%2$ss"
								values="15;9;15" calcMode="linear"
								repeatCount="indefinite"
							/>
					        <animate attributeName="fill-opacity" from="%8$s" to="%8$s"
								begin="0s" dur="%2$ss"
								values="1;.5;1" calcMode="linear"
								repeatCount="indefinite"
							 />
					    </circle>
					</g>
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

		// index 7
		$loaders[] = zu_sprintf(
			'%1$s
				<svg version="1.1" id="loader-%4$s" data-id="%4$s" xmlns="%3$s" viewBox="0 0 64 64" preserveAspectRatio="xMidYMin slice">
				    <g stroke-width="0" fill="currentColor">
				        <circle cx="24" cy="0" transform="translate(32,32)">
				            <animate attributeName="r" dur="%2$ss" values="8;7;6;5;4;3;2;1;8" repeatCount="indefinite"></animate>
				        </circle>
				        <circle cx="16.970562748477143" cy="16.97056274847714" transform="translate(32,32)">
				            <animate attributeName="r" dur="%2$ss" values="1;8;7;6;5;4;3;2;1" repeatCount="indefinite"></animate>
				        </circle>
				        <circle cx="1.4695761589768238e-15" cy="24" transform="translate(32,32)">
				            <animate attributeName="r" dur="%2$ss" values="2;1;8;7;6;5;4;3;2" repeatCount="indefinite"></animate>
				        </circle>
				        <circle cx="-16.97056274847714" cy="16.970562748477143" transform="translate(32,32)">
				            <animate attributeName="r" dur="%2$ss" values="3;2;1;8;7;6;5;4;3" repeatCount="indefinite"></animate>
				        </circle>
				        <circle cx="-24" cy="2.9391523179536475e-15" transform="translate(32,32)">
				            <animate attributeName="r" dur="%2$ss" values="4;3;2;1;8;7;6;5;4" repeatCount="indefinite"></animate>
				        </circle>
				        <circle cx="-16.970562748477143" cy="-16.97056274847714" transform="translate(32,32)">
				            <animate attributeName="r" dur="%2$ss" values="5;4;3;2;1;8;7;6;5" repeatCount="indefinite"></animate>
				        </circle>
				        <circle cx="-4.408728476930472e-15" cy="-24" transform="translate(32,32)">
				            <animate attributeName="r" dur="%2$ss" values="6;5;4;3;2;1;8;7;6" repeatCount="indefinite"></animate>
				        </circle>
				        <circle cx="16.97056274847714" cy="-16.970562748477143" transform="translate(32,32)">
				            <animate attributeName="r" dur="%2$ss" values="7;6;5;4;3;2;1;8;7" repeatCount="indefinite"></animate>
				        </circle>
				    </g>
				</svg>
			%5$s',
			$wrapper,
			$duration,
			$xmlns,
			count($loaders),
			$wrapper_closing
		);

		if($getAll) return $loaders;

		$loader = ($loader < 0 || $loader > count($loaders)) ? $default_loader :  $loader;

		return $loaders[$loader];
	}
}
