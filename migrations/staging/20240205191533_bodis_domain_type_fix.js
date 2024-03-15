exports.up = function (knex) {
    // Modify 'bodis' table
    return knex.schema.alterTable('bodis', (table) => {
      table.text('domain').alter();
    })
    // Modify 'bodis_raw_insights' table
    .then(() => {
      return knex.schema.alterTable('bodis_raw_insights', (table) => {
        table.text('domain').alter();
      });
    });
  };
  
  exports.down = function (knex) {
    // Rollback 'bodis' table
    return knex.schema.alterTable('bodis', (table) => {
      table.integer('domain').alter();
    })
    // Rollback 'bodis_raw_insights' table
    .then(() => {
      return knex.schema.alterTable('bodis_raw_insights', (table) => {
        table.integer('domain').alter();
      });
    });
  };