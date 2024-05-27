exports.up = function(knex) {
  return knex.schema.createTable('sedo', function(table) {
    table.increments('id').primary(); // SERIAL PRIMARY KEY
    table.string('date', 255);
    table.text('traffic_source');
    table.text('campaign_id');
    table.text('adset_id');
    table.text('ad_id');
    table.integer('visitors').defaultTo(0);
    table.smallint('hour');
    table.integer('pb_visits').defaultTo(0);
    table.integer('pb_conversions').defaultTo(0);
    table.integer('conversions').defaultTo(0);
    table.float('pb_revenue').defaultTo(0); // Corrected this line for the pb_revenue column.
    table.text('domain');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
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
