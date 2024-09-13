exports.up = function(knex) {
  return knex.schema
    .dropTableIfExists('ads')
    .dropTableIfExists('facebook_ads')
    .then(() => {
      return knex.schema.createTable('ads', function(table) {
        table.string('id').primary();
        table.string('name');
        table.string('ad_account_id');
        table.string('campaign_id');
        table.bigInteger('adset_id');
        table.string('status');
        table.string('traffic_source').defaultTo('unknown');
        table.string('creative_id');
        table.timestamps(true, true);
      });
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('ads')
    .then(() => {
      return knex.schema.createTable('ads', function(table) {
        table.increments('id').primary();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.string('ad_archive_id', 255);
        table.text('primary_text');
        table.string('publisher_identifier', 255);
        table.string('publisher_type', 255);
        table.string('publisher_name', 255);
        table.string('starting_date', 30);
        table.string('status', 255);
        table.jsonb('ad_cards');
        table.specificType('keywords', 'text[]');
        table.text('link');
        table.text('landing_url');
        table.string('network', 255);
        table.text('cta');
        table.integer('org_id');
      });
    })
};
