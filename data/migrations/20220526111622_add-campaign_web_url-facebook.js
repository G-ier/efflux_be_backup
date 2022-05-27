exports.up = function (knex) {
  return knex.schema.table('facebook', (tbl) => {
    tbl.string('campaign_web_url');
  });
};

exports.down = function (knex) {
  return knex.schema.table('facebook', (tbl) => {
    tbl.dropColumn('campaign_web_url');
  });
};
