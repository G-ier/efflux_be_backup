exports.up = function(knex) {
  return knex.schema.createTable("bot_conversions", (tbl) => {
    tbl.increments();
    tbl.string('user_agent');
    tbl.string('ip');
    tbl.text('referrer_url');
    tbl.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    tbl.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists("bot_conversions");
};
