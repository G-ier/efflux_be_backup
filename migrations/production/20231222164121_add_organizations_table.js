exports.up = function (knex) {
  return knex.schema.createTable('organizations', function (table) {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.integer('admin_id').unsigned();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.foreign('admin_id').references('users.id');
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('organizations');
};
