
exports.up = function(knex) {
  return knex.schema.createTable('pages', function(table) {
      table.string("id", 255).primary();
      table.string("name", 255);
  })
};

exports.down = function(knex) {
  return knex.schema.dropTable('pages');
};
