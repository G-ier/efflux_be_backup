exports.up = function(knex) {
    return knex.schema
      .createTable('media_folders', function(table) {
        table.increments('id').primary();
        table.integer('parent_id').unsigned().references('id').inTable('folders').onDelete('CASCADE');
        table.string('folder_name', 255).notNullable();
        table.integer("org_id").unsigned().references("id").inTable('organizations').onDelete('CASCADE');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
      })
  };
  
  exports.down = function(knex) {
    return knex.schema
      .dropTableIfExists('media_folders');
  };
  