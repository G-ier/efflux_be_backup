exports.up = function(knex) {
  return knex.schema.table('cr_conversions', (tbl) => {
    tbl.renameColumn('est_revenue', 'revenue');
    tbl.renameColumn('conversions', 'revenue_clicks');
    tbl.bigInteger('crossroads_campaign_id').references('id').inTable('crossroads_campaigns');
    tbl.string('request_date');
  });
};

exports.down = function(knex) {
  return knex.schema.table('cr_conversions', (tbl) => {
    tbl.renameColumn('revenue', 'est_revenue');
    tbl.renameColumn('revenue_clicks', 'conversions');
    tbl.dropColumn('crossroads_campaign_id');
    tbl.dropColumn('request_date');
  });
};
