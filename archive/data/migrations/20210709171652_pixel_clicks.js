exports.up = function (knex) {
  return knex.schema.createTable("pixel_clicks", (tbl) => {
    tbl.increments();
    tbl.string("pixel_id");
    tbl.string("fbclid", 5000);
    tbl.string("event_time");
    tbl.string("event_name");
    tbl.string("traffic_source");
    tbl.string("campaign_id");
    tbl.string("ad_id");
    tbl.string("website");
    tbl.string("fbc", 5000);
    tbl.string("event_id");
    tbl.text("referrer_url");
    tbl.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    tbl.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("pixel_clicks");
};
