/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .alterTable('u_aa_map', (table) => {
      // Drop existing foreign key constraints
      table.dropForeign('u_id');
      table.dropForeign('aa_id');

      // Re-add foreign key constraints with ON DELETE CASCADE
      table.foreign('u_id').references('users.id').onDelete('CASCADE');
      table.foreign('aa_id').references('ad_accounts.id').onDelete('CASCADE');
    })
    .alterTable('network_campaigns_user_relations', (table) => {
      // Drop existing foreign key constraints
      table.dropForeign(['network_campaign_id', 'network']);
      table.dropForeign('user_id');

      // Re-add foreign key constraints with ON DELETE CASCADE
      table.foreign(['network_campaign_id', 'network']).references(['id', 'network']).inTable('network_campaigns').onDelete('CASCADE');
      table.foreign('user_id').references('users.id').onDelete('CASCADE');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .alterTable('u_aa_map', (table) => {
      // Drop cascade foreign key constraints
      table.dropForeign('u_id');
      table.dropForeign('aa_id');

      // Re-add foreign key constraints without CASCADE
      table.foreign('u_id').references('users.id');
      table.foreign('aa_id').references('ad_accounts.id');
    })
    .alterTable('network_campaigns_user_relations', (table) => {
      // Drop cascade foreign key constraints
      table.dropForeign(['network_campaign_id', 'network']);
      table.dropForeign('user_id');

      // Re-add foreign key constraints without CASCADE
      table.foreign(['network_campaign_id', 'network']).references(['id', 'network']).inTable('network_campaigns');
      table.foreign('user_id').references('users.id');
    });
};
