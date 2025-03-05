jQuery(document).ready(function($) {
    var paged       = 1;
	var offset 		= 0;
    var has_filter  = false;
    var keyword     = '';
    var view_type   = '';
    var current_filter = '';
    var dates       = [];
    var genres      = [];
    var series      = [];
	
	var loaded_dates = [];
    

    var typingTimer;
    var doneTypingInterval = 2000;
    var $keyword_input = $('#keyword');

    if (ct_ajax.default_genre !== 'all') {
        genres = ct_ajax.default_genre.split(':');
    }

    if (ct_ajax.default_series !== 'all') {
        series = ct_ajax.default_series.split(':');
    }
    
    var isloading = false;
    var isContentLoaded = false;
    var nomore = false;
	
    
    
    function do_filter() {
        if(isloading) return;
        if(nomore) return;
        
        isloading = true;
        $('.results-loader').addClass('loading');
        $('.more-result-loading').show();
        
        $('.no-results').hide();
        
        view_type = $('#view-type a.active').attr('href');
    	view_type = view_type.slice(1);

        keyword = $keyword_input.val();
        dates = $('#selected-dates').val();

        display_selection();

        refresh_calendar();
        
        $.ajax({
            url : ct_ajax.ajaxurl,
            type: 'post',
            data: {
                action      : 'now_showing_query',
                paged       : paged,
                view_type   : view_type,
                keyword     : keyword,
                dates       : dates,
                genres      : genres,
                series      : series,
				loaded_dates: loaded_dates,
				dates_per_page: ct_ajax.dates_per_page,
				page_id 	: ct_ajax.page_id
            }
        }).then(function(response) {
            
            var postsCount = parseInt(response.posts_count);
			
			loaded_dates = response.loaded_dates;
            
            if (paged === 1 && offset === 0){
                $('.ct-results').html( response.posts );
            }else{
                $('.ct-results').append( response.posts );      
            }
			
			$('.ct-results').attr('data-view', view_type);
			
            if (postsCount === 0 || Number.isNaN(postsCount)){
                var no_results_msg = 'There are no movie listings at this time.';
                if(current_filter === 'date'){
                    no_results_msg = 'No screenings yet scheduled.';
                }
                nomore = true;
				
				
            }
            
            if (postsCount === 0 && !nomore){
                $('.no-results').html(no_results_msg).show();
            }
            
            //remove extra times
            $('.ct-results[data-view=date-view] .item[data-date]').each(function() {
                var parentDiv = $(this);
                var parentDataId = parentDiv.attr('data-date');

                parentDiv.find('span[data-date]').each(function() {
                    if ($(this).attr('data-date') !== parentDataId) {
                        $(this).remove();
                    }
                });
            });
            
            
            $('.results-loader').removeClass('loading');
            $('.more-result-loading').hide();
            
            $('.item div[data-date]').each(function() {
                var parentDate = $(this).data('date');
                $(this).find('.showtimes-lists span[data-date]').each(function() {
                    if ($(this).data('date') !== parentDate) {
                        $(this).hide();
                    }
                });
            });
            
			
            isloading = false;
            
            isContentLoaded = true;
        });
    }

    function refresh_calendar() {
        setTimeout(function() {
            var event = new CustomEvent("DOMContentLoaded");
            document.dispatchEvent(event);
            console.log('Loading events...');
        }, 500);
    }
    
	
	//Start Video Light Box
	var newVideoURL = '';
	$(document).on('click', '.button-watch-trailer', function(e) {
		e.preventDefault();
		newVideoURL = $(this).attr('vid_id');
		//newVideoURL = getYouTubeVideoID(newVideoURL);   
		newVideoURL = "https://www.youtube.com/embed/" + newVideoURL;           
		elementorProFrontend.modules.popup.showPopup({
			id: 4426 
		});            
		return false;
	});

	$(document).on('elementor/popup/show', function(event, id, instance) {
		if (id === 4426) {
			$('#trailer-iframe').attr('src', newVideoURL);
		}
	});
	//End Video Light Box
    
    
    // Debounce function to limit the rate of execution
    function debounce(func, wait) {
        var timeout;
        return function() {
            var context = this, args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(function() {
                func.apply(context, args);
            }, wait);
        };
    }
    
    $(window).on('scroll resize', debounce(function() {
        //if(nomore) return;
        if (isloading) return;
		
		
        
        var $element = $('.ct-results');
        var elementBottom = $element.offset().top + $element.outerHeight();
        var viewportBottom = $(window).scrollTop() + $(window).height() - 200;

        if (elementBottom <= viewportBottom) {
            //$('.more-result-loading').show();
			
			if(view_type == 'all-view'){
            	paged += 1;
			}else{
				offset += parseInt(ct_ajax.dates_per_page);
			}
            do_filter();
        }
    }, 100));


    

    function getYouTubeVideoID(url) {
        var videoID = null;
        var regexPatterns = [
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
            /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]+)/,
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]+)/,
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/.+[?&]v=([a-zA-Z0-9_-]+)/
        ];
        
        regexPatterns.some(function(pattern) {
            var match = url.match(pattern);
            if (match && match[1]) {
                videoID = match[1];
                return true; // Break out of the loop
            }
            return false;
        });
        
        return videoID;
    }
    
    $('#view-type a[href="#date-view"]').addClass('active');
    $('.ct-results').attr('data-view', 'date-view');
    
    $(document).on('click', '#view-type a[href="#calendar-view"]', function(e) {
        e.preventDefault();
        $('#view-type a').removeClass('active');
        $(this).addClass('active');
        $('.ct-results, .more-result-loading').hide();
        $('.go-full-calendar-holder').show();
    });
    
    $(document).on('click', '#view-type a[href="#date-view"], #view-type a[href="#all-view"]', function(e) {
        e.preventDefault();
        $('.ct-results, .more-result-loading').show();
        $('.go-full-calendar-holder').hide();

        if($('.results-loader.loading').length){return false;}
        isloading = false;
        nomore = false;
        $('#view-type a').removeClass('active');
        $(this).addClass('active');     
        paged = 1;
		offset = 0;
        do_filter();

    });

	function updateSelectedDatesDisplay() {
		var dates = $('#datepicker').multiDatesPicker('getDates');
		var groupedDates = dates.reduce(function(acc, dateString) {
			var parts = dateString.split('-'); // Split 'yy-mm-dd' format
			var year = parseInt(parts[0], 10);
			var month = parseInt(parts[1], 10) - 1; // Months are 0-indexed in JavaScript
			var day = parseInt(parts[2], 10);

			var date = new Date(year, month, day);
			if (!isNaN(date)) { // Check if the date is valid
				var options = { month: 'short' };
				var monthKey = date.toLocaleDateString('en-US', options);
				if (!acc[monthKey]) {
					acc[monthKey] = [];
				}
				acc[monthKey].push(day);
			}
			return acc;
		}, {});

		var formattedDates = Object.keys(groupedDates).map(function(monthKey) {
			var days = groupedDates[monthKey].join(', ');
			return monthKey + ' ' + days;
		});

		$('#show-dates span').text(formattedDates.join(', '));

		current_filter = 'date';
		nomore = false;
		paged	= 1;
		offset	= 0;
		do_filter();
	}

    
    $('#datepicker').multiDatesPicker({
        dateFormat: 'yy-mm-dd',
        minDate: 0,
        onSelect: function(dateText) {
			loaded_dates = [];
            let selectedDates = $(this).multiDatesPicker('getDates');
            $('#selected-dates').val(selectedDates.join(','));
            updateSelectedDatesDisplay();   

        }
    });
    
    function reset_dates() {
		loaded_dates = [];
        $('#datepicker').multiDatesPicker('resetDates');
        $('#selected-dates').val('');
        updateSelectedDatesDisplay();
    }
    
    

    function display_selection() {
        var term_selected = '';
        $.each(selected, function(index, item) {
            term_selected += `
            <span class="term-selected" data-id="`+item.term_id+`" data-taxonomy="`+item.taxonomy+`"><svg xmlns="http://www.w3.org/2000/svg" width="7.069" height="7.069" viewBox="0 0 7.069 7.069">
  <g id="close-sm" transform="translate(-338.439 -712.439)">
    <line id="Line_856" data-name="Line 856" x2="4.948" y2="4.948" transform="translate(339.5 713.5)" fill="none" stroke="#fff" stroke-linecap="round" stroke-width="1.5"/>
    <line id="Line_857" data-name="Line 857" x1="4.948" y2="4.948" transform="translate(339.5 713.5)" fill="none" stroke="#fff" stroke-linecap="round" stroke-width="1.5"/>
  </g>
</svg>
 `+ item.name +`</span>
            `;
        });

        $('.ct-applied-filters').html(term_selected);
    }


    function reset_taxonomy() {
        selected    = [];
        dates       = [];
        genres      = [];
        series      = [];
		loaded_dates = [];
        has_filter  = false;
        isloading = false;
        nomore = false;
    }


    function taxonomy(callback) {
        reset_taxonomy();

        $('.filter-item').each(function() {
            $input = $(this).find('.term-input');
            if ($input.hasClass('selected')) {
                has_filter = true;

                var taxonomy = $input.data('taxonomy');
                var term_id  = $input.data('id');
                var name     = $input.data('name');

                selected.push({
                    taxonomy: taxonomy,
                    term_id : term_id,
                    name    : name
                });

                if (taxonomy === 'genre') {
                    genres.push( term_id );
                }

                if (taxonomy === 'theather_series') {
                    series.push( term_id );
                }


            }
        });
        callback();
    }

    // Filters
    $(document).on('click', '.ct-filters button ', function(e) {
        e.preventDefault();
        $button = $(this);
        var container = $button.find('.dropdown-container');
        if (!container.is(e.target) && container.has(e.target).length === 0){
            $button.toggleClass('active');
        }
    });

    $(document).on('click', '.filter-item', function(e) {
        e.preventDefault();

        $input = $(this).find('.term-input');
        if ($input.hasClass('selected')) {
            $input.removeClass('selected');
        } else {
            $input.addClass('selected');
        }

        current_filter = 'taxonomy';
        taxonomy(function() {
            paged = 1;
			offset = 0;
            do_filter();
        });
    });

    $(document).mouseup(function(e) {
        var container = $('.dropdown-container');
        if (!container.is(e.target) && container.has(e.target).length === 0){
            container.parent().removeClass('active');
        }
    });


    // Keyword
    $keyword_input.on('keyup', function () {
        nomore = false;
        clearTimeout(typingTimer);
        current_filter = 'keyword';
        typingTimer = setTimeout(do_filter, doneTypingInterval);
    });
    $keyword_input.on('keydown', function () {
        clearTimeout(typingTimer);
    });

    // All
    $(document).on('click', '#reset-filters', function(e) {
        e.preventDefault();
        reset_dates();
        
        reset_taxonomy();
        $('.filter-item .term-input').removeClass('selected');
        paged = 1;
		offset = 0;
        do_filter();
    });
    
    // Reset button functionality
    $('#reset-dates').click(function() {
        reset_dates();
    });

    // Remove term selected
    $(document).on('click', '.term-selected', function(e) {
        e.preventDefault();
        $term    = $(this);
        var _taxonomy = $term.data('taxonomy');
        var _term_id  = $term.data('id');

        $('.term-input[data-taxonomy="'+_taxonomy+'"]').each(function() {
            $input = $(this);
            var id = $input.data('id');
            if (id === _term_id) {
                $input.removeClass('selected');
            }
        });
        taxonomy(function() {
            paged = 1;
			offset = 0;
            do_filter();
        });
    });


    setInterval(function() {
        if (has_filter) {
            $('#filter-all').removeClass('selected');
        } else {
            $('#filter-all').addClass('selected');
        }
    }, 100);


    // Load default
    taxonomy(function() {
        paged = 1;
		offset = 0;
        do_filter();
    });
});