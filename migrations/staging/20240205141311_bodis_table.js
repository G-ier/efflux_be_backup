exports.up = function(knex) {
    return knex.schema.createTable('bodis', function(table) {
      // Identifier
      table.increments('id').primary();
      table.text('unique_identifier').unique('bodis_unique_identifier')
  
      // Date and Time Data
      table.string('date');
      table.smallint('hour');
  
      // bodis Data
      table.integer('domain');
  
      // Traffic Source Data
      table.string('campaign_id');
      table.string('campaign_name');
      table.string('adset_id');
      table.string('adset_name');
      table.string('ad_id');
      table.string('ad_name');
      table.string('traffic_source');
  
      // Conversion Data
      table.integer('conversions');
      table.float('revenue');
      table.boolean('finalized');
  
      // Timestamps
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      table.string('pixel_id');
    })
    .then(() => {
      // Creating the Trigger
      return knex.raw(`
        CREATE TRIGGER updated_at
        BEFORE UPDATE ON bodis
        FOR EACH ROW
        EXECUTE FUNCTION updated_at_column();
      `);
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTable('bodis');
  };
  