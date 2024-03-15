exports.up = function(knex) {
    return knex.schema.alterTable('bodis_domains', (table) => {
      table.integer('bodis_account_id').references('id').inTable('bodis_accounts');
    })
    .then(() => {
      return knex.schema.alterTable('bodis', (table) => {
        table.integer('bodis_account_id').references('id').inTable('bodis_accounts');
      });
    })
    .then(() => {
      return knex.schema.alterTable('bodis_raw_insights', (table) => {
        table.integer('bodis_account_id').references('id').inTable('bodis_accounts');
      });
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.alterTable('bodis_domains', (table) => {
      table.dropColumn('bodis_account_id');
    })
    .then(() => {
      return knex.schema.alterTable('bodis', (table) => {
        table.dropColumn('bodis_account_id');
      });
    })
    .then(() => {
      return knex.schema.alterTable('bodis_raw_insights', (table) => {
        table.dropColumn('bodis_account_id');
      });
    });
  };