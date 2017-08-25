jQuery(document).ready( /* global qTranslateConfig */
function($){
	
	var qtx_seo_enabled = $('body').hasClass('qtx-seo-enabled') ? true : false;
	var qtx = qTranslateConfig.js.get_qtx();
	var template_marker = '$@$';

	function updateTitle() {
		
			$('.column-title.page-title').each(function() {
				var $this = $(this), template = String($this.data('template'));
				var title = $this.find('.hidden .post_title').text();
				$this.find('a.row-title').text(template.replace(template_marker, title));
			});
	}
	
	function setupTitle() {
		$('.column-title.page-title').each(function() {
			var $this = $(this);
			var old_title = $this.find('a.row-title').text();
			var new_title = $this.find('.hidden .post_title').text();
			$this.data('template', old_title.replace(new_title, template_marker));
		});
		updateTitle(qTranslateConfig.activeLanguage);
	}	

	function updateScore() {
		
		if(!qtx_seo_enabled) return;
		
		var titles = { 'na' : 'Focus keyword not set', 'ok' : 'Ok', 'bad': 'Bad', 'good' : 'Good', 'empty' : 'Not updated'};
		
		$('.wp-list-table #the-list tr').each(function() {
			
			var $this = $(this);
			var $wpseo_score = $this.find('.column-wpseo-score');
			var $wpseo_readability = $this.find('.column-wpseo-score-readability');
			var real_score = $this.find('.column-qtx_seo .qtx_seo_score').text();
			var real_readability = $this.find('.column-qtx_seo .qtx_seo_content_score').text();
			
			real_score = (($.trim(real_score) === '') || (typeof(titles[real_score]) === 'undefined')) ? 'empty' : real_score;
			real_readability = (($.trim(real_readability) === '') || (typeof(titles[real_readability]) === 'undefined')) ? 'empty' : real_readability;
			
			var real_score_title = (typeof(titles[real_score]) !== 'undefined') ?  titles[real_score] : '';
			var real_readability_title = (typeof(titles[real_readability]) !== 'undefined') ?  titles[real_readability] : '';
			
			$wpseo_score.find('.wpseo-score-icon').attr({'class' : 'wpseo-score-icon '+real_score, 'title' : real_score_title});
			$wpseo_score.find('.screen-reader-text').text(real_score_title);
			
			$wpseo_readability.find('.wpseo-score-icon').attr({'class' : 'wpseo-score-icon '+real_readability, 'title' : real_readability_title});
			$wpseo_readability.find('.screen-reader-text').text(real_readability_title);
		});
	}
	
	setupTitle();
	updateScore(); 

	qtx.addLanguageSwitchAfterListener(
		function(lang) {
			updateTitle(lang);
			updateScore(); 
		}
	);
});