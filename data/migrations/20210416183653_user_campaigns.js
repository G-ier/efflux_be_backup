exports.up = function (knex, Promise) {
  return knex.schema.createTable("user_campaigns", (tbl) => {
    tbl
      .integer("user_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("restrict");
    tbl
      .integer("crossroads_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("crossroads")
      .onDelete("restrict");
    tbl.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    tbl.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function (knex, Promise) {
  return knex.schema.dropTableIfExists("user_campaigns");
};
