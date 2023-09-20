exports.up = function(knex) {
  return knex.schema.table('facebook', table => {
    table.integer('lead');
  })
};

exports.down = function(knex) {
  return knex.schema.table('facebook', table => {
    table.dropColumn('lead');
  })
};