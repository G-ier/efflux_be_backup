const e = require("express");

exports.up = function(knex) {
  return knex.schema.createTable('crossroads_raw_insights', function(table) {
      // Identifier
      table.string('unique_identifier').primary();

      // Date and Time Data
      table.string('date');
      table.smallint('hour');

      // Crossroads Data
      table.integer("crossroads_campaign_id");
      table.string("crossroads_campaign_number");
      table.string("cr_camp_name");
      table.string("crossroads_campaign_type");
      table.string("keyword_clicked");
      table.string("account")
      table.string("category");

      // Traffic Source Data
      table.string("pixel_id");
      table.string("campaign_id");
      table.string("campaign_name");
      table.string('adset_id');
      table.string('adset_name');
      table.string('ad_id');
      table.string('traffic_source');

      // User Data
      table.string("user_agent")
      table.string("ip");
      table.string("country_code");
      table.string("region");
      table.string("city");
      table.string("session_id");

      // Conversion Data
      table.integer('conversions');
      table.float('revenue');
      table.string('external');
      table.string("timestamp");
      table.integer('lander_searches');
      table.integer('lander_visitors');
      table.integer('tracked_visitors');
      table.integer('total_visitors');

      // Reporting Data
      table.integer("reported_conversions").defaultTo(0);
      table.float("reported_amount").defaultTo(0);

      // Timestamps
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
  })
  .then(() => {
    // Creating the Trigger
    return knex.raw(`
      CREATE TRIGGER updated_at
      BEFORE UPDATE ON crossroads_raw_insights
      FOR EACH ROW
      EXECUTE FUNCTION updated_at_column();
    `);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('crossroads_raw_insights');
};

