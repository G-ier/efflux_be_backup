exports.up = function(knex) {
  return knex.schema.table('crossroads', (tbl) => {
    tbl.string('account');
  });
};

exports.down = function(knex) {
  return knex.schema.table('crossroads', (tbl) => {
    tbl.dropColumn('account');
  });
};
