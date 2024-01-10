/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('ua_aa_map', function (table) {
    table.increments('id').primary();
    table.integer('ua_id').unsigned().notNullable();
    table.integer('aa_id').unsigned().notNullable();
    table.boolean('prioritized').defaultTo(false);
    table.foreign('ua_id').references('id').inTable('user_accounts');
    table.foreign('aa_id').references('id').inTable('ad_accounts');
    table.unique(['ua_id', 'aa_id']);
  })
  .then(() => {
    // Fetch data from ad_accounts
    return knex.select('id', 'account_id').from('ad_accounts');
  })
  .then((rows) => {
    // Map data to ua_aa_map format
    const mappedData = rows.map(row => ({
      ua_id: row.account_id, // Assuming account_id corresponds to ua_id in ua_aa_map
      aa_id: row.id,
      prioritized: false // Default value
    }));

    // Insert data into ua_aa_map
    return knex('ua_aa_map').insert(mappedData);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('ua_aa_map');
};
