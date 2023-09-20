exports.up = function(knex) {
  return knex.schema.table('crossroads', (tbl) => {
    tbl.string('cr_camp_name');
  });
};

exports.down = function(knex) {
  return knex.schema.table('crossroads', (tbl) => {
    tbl.dropColumn('cr_camp_name')
  });
};
