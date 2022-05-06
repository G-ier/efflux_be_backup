
exports.up = function(knex) {
  return knex.schema.table('campaigns', (tbl) => {
    tbl.string('strategy_id');
    tbl.string('daily_budget');
    tbl.string('lifetime_budget');
    tbl.string('created_time');
    tbl.string('start_time');
    tbl.string('stop_time');
    tbl.string('budget_remaining');
    tbl.string('updated_time');
  });
};

exports.down = function(knex) {
  return knex.schema.table('campaigns', (tbl) => {
    tbl.dropColumn('ad_strategy_id');
    tbl.dropColumn('daily_budget');
    tbl.dropColumn('lifetime_budget');
    tbl.dropColumn('created_time');
    tbl.dropColumn('start_time');
    tbl.dropColumn('stop_time');
    tbl.dropColumn('budget_remaining');
    tbl.dropColumn('updated_time');
  });
};
