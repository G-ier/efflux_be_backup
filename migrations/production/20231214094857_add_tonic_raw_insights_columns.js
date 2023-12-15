exports.up = function(knex) {
    return knex.schema.alterTable('tonic_raw_insights', function(table) {
      table.string('pixel_id');
      table.string('external');
      table.string('timestamp');
      table.string('user_agent');
      table.boolean('valid_pixel').defaultTo(true);
      table.integer('reported_conversions').defaultTo(0);
      table.float('reported_amount').defaultTo(0);
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.alterTable('tonic_raw_insights', function(table) {
      table.dropColumn('pixel_id');
      table.dropColumn('external');
      table.dropColumn('timestamp');
      table.dropColumn('user_agent');
      table.dropColumn('valid_pixel');
      table.dropColumn('reported_to_ts');
      table.dropColumn('reported_conversions');
      table.dropColumn('reported_amount');
    });
  };