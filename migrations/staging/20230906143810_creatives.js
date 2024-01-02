
exports.up = function(knex) {
  return knex.schema.createTable("creatives", (tbl) => {
    tbl.increments("id").primary();
    tbl.text("cdn_url");
    tbl.text("creative_url");
    tbl.string("creative_type", 10);
    tbl.integer("ad_card_id").unsigned();
    tbl.foreign('ad_card_id').references('ad_cards.id');
    tbl.specificType('tags', 'TEXT[]');
  });
};

exports.down = function(knex) {
return knex.schema.dropTableIfExists("creatives");
};
