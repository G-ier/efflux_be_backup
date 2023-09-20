const _ = require('lodash');
const { CronJob } = require('cron');
const Rules = require('../constants/cron');
const {
  todayYMD, yesterdayYMD, todayYMDHM, todayHH,
} = require('../common/day');
const {
  getSheet, getSheetValues, updateSheetValues, clearSheet,
} = require('../services/spreadsheetService');
const { updateCampaigns } = require('../services/campaignsService');
const {
  convertFromRows,
  convertToRows,
  mergeWithCrossroads,
  getCrossroadsKeys,
  getAdveronixKeys,
  translateHead,
  convertToGDN,
} = require('../common/sheetHelper');
const db = require('../data/dbConfig');
const { crossroadsByDateAndCampaign, googleByDate } = require('../common/aggregations');
const { processCrossroads } = require('../common/processedFields');
const { removeByDateHour, add } = require('../common/models');
const PROVIDERS = require("../constants/providers");

const SHEET_ID = process.env.GDN_SPREADSHEET_ID;
const TODAY_SHEET_NAME = process.env.GDN_TODAY_SHEET_NAME;
const YESTERDAY_SHEET_NAME = process.env.GDN_YESTERDAY_SHEET_NAME

const disableCron = process.env.DISABLE_CRON === 'true'

const defaultGDNValues = {
  link_clicks: 0,
  total_spent: 0,
  impressions: 0,
  conversions: 0,
}

async function updateAdveronixSheet(day) {
  const { sheets } = await getSheet(SHEET_ID);
  // TODO remove this hook when google api enabled
  const account = await db('user_accounts').where('name', 'Adveronix').first();

  const SHEET_NAME = day === 'today' ? TODAY_SHEET_NAME : YESTERDAY_SHEET_NAME;

  let sheet;
  if (SHEET_NAME) {
    sheet = sheets.find((s) => s.properties.title === SHEET_NAME);
  } else if (day === 'today') {
    sheet = sheets.find((s) => s.properties.index === 0);
  }

  if (!sheet) {
    throw new Error('Specified GDN Sheet not found');
  }

  let date;
  let hour;
  if (day === 'today') {
    date = todayYMD();
    hour = todayHH();
  } else if (day === 'yesterday') {
    date = yesterdayYMD();
    hour = '24';
  }

  const range = sheet.properties.title;
  const { values } = await getSheetValues(SHEET_ID, {
    range,
  });

  const [head, ...entries] = values;

  const data = convertFromRows(head, entries);
  const gdn_items = convertToGDN(data);

  await removeByDateHour('google_ads', date, +hour);
  const { rows: currentGDN } = await googleByDate(date);


  const ad_accounts_data = _(gdn_items)
    .map('account_id')
    .uniq()
    .map((id) => ({
      provider: 'google',
      provider_id: id,
      name: id,
      status: 'active',
      account_id: account.id,
      user_id: account.user_id,
    }))
    .value();

  const ad_accounts = await db('ad_accounts')
    .insert(ad_accounts_data)
    .onConflict(['provider', 'provider_id', 'account_id'])
    .merge()
    .returning(['id', 'provider_id']);

  const adAccountsMap = _(ad_accounts).keyBy('provider_id').mapValues('id').value();

  await updateCampaigns(gdn_items, PROVIDERS.GOOGLE, adAccountsMap);

  gdn_items.forEach((item) => {
    const current = _.defaults(currentGDN.find((curItem) => curItem.campaign_id === item.campaign_id), defaultGDNValues);
    item.total_spent -= current.total_spent;
    item.link_clicks -= current.link_clicks;
    item.impressions -= current.impressions;
    item.conversions -= current.conversions;
    item.cpc = item.link_clicks ? Number((item.total_spent / item.link_clicks).toFixed(2)) : 0;
    item.date = date;
    item.hour = +hour;
    delete item.account_id
  });

  await add('google_ads', gdn_items);

  const campaignIds = data
    .map((item) => item.adv_campaign_id)
    .filter((id) => id);

  if (!campaignIds) return;

  const { rows } = await crossroadsByDateAndCampaign(campaignIds, date);

  const keys = getAdveronixKeys().concat(getCrossroadsKeys()).concat('updated_at');
  processCrossroads(rows);
  const merged = mergeWithCrossroads(data, rows);
  // attach updated_at
  merged.forEach((item) => {
    item.updated_at = todayYMDHM();
  });
  const updatedRows = convertToRows(keys, merged);
  const updatedHead = translateHead(keys);

  const body = {
    range,
    values: [updatedHead, ...updatedRows],
    majorDimension: 'ROWS',
  };

  await clearSheet(SHEET_ID, { range });
  const response = await updateSheetValues(SHEET_ID, body, {
    range,
  });

  console.info('****** GDN Spreadsheet updated ******');
  console.info(`Updated range:   ${response.updatedRange}`);
  console.info(`Updated rows:    ${response.updatedRows}`);
  console.info(`Updated columns: ${response.updatedColumns}`);
  console.info(`Updated cells:   ${response.updatedCells}`);
}

const updateGDNReportJob = new CronJob(
  Rules.GDN_REGULAR,
  updateAdveronixSheet.bind(null, 'today'),
);

const updateGDNMidnightReport = new CronJob(
  Rules.AFTER_MIDNIGHT,
  updateAdveronixSheet.bind(null, 'yesterday'),
);

const updateGDNMorningReport = new CronJob(
  Rules.GDN_DAILY,
  updateAdveronixSheet.bind(null, 'yesterday'),
)

function initializeGDNCron() {
  if (!SHEET_ID) {
    console.info('No spreadsheet id is specified. GDN Spreadsheet job not started');
    return;
  }
  if (!disableCron) {
    updateGDNReportJob.start();
    updateGDNMidnightReport.start();
    updateGDNMorningReport.start();
  }

  // DEBUG CODE uncomment to run immediately
  // updateAdveronixSheet('yesterday').catch(err => {
  //   console.error(err)
  // });
}

module.exports = { initializeGDNCron };
