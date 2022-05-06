exports.up = function (knex, Promise) {
  return knex.schema.createTable("crossroads_user_accounts", (tbl) => {
    tbl
      .integer("account_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("crossroads_accounts")
      .onDelete("restrict");
    tbl
      .integer("user_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("restrict");
    tbl.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    tbl.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function (knex, Promise) {
  return knex.schema.dropTableIfExists("crossroads_user_accounts");
};
