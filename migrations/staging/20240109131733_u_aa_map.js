/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('u_aa_map', function (table) {
    table.increments('id').primary();
    table.integer('u_id').unsigned().notNullable();
    table.integer('aa_id').unsigned().notNullable();
    table.foreign('u_id').references('id').inTable('users');
    table.foreign('aa_id').references('id').inTable('ad_accounts');
    table.unique(['u_id', 'aa_id']);
  })
  .then(() => {
    // Fetch data from ad_accounts
    return knex.select('id', 'user_id').from('ad_accounts');
  })
  .then((rows) => {
    // Map data to ua_aa_map format
    const mappedData = rows.map(row => ({
      u_id: row.user_id,
      aa_id: row.id
    }));

    // Insert data into ua_aa_map
    return knex('u_aa_map').insert(mappedData);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('u_aa_map');
};
