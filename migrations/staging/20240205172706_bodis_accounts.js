
exports.up = function(knex) {
    return knex.schema.createTable('bodis_accounts', function(table) {
        table.increments('id').primary();
        table.text('username');
        table.text('password');
        table.text('secret_key');
    });
};


exports.down = function(knex) {
    return knex.schema.dropTable('bodis_accounts');
};
