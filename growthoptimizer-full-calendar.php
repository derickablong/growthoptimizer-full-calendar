<?php
/**
 * Plugin Name:     Growth Optimizer Full Calendar
 * Plugin URI:      https://growthoptimizer.com
 * Description:     Event calendar
 * Author:          Growth Optimizer
 * Author URI:      https://growthoptimizer.com/
 * Text Domain:     go-full-calendar
 * Domain Path:     /languages
 * Version:         0.1.0
 *
 * @package         growthoptimizer-full-calendar
 */

define('GO_FC_DIR', plugin_dir_path( __FILE__ ));
define('GO_FC_URL', plugin_dir_url( __FILE__ ));

class GO_FULL_CALENDAR
{
    # script folder
    protected $folder_script;

    # css folder
    protected $folder_css;

    # Plugin path
    protected $plugin_dir;

    # Plugin url
    protected $plugin_url;


    function __construct( $dir_path, $url_path )
    {
        $this->plugin_dir    = $dir_path;
        $this->plugin_url    = $url_path;
        $this->folder_script = $url_path.'library/js/';
        $this->folder_css    = $url_path.'library/css/';
        $this->front_end_library();
        $this->shortcodes();
        $this->actions();
    }


    /**
     * Front-end library
     * @return void
     */
    private function front_end_library()
    {
        wp_register_style( 
            'go-fc-font-josefin-sans-css', 
            'https://fonts.googleapis.com/css2?family=Josefin+Sans:ital,wght@0,100..700;1,100..700&display=swap', 
            array(), 
            uniqid(), 
            'all' 
        );
        wp_register_style( 
            'go-fc-font-roboto-css', 
            'https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100..900;1,100..900&display=swap', 
            array(), 
            uniqid(), 
            'all' 
        );

        wp_register_style( 
            'go-fc-main-css', 
            $this->folder_css . 'fc-main.css', 
            array(), 
            uniqid(), 
            'all' 
        );
        wp_register_style( 
            'go-fc-font-end-css', 
            $this->folder_css . 'go-fc.css', 
            array(), 
            uniqid(), 
            'all' 
        );

        wp_register_script(
            'go-fc-global-script',
            $this->folder_script . 'fc-global-v6.1.15.js',
            array('jquery'),
            uniqid(),            
            true
        );
        wp_register_script(
            'go-fc-locales-script',
            $this->folder_script . 'fc-locales.js',
            array('jquery'),
            uniqid(),            
            true
        );
        wp_register_script(
            'go-fc-front-end-script',
            $this->folder_script . 'go-fc.js',
            array('jquery'),
            uniqid(),            
            true
        );
        wp_localize_script(
            'go-fc-front-end-script',
            'go_fc',
            [
                'ajaxurl' => esc_url( admin_url( 'admin-ajax.php' ) )
            ]
        );
    }


    /**
     * Register shortcodes
     * @return void
     */
    private function shortcodes()
    {
        add_shortcode('go-full-calendar', [$this, 'load_full_calendar']);
    }


    /**
     * Load full calendar DOM
     * @return void
     */
    public function load_full_calendar( $atts )
    {
        ob_start();
        do_action(
            'go-front-end', 
            array_key_exists('theme', $atts) ? $atts['theme'] : 'bytown'
        );
        return ob_get_clean();
    }


    public function front_end( $theme )
    {        
        if ('fox' == $theme) {
            wp_enqueue_style('go-fc-font-roboto-css');
        }
        if ('bytown' == $theme) {
            wp_enqueue_style('go-fc-font-josefin-sans-css');
        }

        wp_enqueue_style('go-fc-main-css');
        wp_enqueue_style('go-fc-font-end-css');
        wp_enqueue_script('go-fc-global-script');
        wp_enqueue_script('go-fc-locales-script');
        wp_enqueue_script('go-fc-front-end-script');
        include $this->plugin_dir . 'dom/front-end.php';
    }


    /**
     * Regiser action hooks
     * @return void
     */
    private function actions()
    {
        add_action(
            'go-front-end',
            [$this, 'front_end'],
            10, 1
        );

        add_action(
            'wp_ajax_go_full_calendar',
            [$this, 'ajax_full_calendar']
        );
        add_action(
            'wp_ajax_nopriv_go_full_calendar',
            [$this, 'ajax_full_calendar']
        );
    }


