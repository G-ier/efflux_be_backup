
exports.up = function(knex) {
  return knex.schema.createTable("scrapped_ads", (tbl) => {
    tbl.increments("id").primary();
    tbl.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    tbl.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
    tbl.string("ad_archive_id");
    tbl.text("primary_text");
    tbl.string("publisher_identifier");
    tbl.string("publisher_type");
    tbl.string("publisher_name");
    tbl.string("starting_date", 30);
    tbl.string("status");
    tbl.specificType('keywords', 'TEXT[]');
    tbl.string("link");
    tbl.string("landing_url");
    tbl.string("network");
    tbl.string("cta");
  });
};

exports.down = function(knex) {
return knex.schema.dropTableIfExists("scrapped_ads");
};
