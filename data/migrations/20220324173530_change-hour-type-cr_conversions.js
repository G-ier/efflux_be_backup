exports.up = function(knex) {
  return knex.schema.alterTable('cr_conversions', (tbl) => {
    tbl.tinyint("hour").alter();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('cr_conversions', (tbl) => {
    tbl.string("hour").alter();
  });
};
