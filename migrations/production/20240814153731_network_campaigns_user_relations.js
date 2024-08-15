exports.up = function(knex) {
  return knex.schema.createTable('network_campaigns_user_relations', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.text('network_campaign_id').notNullable();  // Should match the type of 'id' in network_campaigns
    table.text('network').notNullable();  // Should match the type of 'network' in network_campaigns

    table.foreign('user_id').references('id').inTable('users');
    table.foreign(['network_campaign_id', 'network']).references(['id', 'network']).inTable('network_campaigns');

    // Composite unique constraint to ensure no duplicate relationships
    table.unique(['user_id', 'network_campaign_id', 'network']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('network_campaigns_user_relations');
};
