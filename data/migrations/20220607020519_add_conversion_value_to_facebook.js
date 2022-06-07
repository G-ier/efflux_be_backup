exports.up = function(knex) {
  return knex.schema.table('facebook', table => {
    table.float('conversion_value');
  })
};

exports.down = function(knex) {
  return knex.schema.table('facebook', table => {
    table.dropColumn('conversion_value');
  })
};