    /**
     * Ajax reqeust for event calendar
     * @return void
     */
    public function ajax_full_calendar()
    {       

        $loaded_dates = [];
        $json_data    = [];
        $keyword      = $_POST['keyword'];
        $dates        = $_POST['dates'];
        $genres       = $_POST['genres'];
        $series       = $_POST['series'];
        
        $date_terms = get_terms([
            'taxonomy'   => 'event-date',
            'hide_empty' => true,
            'orderby'    => 'slug',
            'order'      => 'ASC'
        ]);       
        
        
        if (!empty($dates)) {
            $date_terms = !empty($dates) ? explode(",", $dates) : array();            
        }                 
        
        foreach ($date_terms as $date) {
            
            $the_date = !empty($date->slug) ? $date->slug : $date;

            $current_date = strtotime(date('Y-m-d'));
            $data_date = strtotime($the_date);
            if ($data_date < $current_date) continue;


            $args       = [];
            $tax_query  = [];
            $meta_query = [];
            
            if(in_array($the_date, $loaded_dates)){
                continue;
            }else{          
                $loaded_dates[] = $the_date;
            }

            $args = array(
                'post_type'      => 'movies',
                'post_status'    => 'publish',
                'posts_per_page' => -1
            );

            // Keyword or author filter
            if (!empty($keyword)) {
                $args['s'] = $keyword;
            }       

            // Dates
            if (!empty($the_date)) {
                $tax_query[] = array(
                    'taxonomy' => 'event-date',
                    'field'    => 'slug',
                    'terms'    => $the_date,
                );
            }

            # Genres
            if (!empty($genres)) {
                $tax_query[] = array(
                    'taxonomy' => 'genre',
                    'field'    => 'term_id',
                    'terms'    => $genres,
                );
            } 

            # Series Type
            if (!empty($series)) {
                $tax_query[] = array(
                    'taxonomy' => 'theather_series',
                    'field'    => 'term_id',
                    'terms'    => $series,
                );
            }

            # is event
            if ($page_id == 1460) { // Event page ID
                $meta_query[] = array(
                    'key' => 'is_event',
                    'value'    => 1,
                );
            }

            # Meta query
            if (count($meta_query)){
                $args['meta_query'] = $meta_query;
            }


            # Tax query
            if (!empty($tax_query)){
                $args['tax_query'] = $tax_query;
            }

            $results = new WP_Query($args);

            // Loop through posts
            if ($results->have_posts()) :
            
                while ($results->have_posts()) : $results->the_post();
                    $the_time = '';
                    $showtimes = get_field('showtimes');
                    
                    if ($showtimes) {
                        $added_times = [];
                        foreach ($showtimes as $showtime) {
                            if (isset($showtime['date']) && isset($the_date)) {
                                $normalized_date = str_replace('-', '', $the_date);
                                if ($showtime['date'] === $normalized_date) {
                                    $time = $showtime['time'];
                                    
                                    if (!in_array($time, $added_times)) {
                                        $the_time = $time;                                                                      
                                        $added_times[] = $time;
                                        break;                                      
                                    }
                                }
                            }
                        }
                    }                  
            
                    $time_raw = new DateTime($the_time);
                    $the_time = $time_raw->format("H:i:s");                  


                    $json_data[] = [
                        'date'  => $the_date,
                        'time'  => $the_time,
                        'title' => html_entity_decode(get_the_title()),
                        'start' => $the_date . ' ' . $the_time,
                        'end'   => $the_date . ' ' . $the_time,
                        'url'   => get_the_permalink()
                    ];
            
                endwhile;
            
                usort($json_data, function ($a, $b) {
                    return strcmp($a['time'], $b['time']);
                });
            
                wp_reset_postdata();            
            
            endif;           
            

        }
    
        

        wp_send_json($json_data);
        wp_die();
    }

}
new GO_FULL_CALENDAR(
    GO_FC_DIR,
    GO_FC_URL
);