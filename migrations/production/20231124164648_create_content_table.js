exports.up = function(knex) {
    return knex.schema.createTable('content', function(table) {
      table.increments('id').primary(); // Primary key
      table.string('type').notNullable(); // Content type
      table.text('url').notNullable(); // Content URL
      table.string('hash').notNullable().unique(); // Hash for uniqueness
      table.timestamp('created_at').defaultTo(knex.fn.now()); // Timestamp for creation
      table.timestamp('updated_at').defaultTo(knex.fn.now()); // Timestamp for last update
      // Foreign key column
      table.bigInteger('ad_account_id').unsigned(); // Assuming ad_account_id is a bigint in ad_accounts
      table.foreign('ad_account_id').references('id').inTable('ad_accounts');
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTable('content');
  };
  