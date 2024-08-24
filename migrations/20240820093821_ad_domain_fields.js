exports.up = function(knex) {
  return knex.schema.alterTable('analytics', (table) => {
    table.text('ad_account_name').defaultTo(''); // Adding ad_account_name column
    table.text('domain_name').defaultTo(''); // Adding domain_name column
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('analytics', (table) => {
    table.dropColumn('ad_account_name'); // Removing ad_account_name column
    table.dropColumn('domain_name'); // Removing domain_name column
  });
};
