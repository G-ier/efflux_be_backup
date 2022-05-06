exports.up = function (knex) {
  return knex.schema.createTable("outbrain", (tbl) => {
    tbl.increments();
    tbl.string("campaign_id");
    tbl.string("campaign_name");
    tbl.string("section_id");
    tbl.string("section_name");
    tbl.float("total_spent");
    tbl.integer("link_clicks").defaultTo(0);
    tbl.integer("impressions").defaultTo(0);
    tbl.integer('conversions').defaultTo(0);
    tbl.string("reporting_currency");
    tbl.string("date");
    tbl.tinyint("hour");
    tbl.string("timestamp");
    tbl.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    tbl.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("outbrain");
};
