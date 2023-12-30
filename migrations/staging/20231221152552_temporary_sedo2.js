exports.up = function(knex) {
  return knex.schema.createTable('temporary_sedo2', function(table) {
    table.increments('id').primary();
    table.string('date')
    table.string('hour');
    table.string('domain');
    table.string('traffic_source');
    table.string('campaign_name');
    table.string('campaign_id');
    table.string('adset_name');
    table.string('adset_id');
    table.string('ad_name');
    table.string('ad_id');
    table.string('pixel_id')
    table.string('transaction_id')
    table.float('revenue');
    table.integer('conversions');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.string('unique_identifier').unique('sedo2_temp_unique_identifier')
    // Add more fields as necessary
  })
  .then(() => {
    // Creating the Trigger
    return knex.raw(`
      CREATE TRIGGER updated_at
      BEFORE UPDATE ON temporary_sedo2
      FOR EACH ROW
      EXECUTE FUNCTION updated_at_column();
    `);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('temporary_sedo2');
};
