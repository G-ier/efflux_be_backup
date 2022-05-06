exports.up = function(knex) {
  return knex.schema.createTable('ad_accounts', (tbl) => {
    tbl.increments()
    tbl.enum('provider', ['facebook', 'google']);
    tbl.string('provider_id');
    tbl.string('name');
    tbl.string('status');
    tbl.integer('user_id').unsigned();
    tbl.foreign('user_id').references('id').inTable('users');
    tbl.integer('account_id').unsigned();
    tbl.foreign('account_id').references('id').inTable('user_accounts');
    tbl.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    tbl.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
    tbl.unique(['account_id', 'provider', 'provider_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('ad_accounts');
};
