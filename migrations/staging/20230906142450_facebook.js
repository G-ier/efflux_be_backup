exports.up = function(knex) {
  return knex.schema.createTable('facebook', function(table) {
    table.increments('id').primary();
    table.string('date', 255);
    table.string('campaign_name', 255);
    table.string('campaign_id', 255);
    table.string('ad_id', 255);
    table.float('total_spent');
    table.integer('link_clicks');
    table.float('cpc');
    table.string('reporting_currency', 255);
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.fn.now())
    table.smallint('hour');
    table.integer('conversions').defaultTo(0);
    table.integer('impressions');
    table.string('adset_id', 255);
    table.string('ad_account_id', 255);
    table.string('campaign_web_url', 255);
    table.float('conversion_value');
    table.integer('lead');
    table.integer('clicks').defaultTo(0);
    table.jsonb('events').defaultTo('[]');
    table.string('unique_identifier', 40).unique('row_unique_identifier');

  }).then(() => {
    // Creating the Trigger
    return knex.raw(`
      CREATE TRIGGER updated_at
      BEFORE UPDATE ON facebook
      FOR EACH ROW
      EXECUTE FUNCTION updated_at_column();
    `);
  });
};

exports.down = function(knex) {
  // Drop the table
  return knex.schema.dropTable('facebook');
};
