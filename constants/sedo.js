const SEDO_TIMEZONE = 'CET';
const SEDO_SHEET = [
  {
    network: '',
    timezone: SEDO_TIMEZONE,
    spreadsheetId:"1MR5t_Ei7y_C2Jr-sQC0KqZ7SK1vG9R8YqJLbEMW4uIA",
    sheetName: "Campaign Yesterday",
    sheetNameByAdset: "Adset Yesterday",
    traffic: '',
    fromDay: 2,
    toDay: 1,
  },
]
const SEDO_SHEET_VALUES = [
  'domain',
  'revenue',
  'visitors',
  'revenue_clicks',

]
module.exports = {
  SEDO_SHEET,
  SEDO_SHEET_VALUES
};
