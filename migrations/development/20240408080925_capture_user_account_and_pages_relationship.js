exports.up = function(knex) {
  return knex.schema.createTable('page_user_accounts', function(table) {
    table.increments('id').primary();
    table.string('page_id').notNullable();
    table.integer('user_account_id').unsigned().notNullable();
    table.foreign('page_id').references('unique_identifier').inTable('pages');
    table.foreign('user_account_id').references('id').inTable('user_accounts');
    table.unique(['page_id', 'user_account_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('page_user_accounts');
};
