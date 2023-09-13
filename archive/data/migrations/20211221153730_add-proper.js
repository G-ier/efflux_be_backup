exports.up = function(knex) {
  return knex.schema.createTable("proper", (tbl) => {
    tbl.increments();
    tbl.string("term");
    tbl.string("adset_id");
    tbl.string("campaign_id");
    tbl.string("date");
    tbl.float("revenue");
    tbl.integer("visitors");
    tbl.tinyint("hour");
    tbl.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    tbl.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists("proper");
};
