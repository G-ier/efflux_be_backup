const {onUpdateTrigger} = require("../../knexfile");
exports.up = async function (knex) {
  await knex.schema.createTable("crossroads_campaigns", (tbl) => {
    tbl.bigInteger("id").unique();
    tbl.string("name");
    tbl.string("type");
    tbl.bigInteger("user_id").references('id').inTable('users');
    tbl.bigInteger("account_id").references('id').inTable('user_accounts');
    tbl.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    tbl.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });

  return knex.raw(onUpdateTrigger('crossroads_campaigns'));
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("crossroads_campaigns");
};
