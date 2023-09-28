exports.up = function(knex) {
  return knex.schema.createTable('sedo', function(table) {
    table.increments('id').primary(); // SERIAL PRIMARY KEY
    table.string('date', 10);
    // Assuming you'll fill in the "hour" column later with actual type and constraints
    table.text('domain');
    table.text('traffic_source');
    table.text('campaign_id');
    table.text('adset_id');
    table.text('ad_id');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.text('funnel_id').nullable();
    table.text('hit_id').nullable();
    table.integer('visitors');
    table.integer('clicks');
    table.float('revenue');
    table.text('unique_identifier').unique('sedo_unique_identifier');
  })
  .then(() => {
    // Creating the Trigger
    return knex.raw(`
      CREATE TRIGGER updated_at
      BEFORE UPDATE ON sedo
      FOR EACH ROW
      EXECUTE FUNCTION updated_at_column();
    `);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('sedo');
};
