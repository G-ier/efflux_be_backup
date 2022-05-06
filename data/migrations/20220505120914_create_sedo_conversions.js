exports.up = function (knex) {
    return knex.schema.createTable("sedo_conversions", (tbl) => {
      tbl.increments();
      tbl.string("date");
      tbl.float("amount");
      tbl.string("sub1");
      tbl.string("sub2");
      tbl.string("sub3");
      tbl.string("kw");
      tbl.string("position");
      tbl.string("url");
      tbl.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
      tbl.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
    });
  };
  
  exports.down = function (knex) {
    return knex.schema.dropTableIfExists("sedo_conversions");
  };
  