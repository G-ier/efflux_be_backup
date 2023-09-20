exports.up = function (knex) {
  return knex.schema.createTable("fb_pixels", (tbl) => {
    tbl.increments();
    tbl.string("pixel_id");
    tbl.string("domain");
    tbl.string("token");
    tbl.string("bm");
    tbl.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    tbl.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("fb_pixels");
};
