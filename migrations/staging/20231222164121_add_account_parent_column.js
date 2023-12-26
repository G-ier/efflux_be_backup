exports.up = function (knex) {
  return knex.schema.createTable('organizations', function (table) {
    table.increments('id');
    table.string('name').notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.boolean('is_active').notNullable().defaultTo(true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('organizations');
};
