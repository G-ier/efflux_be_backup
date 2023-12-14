exports.up = function (knex) {
    return knex.schema.createTable('taboola', function (table) {
      table.string("campaign_id");
      table.string('campaign_name');
      table.date('date');
      table.integer('hour');
      table.integer('clicks');
      table.integer('impressions');
      table.integer('visible_impressions');
      table.decimal('spent', 14, 2);
      table.decimal('conversions_value', 14, 2);
      table.decimal('roas', 5, 2);
      table.decimal('ctr', 5, 2);
      table.decimal('vctr', 5, 2);
      table.decimal('cpm', 14, 2);
      table.decimal('vcpm', 14, 2);
      table.decimal('cpc', 10, 3);
      table.decimal('cpa', 10, 3);
      table.decimal('cpa_clicks', 10, 3);
      table.decimal('cpa_views', 10, 3);
      table.integer('cpa_actions_num');
      table.integer('cpa_actions_num_from_clicks');
      table.integer('cpa_actions_num_from_views');
      table.decimal('cpa_conversion_rate', 5, 2);
      table.decimal('cpa_conversion_rate_clicks', 5, 2);
      table.decimal('cpa_conversion_rate_views', 5, 2);
      table.string('currency');
      table.string('unique_identifier');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  };
  
  exports.down = function (knex) {
    return knex.schema.dropTable('taboola');
  };