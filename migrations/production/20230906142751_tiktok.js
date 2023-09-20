exports.up = function(knex) {
  return knex.schema.createTable('tiktok', function(table) {
    table.increments('id').primary();
    table.string('date', 255);
    table.string('campaign_name', 255);
    table.string('campaign_id', 255);
    table.string('ad_id', 255);
    table.float('total_spent');
    table.integer('clicks').defaultTo(0);
    table.float('cpc');
    table.string('reporting_currency', 255);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.smallint('hour');
    table.integer('conversions').defaultTo(0);
    table.integer('impressions');
    table.string('adset_id', 255);
    table.string('ad_account_id', 255);
    table.float('cpm');
    table.float('ctr');
    table.string('unique_identifier', 255).unique('tiktok_insight_unique_identifier');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('tiktok');
};
