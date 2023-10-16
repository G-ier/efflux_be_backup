
exports.up = function(knex) {
  return knex.schema.createTable('sedo2', function(table) {
    table.increments('id').primary();
    table.string('date', 255);
    table.smallint('hour');
    table.text('domain');
    table.string('traffic_source', 255);
    table.string('campaign_id', 255);
    table.string('adset_id', 255);
    table.string('ad_id', 255);
    table.integer('lander_visits');
    table.integer('lander_searches');
    table.integer('revenue_events');
    table.integer('total_visitors');
    table.integer('total_visits');
    table.float('revenue');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.text('unique_identifier').unique('sedo2_unique_identifier');
  })
  .then(() => {
    // Creating the Trigger
    return knex.raw(`
      CREATE TRIGGER updated_at
      BEFORE UPDATE ON sedo2
      FOR EACH ROW
      EXECUTE FUNCTION updated_at_column();
    `);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('sedo2');
};
