exports.up = function(knex) {
  return knex.schema.createTable('medianet_raw_insights', function(table) {

      table.increments('id').primary();

      // Date and Time
      table.string('date');
      table.integer('hour').notNullable();

      // Traffic Source Data
      table.string('pixel_id');
      table.string('campaign_id');
      table.string('campaign_name');
      table.string('adset_id');
      table.string('adset_name');
      table.string('ad_id');
      table.string('ad_name');
      table.string('traffic_source');

      // User Data
      table.string('session_id').notNullable();
      table.string('ip');
      table.string('country_code');
      table.string('region');
      table.string('city');
      table.string('external');
      table.string('timestamp');
      table.string('user_agent');

      // Conversion Data
      table.integer('impressions').defaultTo(0);
      table.integer('conversions').defaultTo(0);
      table.decimal('revenue', 15, 2).defaultTo(0);

      // Identifier
      table.string('unique_identifier').unique();

      // Reporting Data
      table.integer("reported_conversions").defaultTo(0);
      table.float("reported_amount").defaultTo(0);
      table.boolean("valid_pixel").defaultTo(true);

      // Timestamps
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

  }).then(() => {
      // Creating the Trigger
      return knex.raw(`
        CREATE TRIGGER updated_at
        BEFORE UPDATE ON medianet_raw_insights
        FOR EACH ROW
        EXECUTE FUNCTION updated_at_column();
      `);
    });
};

exports.down = function(knex) {
  return knex.schema.dropTable('medianet_raw_insights');
};
