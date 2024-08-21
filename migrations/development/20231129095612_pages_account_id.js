
exports.up = function(knex) {
  return knex.schema.table('pages', (table) => {
    table.integer('user_id');
    table.integer('account_id');
    table.foreign('user_id', 'campaigns_user_id_foreign').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('account_id', 'foreign_user_account_id').references('id').inTable('user_accounts').onDelete('CASCADE');
    table.dropPrimary(); // Drops the existing primary key
    table.string('unique_identifier', 255).primary(); // Adds a new primary key
  })
};

exports.down = function(knex) {
  return knex.schema.table('pages', (table) => {
      table.dropColumn('account_id');
      table.dropColumn('user_id');
      table.primary('id'); // Restores 'id' as the primary key
      table.dropColumn('unique_identifier');
    });
};
