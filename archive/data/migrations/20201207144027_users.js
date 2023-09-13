exports.up = function (knex, Promise) {
  return knex.schema.createTable("users", (tbl) => {
    tbl.increments();
    tbl.string("name");
    tbl.string("email");
    tbl.string("image_url");
    tbl.string("nickname");
    tbl.string("sub");
    tbl.string("acct_type");
    tbl.string("phone");
    tbl.string("token");
    tbl.string("fbID");
    tbl.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    tbl.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function (knex, Promise) {
  return knex.schema.dropTableIfExists("users");
};
