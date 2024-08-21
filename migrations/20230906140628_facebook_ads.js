exports.up = function(knex) {
  return knex.schema.createTable('facebook_ads', function(table) {
    table.string('id', 40).primary();

    table.string('adset_id', 40);
    table.foreign('adset_id').references('provider_id').inTable('adsets').onDelete('CASCADE');;

    table.string('campaign_id', 40);
    table.foreign('campaign_id').references('id').inTable('campaigns').onDelete('CASCADE');

    table.bigInteger('account_id')
    table.foreign('account_id').references('id').inTable('user_accounts').onDelete('CASCADE');

    table.bigInteger('ad_account_id');
    table.foreign('ad_account_id').references('id').inTable('ad_accounts').onDelete('CASCADE');

    table.bigInteger('user_id');
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');

    table.string('creative_id', 40);
    table.foreign('creative_id').references('id').inTable('adcreatives').onDelete('CASCADE');

    table.string('name', 255);
    table.enu('status', ['ACTIVE', 'PAUSED', 'DELETED', 'ARCHIVED']);
    table.timestamp('ad_active_time');
    table.text('ad_review_feedback');
    table.timestamp('ad_schedule_end_time');
    table.timestamp('ad_schedule_start_time');
    table.integer('bid_amount');
    table.enu('configured_status', ['ACTIVE', 'PAUSED', 'DELETED', 'ARCHIVED']);
    table.string('conversion_domain', 255);
    table.timestamp('created_time');
    table.enu('effective_status', ['ACTIVE', 'PAUSED', 'DELETED', 'PENDING_REVIEW',
    'DISAPPROVED', 'PREAPPROVED', 'PENDING_BILLING_INFO', 'CAMPAIGN_PAUSED',
    'ARCHIVED', 'ADSET_PAUSED', 'ADSET_PAUSED', 'WITH_ISSUES', 'IN_PROCESS',
    ]);
    table.bigInteger('last_updated_by_app_id');
    table.text('preview_shareable_link');
    table.bigInteger('source_ad_id');
    table.text('tracking_specs');
    table.timestamp('updated_time');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('facebook_ads');
};
