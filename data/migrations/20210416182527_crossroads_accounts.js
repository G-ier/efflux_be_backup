exports.up = function (knex, Promise) {
  return knex.schema.createTable("crossroads_accounts", (tbl) => {
    tbl.increments();
    tbl.string("name");
    tbl.string("api_key");
    tbl.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    tbl.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function (knex, Promise) {
  return knex.schema.dropTableIfExists("crossroads_accounts");
};
