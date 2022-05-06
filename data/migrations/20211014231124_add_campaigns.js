
exports.up = function(knex) {
  return knex.schema.createTable('campaigns', (tbl) => {
    tbl.string('id').primary();
    tbl.string('name');
    tbl.enum('provider', ['facebook', 'google']);
    tbl.string('status');
    tbl.integer('user_id').unsigned();
    tbl.foreign('user_id').references('id').inTable('users');
    tbl.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    tbl.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('campaigns');
};
