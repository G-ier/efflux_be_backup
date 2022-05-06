const tables = ['amg', 'crossroads', 'proper', 'system1', 'facebook', 'outbrain',
  'users', 'user_accounts', 'ad_accounts', 'campaigns', 'bot_conversions', 'cr_conversions',
  'crossroads_accounts', 'crossroads_ads', 'crossroads_user_accounts', 'fb_conversions',
  'fb_pixels', 'google_ads', 'user_campaigns', 's1_conversions', 'pixel_clicks']

exports.up = function(knex) {
  let result = ''
  tables.forEach((table) => {
    result += `
     CREATE TRIGGER updated_at BEFORE UPDATE
      ON ${table} FOR EACH ROW EXECUTE PROCEDURE
      updated_at_column();
    `
  })
  return knex.raw(result)
};

exports.down = function(knex) {
  let result = ''
  tables.forEach((table) => {
    result += `
     DROP TRIGGER IF EXISTS updated_at ON ${table};
    `
  })
  return knex.raw(result)
};
