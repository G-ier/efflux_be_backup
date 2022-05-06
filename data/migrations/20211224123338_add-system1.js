exports.up = function(knex) {
  return knex.schema.createTable("system1", (tbl) => {
    tbl.increments();
    tbl.string("campaign_id");
    tbl.string('campaign_name');
    tbl.string("adset_id");
    tbl.string("ad_id");
    tbl.string("date");
    tbl.float("revenue");
    tbl.integer("searches");
    tbl.integer("clicks");
    tbl.integer("total_visitors");
    tbl.tinyint("hour");
    tbl.string("campaign");
    tbl.string("sub_id");
    tbl.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    tbl.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists("system1");
};
