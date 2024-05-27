exports.up = function(knex) {
  return knex.schema.createTable('tiktok_ads', function(table) {
    table.text('id').primary();

    table.text('name').notNullable();
    table.text('created_time');
    table.text('start_time');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.text('traffic_source');
    table.text('provider_id');
    table.text('status');

    table.smallint('user_id');
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');

    table.smallint('account_id');
    table.foreign('account_id').references('id').inTable('user_accounts').onDelete('CASCADE');

    table.bigint('ad_account_id');
    table.foreign('ad_account_id').references('id').inTable('ad_accounts').onDelete('CASCADE');

    table.text('campaign_id');
    table.text('ad_group_id');
    table.text('network');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('tiktok_ads');
};
