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
  // Add unique constraint to ad_accounts
  .then(() => {
    return knex.schema.table('ad_accounts', function(table) {
      table.unique('provider_id');
    });
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
