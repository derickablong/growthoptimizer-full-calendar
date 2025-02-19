(function($) {
    GO_FULL_CALENDAR = {
        el_calendar  : null,
        calendar     : null,
        current_cel  : null,
        el_min_events: null,
        el_fc_today  : null,
        el_fc_day    : null,
        el_mobile_fc : null,
        model        : null,
        
        keyword: '',
        dates  : '',
        genres : [],
        series : [],

        init: function() {            
            GO_FULL_CALENDAR.memory();            
            GO_FULL_CALENDAR.actions();
        },

        time_format: function() {
            return {
                hour: '2-digit',
                minute: '2-digit',                
                meridiem: true
            };
        },

        toolbar: function() {
            return {
                start : 'prev, next, today, title',
                center: '',
                end   : ''
            };
        },

        filter_props: function() {
            GO_FULL_CALENDAR.get_filter_values();            
        },

        source: function() {            
            return {
                url: go_fc.ajaxurl,
                method: 'POST',
                extraParams: function() {
                    GO_FULL_CALENDAR.filter_props();
                    return {
                        action : 'go_full_calendar',
                        keyword: GO_FULL_CALENDAR.keyword,
                        dates  : GO_FULL_CALENDAR.dates,
                        genres : GO_FULL_CALENDAR.genres,
                        series : GO_FULL_CALENDAR.series
                    }
                }
            };
        },

        event_click: function(event) {            
            if (event.event.url) {
                event.jsEvent.preventDefault();
                window.open(event.event.url, "_blank");
            }
        },

        calenar_props: function() {
            return {
                initialView    : 'dayGridMonth',
                events         : GO_FULL_CALENDAR.source(),
                eventTimeFormat: GO_FULL_CALENDAR.time_format(),
                headerToolbar  : GO_FULL_CALENDAR.toolbar(),
                buttonText     : { today: 'This Month' },
                eventClick     : GO_FULL_CALENDAR.event_click,
                contentHeight  : 'auto',
                expandRows     : true
            }
        },

        view: function() {
            GO_FULL_CALENDAR.el_calendar = document.querySelector('#go-full-calendar');
            GO_FULL_CALENDAR.calendar    = new FullCalendar.Calendar(
                GO_FULL_CALENDAR.el_calendar, 
                GO_FULL_CALENDAR.calenar_props()
            );              
            GO_FULL_CALENDAR.calendar.render();            
            setTimeout(function() {
                GO_FULL_CALENDAR.model.trigger('resize');
            }, 2000);          
        },        

        before: function(el) {            
            GO_FULL_CALENDAR.el_fc_day
                .removeClass('current')
                .addClass('default');
            GO_FULL_CALENDAR.current_cel = el;
            GO_FULL_CALENDAR
                .current_cel
                .addClass('current')
                .removeClass('default');
        },

        clear: function() {
            GO_FULL_CALENDAR.el_mobile_fc.hide();
            GO_FULL_CALENDAR.el_fc_day.removeClass('current default');
            GO_FULL_CALENDAR.current_cel = null;
        },

        is_mobile: function() {
            return GO_FULL_CALENDAR.model.width() <= 1024;
        },

        resize: function() {
            GO_FULL_CALENDAR.memory();
            if ( !GO_FULL_CALENDAR.is_mobile() ) {
                GO_FULL_CALENDAR.clear();
            } else {                
                GO_FULL_CALENDAR.el_mobile_fc.show();
                GO_FULL_CALENDAR.before(
                    GO_FULL_CALENDAR.el_fc_today
                );
                GO_FULL_CALENDAR.display_events();
            }
        },

        white_label: function() {
            $('.fc-daygrid-day-bottom').remove();
            if (GO_FULL_CALENDAR.current_cel === null) return;            
            let day = GO_FULL_CALENDAR.current_cel.find('.fc-daygrid-day-number');
            let day_date = day.attr('aria-label');
            let date_arr = day_date.split(',');

            $('.mini-header span').text(date_arr[0]);
            $('.event-items .fc-event-time').each(function() {
                const item_time = $(this);
                if (item_time.hasClass('white-labeled') === false) {
                    item_time.prepend( '<span>' + day_date + '</span> @' );
                    item_time.addClass('white-labeled');
                }
            });
        },

        display_events: function() {            
            let event_container = GO_FULL_CALENDAR.current_cel.find('.fc-daygrid-day-events');
            let event_list = event_container.html();                
            GO_FULL_CALENDAR.el_min_events.html(
                event_list.trim() !== '' ? event_list : '<div class="no-schedule">No schedule found.</div>'
            );             
        },

        cell_click: function(e) {
            e.preventDefault();
            GO_FULL_CALENDAR.memory();
            if (GO_FULL_CALENDAR.is_mobile()) {                
                GO_FULL_CALENDAR.before($(this));
                GO_FULL_CALENDAR.display_events();
            }
        },

        actions: function() {
            document.addEventListener(
                'DOMContentLoaded',
                GO_FULL_CALENDAR.view
            );

            $(document).on(
                'click', 
                '.fc-day',
                GO_FULL_CALENDAR.cell_click
            );

            GO_FULL_CALENDAR.model.on(
                'resize',
                GO_FULL_CALENDAR.resize
            );
            
            setInterval(GO_FULL_CALENDAR.white_label, 100);
        },

        get_filter_values: function() {
            GO_FULL_CALENDAR.genres  = [];
            GO_FULL_CALENDAR.series  = [];
            GO_FULL_CALENDAR.keyword = $('#keyword').length ? $('#keyword').val() : '';
            GO_FULL_CALENDAR.dates   = $('#selected-dates').length ? $('#selected-dates').val() : '';
            $('.filter-item').each(function() {
                const $input = $(this).find('.term-input');
                if ($input.hasClass('selected')) {
    
                    let taxonomy = $input.data('taxonomy');
                    let term_id  = $input.data('id');                   
    
                    if (taxonomy === 'genre') {
                        GO_FULL_CALENDAR.genres.push( term_id );
                    }
    
                    if (taxonomy === 'theather_series') {
                        GO_FULL_CALENDAR.series.push( term_id );
                    }
    
    
                }
            });
        },

        memory: function() {
            GO_FULL_CALENDAR.model         = $(window);
            GO_FULL_CALENDAR.el_mobile_fc  = $('.go-full-calendar-mobile');
            GO_FULL_CALENDAR.el_min_events = $('.mini-event-list .event-items');
            GO_FULL_CALENDAR.el_fc_today   = $('.fc-day.fc-day-today');
            GO_FULL_CALENDAR.el_fc_day     = $('.fc-day');
        }
    };
    GO_FULL_CALENDAR.init();
})(jQuery);