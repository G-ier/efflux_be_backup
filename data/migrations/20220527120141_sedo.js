exports.up = function(knex) {
  return knex.schema.createTable('sedo', (tbl) => {
    tbl.increments();
    tbl.string('date', 10);
    tbl.string('domain');
    tbl.integer('visitors');
    tbl.integer('clicks');
    tbl.float('earnings').defaultTo(0);    
    tbl.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    tbl.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('sedo');
};
