exports.up = function(knex) {
  return knex.schema.alterTable('tonic_campaigns', (table) => {
    table.integer('tonic_account_id').references('id').inTable('tonic_accounts');
  })
  .then(() => {
    return knex.schema.alterTable('tonic', (table) => {
      table.integer('tonic_account_id').references('id').inTable('tonic_accounts');
    });
  })
  .then(() => {
    return knex.schema.alterTable('tonic_raw_insights', (table) => {
      table.integer('tonic_account_id').references('id').inTable('tonic_accounts');
    });
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('tonic_campaigns', (table) => {
    table.dropColumn('tonic_account_id');
  })
  .then(() => {
    return knex.schema.alterTable('tonic', (table) => {
      table.dropColumn('tonic_account_id');
    });
  })
  .then(() => {
    return knex.schema.alterTable('tonic_raw_insights', (table) => {
      table.dropColumn('tonic_account_id');
    });
  });
};
