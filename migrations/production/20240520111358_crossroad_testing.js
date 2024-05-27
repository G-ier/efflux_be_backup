/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {

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


};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('crossroads_testing');
};

