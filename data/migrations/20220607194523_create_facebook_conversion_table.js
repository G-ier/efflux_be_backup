exports.up = function (knex, Promise) {
  return knex.schema.createTable("facebook_conversion", (tbl) => {
    tbl.increments();
    tbl.string("date");    
    tbl.string("campaign_id");
    tbl.string("adset_id");
    tbl.string("ad_id");
    tbl.float("cost_per_conversion");
    tbl.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    tbl.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function (knex, Promise) {
  return knex.schema.dropTableIfExists("facebook_conversion");
};
