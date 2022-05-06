exports.up = function(knex) {
  return knex.schema.createTable('cr_postback_events', (tbl) => {
    tbl.increments();
    tbl.string('date', 10);
    tbl.tinyint('hour', 23);
    tbl.string('event_timestamp');
    tbl.string('event_type');
    tbl.string('pixel_id');
    tbl.string('campaign_id');
    tbl.string('adset_id');
    tbl.string('ad_id');
    tbl.tinyint('step');
    tbl.string('searchterm');
    tbl.text('referrer_url');
    tbl.float('pb_value').defaultTo(0);
    tbl.string('city');
    tbl.string('country', 3);
    tbl.string('state', 2);
    tbl.string('zipcode', 6);
    tbl.enum("traffic_source", null, {
      useNative: true,
      existingType: true,
      enumName: "providers"
    }).notNullable().defaultTo("unknown");
    tbl.boolean('running_direct').defaultTo(false);
    tbl.string('fbclid');
    tbl.boolean('posted_to_fb').defaultTo(false);
    tbl.string('os');
    tbl.string('ip');
    tbl.string('device');
    tbl.string('browser');
    tbl.string('test_event_code');
    tbl.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    tbl.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('cr_postback_events');
};
