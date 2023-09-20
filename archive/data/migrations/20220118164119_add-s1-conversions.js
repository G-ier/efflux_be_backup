exports.up = function (knex) {
  return knex.schema.createTable("s1_conversions", (tbl) => {
    tbl.increments();
    tbl.string("date");
    tbl.string("fbclid", 5000);
    tbl.string("device");
    tbl.string("os");
    tbl.string("browser");
    tbl.string("ip");
    tbl.integer("event_time");
    tbl.string("event_name");
    tbl.string("event_id");
    tbl.string("traffic_source");
    tbl.string("campaign_id");
    tbl.string("ad_id");
    tbl.string("adset_id");
    tbl.boolean("posted_to_ts");
    tbl.string("fbc", 5000);
    tbl.text("referrer_url");
    tbl.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    tbl.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("s1_conversions");
};
