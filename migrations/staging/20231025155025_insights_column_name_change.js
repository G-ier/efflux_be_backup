
exports.up = function(knex) {
  return knex.schema.table('insights', function (table) {
    //Rename column names
    table.renameColumn('fb_conversions', 'ts_conversions');
    table.renameColumn('cr_conversions', 'nw_conversions');
    table.renameColumn('cr_uniq_conversions', 'nw_uniq_conversions');

    //Set column defeault values
    table.integer('fb_conversions').defaultTo(0).alter();
    table.integer('cr_conversions').defaultTo(0).alter();
    table.integer('cr_uniq_conversions').defaultTo(0).alter();
  });
};

exports.down = function(knex) {
    return knex.schema.table('insights', function (table) {
        // Reverse the naming changes.
        table.renameColumn('ts_conversions', 'fb_conversions');
        table.renameColumn('nw_conversions', 'cr_conversions');
        table.renameColumn('nw_uniq_conversions', 'cr_uniq_conversions');

        //Reverse the default value application
        table.integer('ts_conversions').defaultTo(null).alter();
        table.integer('nw_conversions').defaultTo(null).alter();
        table.integer('nw_uniq_conversions').defaultTo(null).alter();
      });
};
