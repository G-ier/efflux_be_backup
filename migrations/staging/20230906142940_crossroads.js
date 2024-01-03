exports.up = function(knex) {
  return knex.schema.createTable('crossroads', function(table) {
    table.increments('id').primary();
    table.string('date', 255);
    table.string('campaign_id', 255);
    table.string('ad_id', 255);
    table.float('total_revenue');
    table.integer('total_searches');
    table.integer('total_lander_visits');
    table.integer('total_revenue_clicks');
    table.integer('total_visitors');
    table.integer('total_tracked_visitors');
    table.string('hour_fetched', 255);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.smallint('hour');
    table.string('pixel_id', 255);
    table.string('account', 255);
    table.string('adset_id', 255);
    table.bigInteger('crossroads_campaign_id').references('id').inTable('crossroads_campaigns').onDelete('CASCADE');
    table.string('request_date', 255);
    table.string('campaign_name', 255);
    table.string('adset_name', 255);
    table.string('traffic_source', 255);
    table.string('cr_camp_name', 255);
    table.text('unique_identifier').unique('crossroads_unique_identifier');
  })
  .then(() => {
    // Creating the Trigger
    return knex.raw(`
      CREATE TRIGGER updated_at
      BEFORE UPDATE ON crossroads
      FOR EACH ROW
      EXECUTE FUNCTION updated_at_column();
    `);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('crossroads');
};
