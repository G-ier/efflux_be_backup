exports.up = function(knex) {
  return knex.schema.createTable('bodis_raw_insights', function(table) {
    // Identifier
    table.increments('id').primary();
    table.text('unique_identifier').unique('bodis_raw_unique_identifier')

    // Date and Time Data
    table.string('date');
    table.smallint('hour');
    table.string('click_timestamp');

    // bodis Data
    table.integer('domain');


    // Traffic Source Data
    table.string('campaign_id');
    table.string('campaign_name');
    table.string('adset_id');
    table.string('adset_name');
    table.string('ad_id');
    table.string('ad_name');
    table.string('traffic_source');

    // User Data
    table.string('session_id');
    table.string('ip');
    table.string('country_code');
    table.string('region');
    table.string('city');
    table.text('user_agent');
    
    // Conversion Data
    table.integer('conversions');
    table.float('revenue');
    table.string('keyword_clicked');
    table.boolean('finalized');
    table.string('timestamp');
    table.string('external');

    // Timestamps
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Reporting

    table.string('pixel_id');
    table.boolean('valid_pixel').defaultTo(true);
    table.integer('reported_conversions').defaultTo(0);
    table.float('reported_amount').defaultTo(0);
  })
  .then(() => {
    // Creating the Trigger
    return knex.raw(`
      CREATE TRIGGER updated_at
      BEFORE UPDATE ON bodis_raw_insights
      FOR EACH ROW
      EXECUTE FUNCTION updated_at_column();
    `);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('bodis_raw_insights');
};
