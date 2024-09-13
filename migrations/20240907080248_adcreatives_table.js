exports.up = function(knex) {
  return knex.schema
    .dropTableIfExists('adcreatives')
    .then(() => {
      return knex.schema.createTable('adcreatives', function(table) {
        table.string('id').primary();
        table.string('ad_account_id');
        table.string('traffic_source');
        table.boolean('with_link').defaultTo(true);
        table.boolean('is_link_broken').defaultTo(false);

        table.text('raw_ad_link');

        table.text('ad_link_protocol');
        table.text('ad_link_base_url');
        table.text('ad_link_edge');
        table.text('ad_link_querystring');

        table.text('ad_destination_link_protocol');
        table.text('ad_destination_link_base_url');
        table.text('ad_destination_link_edge');
        table.text('ad_destination_link_querystring');
        table.timestamps(true, true);
      });
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('adcreatives')
    .then(() => {
      return knex.schema.createTable('adcreatives', function(table) {
        table.string('id', 40).primary();
        table.bigInteger('adaccountid').notNullable();
        table.string('name', 255).notNullable();
        table.text('description');
        table.string('media_type', 255).notNullable().defaultTo('link');
        table.text('media_url').notNullable();
        table.string('call_to_action', 255);
        table.string('page_id', 255);
        table.string('campaign_id', 255);
        table.string('adset_id', 255);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.integer('org_id');
      });
    });
};
