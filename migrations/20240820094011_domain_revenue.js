exports.up = function(knex) {
  return knex.schema.alterTable('revenue', (table) => {
    table.text('domain_name').defaultTo(''); // Adding domain_name column
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('revenue', (table) => {
    table.dropColumn('domain_name'); // Removing domain_name column
  });
};
