exports.up = function(knex) {
  return knex.schema.createTable('sedo_domain', (tbl) => {
    tbl.increments();
    tbl.string('date', 10);
    tbl.string('domain');
    tbl.integer('visitors');
    tbl.integer('clicks');
    tbl.float('earnings').defaultTo(0);
    tbl.float('epc').defaultTo(0);
    tbl.float('ctr').defaultTo(0);
    tbl.float('rpm').defaultTo(0);
    tbl.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    tbl.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('sedo_domain');
};
