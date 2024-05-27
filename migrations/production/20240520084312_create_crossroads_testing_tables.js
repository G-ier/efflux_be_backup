/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('crossroads_accounts_testing', function(table){
    table.increments("id").primary();
    table.string('email').notNullable();
    table.string('ckey').notNullable();
    table.string('csecret').notNullable();
  }).then(function(){
    return knex.schema.createTable('crossroads_campaigns_testing', function(table){
      table.string('category').defaultTo("");
    });
  }).then(function(){
    return knex.schema.createTable('crossroads_testing', function(table){
      table.increments('id').primary(); // good
      table.date('date'); // good
      table.integer('campaign_id'); // good
      table.text('ad_id'); // good
      table.integer('total_revenue'); // good
      table.integer('total_searches'); // good
      table.integer('total_lander_visits'); // good
      table.integer('total_revenue_clicks'); // good
      table.integer('total_visitors'); // good
      table.integer('total_tracked_visitors'); // good
      table.integer('hour_fetched'); // good
      table.timestamp('created_at').defaultTo(knex.fn.now()); // good
      table.timestamp('updated_at').defaultTo(knex.fn.now()); // good
      table.integer('hour'); // good
      table.integer('pixel_id'); // good
      table.text('account') // good
      table.text('adset_id'); // good
      table.integer('crossroads_campaign_id'); // good
      table.date('request_date'); // good
      table.text('campaign_name'); // good
      table.text('adset_name'); // good
      table.text('traffic_source'); // good
      table.text('cr_camp_name'); // good
      table.text('unique_identifier').unique('crossroads_testing_unique_identifier'); // good

    });
  }).then(function(){
    return knex.schema.createTable('crossroads_raw_insights_testing', function(table){
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
      table.boolean("valid_pixel").defaultTo(true);

      // Timestamps
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }).then(() => {
    return knex.raw(`
      CREATE TRIGGER updated_at
      BEFORE UPDATE ON crossroads_raw_insights_testing
      FOR EACH ROW
      EXECUTE FUNCTION updated_at_column();
    `);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('crossroads_accounts_testing').then(function(){
    return knex.schema.dropTable('crossroads_campaigns_testing');
  }).then(function(){
    return knex.schema.dropTable('crossroads_testing');
  }).then(function(){
    return knex.schema.dropTable('crossroads_raw_insights_testing');
  })
};
