
exports.up = function(knex) {
  return knex.schema.createTable('user_accounts', (tbl) => {
    tbl.increments();
    tbl.string('name');
    tbl.string('email');
    tbl.string('image_url');
    tbl.enum('provider', ['facebook', 'google']);
    tbl.string('provider_id');
    tbl.string('status');
    tbl.string('token');
    tbl.integer('user_id').unsigned();
    tbl.foreign('user_id').references('id').inTable('users');
    tbl.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    tbl.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('user_accounts');
};
