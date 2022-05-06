exports.up = function (knex) {
  return knex.schema.table('fb_pixels', (tbl) => {
    tbl.string('name');
    tbl.integer('user_id').unsigned();
    tbl.foreign('user_id').references('id').inTable('users');
    tbl.integer('account_id').unsigned();
    tbl.foreign('account_id').references('id').inTable('user_accounts');
    tbl.string('business_id');
    tbl.string('business_name');
    tbl.boolean('is_unavailable');
    tbl.string('data_use_setting');
    tbl.string('last_fired_time');
    tbl.string('creation_time');
    tbl.unique('pixel_id');
  });
};

exports.down = function (knex) {
  return knex.schema.table('fb_pixels', (tbl) => {
    tbl.dropColumn('name');
    tbl.dropColumn('user_id');
    tbl.dropColumn('account_id');
    tbl.dropColumn('business_id');
    tbl.dropColumn('business_name');
    tbl.dropColumn('is_unavailable');
    tbl.dropColumn('data_use_setting');
    tbl.dropColumn('last_fired_time');
    tbl.dropColumn('creation_time');
    tbl.dropUnique('pixel_id');
  });
};
