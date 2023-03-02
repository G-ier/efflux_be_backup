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
  {
    network: '',
    timezone: SEDO_TIMEZONE,
    spreadsheetId:"1MR5t_Ei7y_C2Jr-sQC0KqZ7SK1vG9R8YqJLbEMW4uIA",
    sheetName: "Campaign Last 3days",
    sheetNameByAdset: "Adset Last 3days",
    traffic: '',
    fromDay: 4,
    toDay: 1,
  },
  {
    network: '',
    timezone: SEDO_TIMEZONE,
    spreadsheetId:"1MR5t_Ei7y_C2Jr-sQC0KqZ7SK1vG9R8YqJLbEMW4uIA",
    sheetName: "Campaign Last 7days",
    sheetNameByAdset: "Adset Last 7days",
    traffic: '',
    fromDay: 8,
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
