/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('pixels_ad_accounts_relations', function(table) {

    table.increments('id').primary();
    table.string('pixel_id').notNullable();
    table.bigInteger('ad_account_id').unsigned().notNullable();
    table.timestamps(true, true);

    table.foreign('pixel_id').references('id').inTable('pixels').onDelete('CASCADE');
    table.foreign('ad_account_id').references('id').inTable('ad_accounts').onDelete('CASCADE');
    table.unique(['pixel_id', 'ad_account_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('pixels_ad_accounts_relations');
};
