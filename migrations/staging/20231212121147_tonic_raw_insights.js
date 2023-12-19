exports.up = function(knex) {
    return knex.schema.createTable('tonic_raw_insights', function(table) {
      // Identifier
      table.increments('id').primary();
      table.text('unique_identifier').unique('tonic_raw_unique_identifier')

      // Date and Time Data
      table.string('date');
      table.smallint('hour');
      table.string('click_timestamp');

      // Tonic Data
      table.integer('tonic_campaign_id').references('id').inTable('tonic_campaigns').onDelete('CASCADE');
      table.string('tonic_campaign_name');
      table.string('ad_type');
      table.string('advertiser');
      table.string('template');

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

      // Conversion Data
      table.integer('conversions');
      table.float('revenue');
      table.string('keyword_clicked');
      table.string('revenue_type');

      // Timestamps
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .then(() => {
      // Creating the Trigger
      return knex.raw(`
        CREATE TRIGGER updated_at
        BEFORE UPDATE ON tonic_raw_insights
        FOR EACH ROW
        EXECUTE FUNCTION updated_at_column();
      `);
    });
  };

  exports.down = function(knex) {
    return knex.schema.dropTable('tonic_raw_insights');
  };
