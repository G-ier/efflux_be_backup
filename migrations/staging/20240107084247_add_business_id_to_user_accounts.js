exports.up = function(knex) {
  return knex.schema.alterTable('user_accounts', (table) => {
    // Add a new column for status with a default value of 'Queued'
    table.string('business_id')
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('user_accounts', (table) => {
    // Remove the status column
    table.dropColumn('business_id');
  });
};
