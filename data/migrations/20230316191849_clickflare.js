exports.up = function(knex) {
  return knex.schema.createTable('clickflare', (tbl) => {
    tbl.increments();
    tbl.string('ad_id');
    tbl.string('adset_id');
    tbl.string('campaign_id');
    tbl.string('adset_name');
    tbl.string('campaign_name');
    tbl.string('traffic_source');
    tbl.string('date', 10);
    tbl.string('hour', 2);
    tbl.float('revenue').defaultTo(0);
    tbl.string('event_type', 1000);
    tbl.string('external_id', 1000);
    tbl.string('flow_id', 1000);
    tbl.string('click_id', 1000);
    tbl.string('click_time', 1000);
    tbl.string('connection_ip', 1000);
    tbl.text('connection_referrer');
    tbl.string('device_user_agent', 1000);
    tbl.string('visit_id', 1000);
    tbl.string('traffic_source_id', 1000);
    tbl.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    tbl.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('clickflare');
};
