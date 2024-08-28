exports.up = async function (knex) {
  await knex.schema.alterTable('analytics', (table) => {
    // Drop the existing unique constraint
    table.dropUnique(['network', 'traffic_source', 'timeframe', 'adset_id'], 'unique_analytic_record');

    // Create a new unique constraint with the additional column 'nw_campaign_id'
    table.unique(['network', 'traffic_source', 'timeframe', 'adset_id', 'nw_campaign_id'], 'unique_analytic_record');
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('analytics', (table) => {
    // Drop the new unique constraint
    table.dropUnique(['network', 'traffic_source', 'timeframe', 'adset_id', 'nw_campaign_id'], 'unique_analytic_record');

    // Recreate the original unique constraint
    table.unique(['network', 'traffic_source', 'timeframe', 'adset_id'], 'unique_analytic_record');
  });
};
