exports.up = function(knex) {
  return knex.schema.alterTable('user_accounts', (table) => {
      table.boolean('backup').defaultTo(false);
      table.boolean('fetching').defaultTo(true);
      table.string('business_id');
      table.string('role').defaultTo('client');
    })
};

exports.down = function(knex) {
  return knex.schema.alterTable('user_accounts', (table) => {
      table.dropColumn('boolean');
      table.dropColumn('role');
      table.dropColumn('fetching');
      table.dropColumn('business_id');
    });
};
