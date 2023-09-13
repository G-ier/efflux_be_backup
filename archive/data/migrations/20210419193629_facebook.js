exports.up = function (knex, Promise) {
  return knex.schema.createTable("facebook", (tbl) => {
    tbl.increments();
    tbl.string("date");
    tbl.string("campaign_name");
    tbl.string("campaign_id");
    tbl.string("ad_id");
    tbl.float("total_spent");
    tbl.integer("link_clicks");
    tbl.float("cpc");
    tbl.string("reporting_currency");
    tbl.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    tbl.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function (knex, Promise) {
  return knex.schema.dropTableIfExists("facebook");
};
