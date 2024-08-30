
exports.up = function(knex) {
  return knex.schema.createTable("ad_cards", (tbl) => {
    tbl.increments("id").primary();
    tbl.text("head_line");
    tbl.text("description");
    tbl.integer("ad_id").unsigned();
    tbl.foreign('ad_id').references('scrapped_ads.id');
  });
};

exports.down = function(knex) {
return knex.schema.dropTableIfExists("ad_cards");
};
