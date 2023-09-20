const {onUpdateTrigger} = require("../../knexfile");
exports.up = async function (knex) {
  await knex.schema.createTable("crossroads_stats", (tbl) => {
    tbl.increments().primary();
    tbl.bigInteger("crossroads_campaign_id")
      .references('id')
      .inTable('crossroads_campaigns');
    tbl.string('date');
    tbl.tinyint('hour');
    tbl.float('revenue').defaultTo(0);
    tbl.integer('lander_searches').defaultTo(0);
    tbl.integer('lander_visitors').defaultTo(0);
    tbl.integer('total_visitors').defaultTo(0);
    tbl.integer('tracked_visitors').defaultTo(0);
    tbl.integer('revenue_clicks').defaultTo(0);
    tbl.string('request_date');
    tbl.enum("traffic_source", null, {
      useNative: true,
      existingType: true,
      enumName: "providers"
    }).notNullable().defaultTo("unknown");
    tbl.string('campaign_id');
    tbl.string('adset_id');
    tbl.string('pixel_id');
    tbl.string('ad_id');
    tbl.string('section_id');
    tbl.string('cid');
    tbl.string('city');
    tbl.string('country_code');
    tbl.string('gclid');
    tbl.string('fbclid');
    tbl.string('browser');
    tbl.string('platform');
    tbl.string('keyword');
    tbl.string('device_type');
    tbl.text('referrer');
    tbl.string('account');
    tbl.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    tbl.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });

  return knex.raw(onUpdateTrigger('crossroads_stats'));
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("crossroads_stats");
};
