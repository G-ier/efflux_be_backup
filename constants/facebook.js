const FB_API_URL = "https://graph.facebook.com/v13.0/";

const adAccountFields = [
  'name',
  'amount_spent',
  'balance',
  'account_id',
  'spend_cap',
  'currency',
  'timezone_name',
  'timezone_offset_hours_utc',
];

const fieldsFilter = adAccountFields.join(',');

module.exports = {
  FB_API_URL,
  fieldsFilter,
};
