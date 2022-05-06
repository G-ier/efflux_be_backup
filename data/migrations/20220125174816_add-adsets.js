const { onUpdateTrigger } = require('../../knexfile')

exports.up = async function (knex) {
  await knex.schema.createTable("adsets", (tbl) => {
    tbl.increments();
    tbl.string("provider_id");
    tbl.string("name");
    tbl.string("campaign_id").references("id").inTable("campaigns");
    tbl.integer("ad_account_id").references("id").inTable("ad_accounts");
    tbl.integer("user_id").references("id").inTable("users");
    tbl.integer("account_id").references("id").inTable("user_accounts");
    tbl.enum("traffic_source", null, {
      useNative: true,
      existingType: true,
      enumName: "providers"
    }).notNullable().defaultTo("unknown");
    tbl.enum("network", null, {
      useNative: true,
      existingType: true,
      enumName: "networks"
    }).notNullable().defaultTo("unknown");
    tbl.string("status");
    tbl.string("daily_budget");
    tbl.string("lifetime_budget");
    tbl.string("budget_remaining");
    tbl.string("created_time");
    tbl.string("start_time");
    tbl.string("stop_time");
    tbl.string("updated_time");
    tbl.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    tbl.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  })

  return knex.raw(onUpdateTrigger('adsets'));
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("adsets");
};
