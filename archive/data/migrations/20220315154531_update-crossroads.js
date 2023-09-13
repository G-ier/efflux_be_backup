exports.up = function(knex) {
  return knex.schema.table('crossroads', (tbl) => {
    tbl.bigInteger('crossroads_campaign_id').references('id').inTable('crossroads_campaigns')
    tbl.dropColumn('campaign_name');
    tbl.string('request_date');
  });
};

exports.down = function(knex) {
  return knex.schema.table('crossroads', (tbl) => {
    tbl.string('campaign_name');
    tbl.dropColumn('crossroads_campaign_id');
    tbl.dropColumn('request_date');
  });
};
