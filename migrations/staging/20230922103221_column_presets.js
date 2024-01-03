exports.up = function (knex) {
  return knex.schema.createTable('column_presets', (tbl) => {
    tbl.increments('id').primary();
    tbl.string('name').notNullable();
    tbl.specificType('presets', 'TEXT[]').notNullable();
    tbl.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('column_presets');
};
