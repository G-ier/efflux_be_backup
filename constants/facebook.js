const FB_API_URL = "https://graph.facebook.com/v15.0/";

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

const adAccountFieldsForTodaySpent = [
  'spent'
];

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

const fieldsFilter = adAccountFields.join(',');
const fieldsForTodaySpent = adAccountFieldsForTodaySpent.join(',');

module.exports = {
  FB_API_URL,
  fieldsFilter,
  fieldsForTodaySpent,
  delay
};
