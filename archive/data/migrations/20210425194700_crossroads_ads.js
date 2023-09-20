exports.up = function (knex, Promise) {
  return knex.schema.createTable("crossroads_ads", (tbl) => {
    tbl.increments();
    tbl.string("date");
    tbl.string("campaign_name");
    tbl.string("campaign_id");
    tbl.string("ad_id");
    tbl.float("total_revenue");
    tbl.integer("total_searches");
    tbl.integer("total_lander_visits");
    tbl.integer("total_revenue_clicks");
    tbl.integer("total_visitors");
    tbl.integer("total_tracked_visitors");
    tbl.string("hour_fetched");
    tbl.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    tbl.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function (knex, Promise) {
  return knex.schema.dropTableIfExists("crossroads_ads");
};
