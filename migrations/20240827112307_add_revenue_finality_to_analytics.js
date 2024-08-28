exports.up = function(knex) {
  return knex.schema.alterTable('analytics', (table) => {
    table.text('final').defaultTo(''); // Adding final column
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('analytics', (table) => {
    table.dropColumn('final'); // Removing final column
  });
};
