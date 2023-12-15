exports.up = function(knex) {
    return knex.schema.alterTable('tonic', function(table) {
      table.string('pixel_id');
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.alterTable('tonic', function(table) {
      table.dropColumn('pixel_id');
    });
  };