exports.up = function (knex) {
  return knex.schema.createTable("ad_queue_content", function (table) {
    table.increments("id").primary();
    table.integer("ad_queue_id").unsigned().notNullable();
    table.integer("content_id").unsigned().notNullable();
    table.foreign("ad_queue_id").references("id").inTable("ad_queue").onDelete("CASCADE");
    table.foreign("content_id").references("id").inTable("content").onDelete("CASCADE");
    // Additional fields like timestamps can be added here
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("ad_queue_content");
};
