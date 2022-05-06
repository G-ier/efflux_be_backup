const _ = require('lodash');
const {PROPER_MIRROR, PROPER_LABELS} = require('../constants/proper');
const properService = require('../services/properService');
const {updatePR_Spreadsheet} = require('./spreadsheetController');
const {getAdCampaignIds} = require('../services/facebookService');

async function addProperData(rawData) {
  let data = JSON.parse(rawData.replace(/"\s+|\s+"/g, '"'));
  const adsetIds = data.map(item => item[PROPER_LABELS.adset_id]);
  const campaignIds = await getAdCampaignIds(adsetIds);
  data = data.map(item => {
    item = _.mapKeys(item, (value, key) => {
      return PROPER_MIRROR[key];
    });
    const [date, hour] = item.dateHour.split(' ');
    return {
      date,
      term: item.term,
      adset_id: item.adset_id,
      campaign_id: campaignIds[item.adset_id]?.campaign_id ?? null,
      revenue: parseFloat(item.revenue.replace('$', '')),
      visitors: parseFloat(item.visitors),
      hour: hour[1],
    };
  });

  await properService.add(data, adsetIds);

  // await updatePR_Spreadsheet()
}

module.exports = {
  addProperData
};
