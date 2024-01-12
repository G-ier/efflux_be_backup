/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {

  // Create ua_aa_map table
  return knex.schema.createTable('ua_aa_map', function (table) {
    table.increments('id').primary();
    table.integer('ua_id').unsigned().notNullable();
    table.string('aa_id').unsigned().notNullable();
    table.foreign('ua_id').references('id').inTable('user_accounts');
    table.unique(['ua_id', 'aa_id']);
  })
  // Create u_aa_map table
  .then(() => {
    return knex.schema.createTable('u_aa_map', function (table) {  // Added return here
      table.increments('id').primary();
      table.integer('u_id').unsigned().notNullable();
      table.string('aa_id').unsigned().notNullable();
      table.foreign('u_id').references('id').inTable('users');
      table.unique(['u_id', 'aa_id']);
    });
  })
  // Extract ua_aa_map data from ad_accounts
  .then(() => {
    return knex.select('provider_id', 'account_id').from('ad_accounts');
  })
  // Populate ua_aa_map with data from ad_accounts
  .then((rows) => {
    const mappedData = rows.map(row => ({
      ua_id: row.account_id,
      aa_id: row.provider_id,
      prioritized: false
    }));
    // Insert data into ua_aa_map
    return knex('ua_aa_map').insert(mappedData);
  })
  // Extract unique u_aa_map data from ad_accounts
  .then(() => {
    return knex('ad_accounts').distinct('provider_id', 'user_id');
  })
  // Populate u_aa_map with data from ad_accounts
  .then((rows) => {
    const mappedData = rows.map(row => ({
      u_id: row.user_id,
      aa_id: row.provider_id
    }));

    // Insert data into ua_aa_map
    return knex('u_aa_map').insert(mappedData);
  })
  // Remove duplicate ad_accounts
  .then(() => {
    return knex.raw(`
      DELETE FROM ad_accounts
      WHERE id IN (
          SELECT id
          FROM (
              SELECT id,
              ROW_NUMBER() OVER (
                  PARTITION BY provider, provider_id
                  ORDER BY id
              ) row_num
              FROM ad_accounts
          ) t
          WHERE t.row_num > 1
      );
    `)
  })
  // Add unique constraint to ad_accounts
  .then(() => {
    return knex.schema.table('ad_accounts', function(table) {
      table.unique('provider_id');
    });
  })
  // Update aa_id in ua_aa_map
  .then(() => {
    return knex.raw(`
      UPDATE ua_aa_map
      SET aa_id = ad_accounts.id
      FROM ad_accounts
      WHERE ua_aa_map.aa_id = ad_accounts.provider_id;
    `);
  })
  // Alter column type of aa_id in ua_aa_map
  .then(() => {
    return knex.schema.table('ua_aa_map', function(table) {
      table.bigInteger('aa_id').alter();
    });
  })
  // Add foreign key constraint to ua_aa_map
  .then(() => {
    return knex.schema.table('ua_aa_map', function(table) {
      table.foreign('aa_id', 'ua_aa_map_aa_id_foreign').references('id').inTable('ad_accounts');
    });
  })
  // Update aa_id in u_aa_map
  .then(() => {
    return knex.raw(`
      UPDATE u_aa_map
      SET aa_id = ad_accounts.id
      FROM ad_accounts
      WHERE u_aa_map.aa_id = ad_accounts.provider_id;
    `);
  })
  // Alter column type of aa_id in u_aa_map
  .then(() => {
    return knex.schema.table('u_aa_map', function(table) {
      table.bigInteger('aa_id').alter();
    });
  })
  // Add foreign key constraint to u_aa_map
  .then(() => {
    return knex.schema.table('u_aa_map', function(table) {
      table.foreign('aa_id', 'u_aa_map_aa_id_foreign').references('id').inTable('ad_accounts');
    });
  });
};

exports.down = function(knex) {
  // Reverse the addition of the unique constraint in ad_accounts
  return knex.schema.table('ad_accounts', function(table) {
      table.dropUnique('provider_id');
  })
  // Remove the u_aa_map table
  .then(() => {
      return knex.schema.dropTableIfExists('u_aa_map');
  })
  // Remove the ua_aa_map table
  .then(() => {
      return knex.schema.dropTableIfExists('ua_aa_map');
  });
};
