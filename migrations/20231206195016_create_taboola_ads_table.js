exports.up = function (knex) {
    return knex.schema.createTable('taboola_ads', function (table) {
      table.bigIncrements('id').primary();
      table.text('title');
      table.text('description');
      table.text('status');
      table.text('url');
      table.text('thumbnail_url');
      table.integer('campaign_id');
      table.text('user_id');
      table.text('account_id');
      table.text('provider_id');
      // Timestamps for created_at and updated_at
      table.timestamps(true, true);
    });
  };

  exports.down = function (knex) {
    return knex.schema.dropTable('taboola_ads');
  };
