/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
      .table('ad_accounts', function (table) {
          table.integer('org_id').unsigned().references('organizations.id');
      })
      .then(function () {
          return knex.schema.table('adcreatives', function (table) {
              table.integer('org_id').unsigned().references('organizations.id');
          });
      })
      .then(function () {
          return knex.schema.table('ads', function (table) {
              table.integer('org_id').unsigned().references('organizations.id');
          });
      })
      .then(function () {
          return knex.schema.table('adsets', function (table) {
              table.integer('org_id').unsigned().references('organizations.id');
          });
      })
      .then(function () {
          return knex.schema.table('creatives', function (table) {
              table.integer('org_id').unsigned().references('organizations.id');
          });
      })
      .then(function () {
          return knex.schema.table('insights', function (table) {
              table.integer('org_id').unsigned().references('organizations.id');
          });
      })
      .then(function () {
          return knex.schema.table('campaigns', function (table) {
              table.integer('org_id').unsigned().references('organizations.id');
          });
      });
};


/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
      .table('ad_accounts', function (table) {
          table.dropColumn('org_id');
      })
      .then(function () {
          return knex.schema.table('adcreatives', function (table) {
              table.dropColumn('org_id');
          });
      })
      .then(function () {
          return knex.schema.table('ads', function (table) {
              table.dropColumn('org_id');
          });
      })
      .then(function () {
          return knex.schema.table('adsets', function (table) {
              table.dropColumn('org_id');
          });
      })
      .then(function () {
          return knex.schema.table('creatives', function (table) {
              table.dropColumn('org_id');
          });
      })
      .then(function () {
          return knex.schema.table('insights', function (table) {
              table.dropColumn('org_id');
          });
      })
      .then(function () {
          return knex.schema.table('campaigns', function (table) {
              table.dropColumn('org_id');
          });
      });
};
