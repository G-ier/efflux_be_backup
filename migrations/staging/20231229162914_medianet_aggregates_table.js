exports.up = function(knex) {
    return knex.schema.createTable('medianet', function(table) {
        
        table.increments("id").primary();
        
        // Date and Time
        table.string('date').notNullable();
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
    
        // Conversion Data
        table.integer('impressions').defaultTo(0);
        table.integer('conversions').defaultTo(0);
        table.decimal('revenue', 15, 2).defaultTo(0);
    
        // Identifier
        table.string('unique_identifier').unique();
    
        // Timestamps
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    }).then(() => {
      // Creating the Trigger
      return knex.raw(`
        CREATE TRIGGER updated_at
        BEFORE UPDATE ON medianet
        FOR EACH ROW
        EXECUTE FUNCTION updated_at_column();
      `);
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTable('medianet');
  };