
exports.up = function(knex) {
    return knex.schema.alterTable('user_accounts', (table) => {
        table.text('refresh_token');
        table.timestamp('expires_in');
        table.timestamp('refresh_token_expires_in');
      })
};

exports.down = function(knex) {
    return knex.schema.alterTable('user_accounts', (table) => {
        table.dropColumn('expires_in');
        table.dropColumn('refresh_token');
        table.dropColumn('refresh_token_expires_in');
      });
};
