exports.up = function(knex) {
  return knex.schema.createTable('redirections', table => {
    table.increments('id').primary();
    table.text('client_ip');
    table.text('cfn_distribution');
    table.text('uri');
    table.text('method');
    table.timestamp('received_at');
    table.text('raw_query_string');
    table.boolean('cf_is_mobile_viewer');
    table.boolean('cf_is_desktop_viewer');
    table.text('referer');
    table.text('x_forwarded_for');
    table.text('user_agent');
    table.text('via');
    table.text('accept_encoding');
    table.text('sec_ch_ua');
    table.text('sec_ch_ua_mobile');
    table.text('sec_ch_ua_platform');
    table.text('upgrade_insecure_requests');
    table.text('x_requested_with');
    table.text('sec_fetch_site');
    table.text('sec_fetch_mode');
    table.text('sec_fetch_dest');
    table.text('x_amzn_waf_waf_thinks');
    table.text('cf_viewer_country');
    table.text('cf_viewer_country_region');
    table.text('cf_viewer_country_region_name');
    table.text('cf_viewer_city');
    table.text('cf_viewer_time_zone');
    table.text('host');
    table.text('src');
    table.text('tg1');
    table.text('tg2');
    table.text('tg3');
    table.text('tg4');
    table.text('tg5');
    table.text('tg6');
    table.text('tg7');
    table.text('tg8');
    table.text('tg9');
    table.text('tg10');
    table.text('dog_house');
    table.text('ad_title');
    table.text('creative_id');
    table.text('utm_medium');
    table.text('utm_source');
    table.text('utm_id');
    table.text('utm_content');
    table.text('utm_term');
    table.text('utm_campaign');
    table.text('buyer');
    table.text('creator');
    table.text('creative_manager');
    table.text('sec_fetch_user');
    table.text('fbclid');

    table.json('raw_event');  // New JSON column to store the whole raw event

    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('redirections');
};
