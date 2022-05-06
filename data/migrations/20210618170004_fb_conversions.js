exports.up = function (knex) {
  return knex.schema.createTable("fb_conversions", (tbl) => {
    tbl.increments();
    tbl.string("date");
    tbl.string("pixel_id");
    tbl.string("fbclid", 5000);
    tbl.string("device");
    tbl.string("os");
    tbl.string("browser");
    tbl.string("ip");
    tbl.integer("event_time");
    tbl.string("event_name");
    tbl.string("traffic_source");
    tbl.string("campaign_id");
    tbl.string("ad_id");
    tbl.string("website");
    tbl.boolean("posted_to_fb");
    tbl.string("fbc", 5000);
    tbl.string("event_id");
    tbl.string("dt_value");
    tbl.text("referrer_url");
    tbl.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    tbl.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("fb_conversions");
};
