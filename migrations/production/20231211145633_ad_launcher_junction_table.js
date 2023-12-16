exports.up = function(knex) {
    return knex.schema.createTable('ad_media_queue_link', function(table) {
      table.increments('id').primary(); // Primary key for the junction table
      table.integer('media_id').unsigned().notNullable(); // Foreign key to media
      table.foreign('media_id').references('id').inTable('ad_launcher_media');
      
      table.integer('ad_launcher_queue_id').unsigned().notNullable(); // Foreign key to ad_launcher_queue
      table.foreign('ad_launcher_queue_id').references('id').inTable('ad_launcher_queue');
  
      // Optional: Timestamps
      table.timestamps(true, true);
  
      // Optional: Enforce unique pairs to prevent duplicate associations
      table.unique(['media_id', 'ad_launcher_queue_id']);
    });
};
  
exports.down = function(knex) {
    return knex.schema.dropTable('ad_media_queue_link');
};
