// Local application imports
const AggregatesRepository              = require('../repositories/AggregatesRepository');
const GoogleSheetsService               = require('../../../shared/lib/GoogleSheetsService');
const { preferredOrder }                = require("../utils");
const {
  yesterdayYMD,
  someDaysAgoYMD,
  todayYMD
}                                       = require("../../../shared/helpers/calendar");
const {
  facebookRevealBotSheets,
  tiktokRevealBotSheets,
  tiktokFFSedoRevealbotSheets,
  facebookFFSedoRevealBotSheets,
  revealBotCampaignSheetColumn,
  revealBotAdsetSheetColumn
}                                       = require('../revealBotSheetConstants');
class RevealBotSheetService {

  constructor() {
    this.aggregatesRepository = new AggregatesRepository()
    this.googleSheetsService = GoogleSheetsService.getInstance();
  }

  async updateRevealBotSheet(sheets, trafficSource, network) {
    try {
      for (let i=0; i < sheets.length; i ++ ) {
        const startDate = someDaysAgoYMD(sheets[i].day - 1, null);
        const endDate = sheets[i].day == 1 ? todayYMD('UTC') : yesterdayYMD(null);
        for (let k = 0; k < 2; k ++) {
          const aggregateBy = k == 0 ? 'campaigns' : 'adsets';
          const columnsOrder = k == 0 ? revealBotCampaignSheetColumn : revealBotAdsetSheetColumn;
          const sheetName = k == 0 ? sheets[i].sheetName : sheets[i].sheetNameByAdset;
          console.log(sheetName);
          const revealBotSheetData = await this.aggregatesRepository.revealBotSheets(
            startDate, endDate, aggregateBy, trafficSource, network
          );
          const mappedData = this.mapRevealBotSheetValues(revealBotSheetData, columnsOrder, aggregateBy);
          await this.googleSheetsService.updateSpreadsheet(
            mappedData,
            { spreadsheetId: sheets[i].spreadsheetId, sheetName: sheetName},
            `!A3:AK5000`,
            false,
            false
          )
        }
      }
    } catch (err) {
      const errorLog = `${trafficSource} Revealbot Sheets.\nError on update: \n${err.toString()}`
      throw new Error(errorLog);
    }
  }

  async updateFacebookRevealBotSheets(network = null) {
    const trafficSource = 'facebook';
    let sheets = [
      {
        sheets: facebookRevealBotSheets,
        network: 'crossroads',
        disabled: process.env.DISABLE_FACEBOOK_CROSSROADS_REVEALBOT_SHEET_CRON === 'true'
      },
      {
        sheets: facebookFFSedoRevealBotSheets,
        network: 'sedo',
        disabled: process.env.DISABLE_FACEBOOK_SEDO_REVEALBOT_SHEET_CRON === 'true'
      }
    ]

    if (network) {
      const filteredSheets = sheets.filter(sheet => sheet.network === network)
      if (filteredSheets.length > 0) sheets = filteredSheets;
    }

    for (let i = 0; i < sheets.length; i ++) {
      if (!sheets[i].disabled) {
        await this.updateRevealBotSheet(sheets[i].sheets, trafficSource, sheets[i].network);
      };
    }
  }

  async updateTiktokRevealBotSheets(network = null) {
    const trafficSource = 'tiktok';
    let sheets = [
      {
        sheets: tiktokRevealBotSheets,
        network: 'crossroads',
        disabled: process.env.DISABLE_TIKTOK_CROSSROADS_REVEALBOT_SHEET_CRON === 'true'
      },
      {
        sheets: tiktokFFSedoRevealbotSheets,
        network: 'sedo',
        disabled: process.env.DISABLE_TIKTOK_SEDO_REVEALBOT_SHEET_CRON === 'true'
      }
    ]

    if (network) {
      const filteredSheets = sheets.filter(sheet => sheet.network === network)
      if (filteredSheets.length > 0) sheets = filteredSheets;
    }

    for (let i = 0; i < sheets.length; i ++) {
      if (!sheets[i].disabled) {
        await this.updateRevealBotSheet(sheets[i].sheets, trafficSource, sheets[i].network);
      };
    }

  }

  mapRevealBotSheetValues(data, columns, aggregateBy = 'campaigns') {

    const rows = data.map(item => {
      const result = {
        // Traffic Source
        ad_account_name: item.ad_account_name,
        time_zone: item.time_zone,
        entity_name: item.entity_name,
        status: item.status,
        daily_budget: item.daily_budget,
        launch_date: item.launch_date,
        amount_spent: item.amount_spent,
        impressions: item.impressions,
        link_clicks: item.link_clicks,
        cpc_link_click: item.cpc_link_click,
        clicks_all: item.clicks,
        cpc_all: item.cpc_all,
        cpm: item.cpm,
        ctr_fb: item.ctr_fb,
        results: item.results,
        cost_per_result: null,
        ts_last_update: item.ts_updated_at,

        // Network
        visitors: item.visitors,
        lander_visits: item.lander_visits,
        lander_searches: item.lander_searches,
        revenue_events: item.revenue_events,
        ctr_cr: item.ctr_cr,
        rpc: item.rpc,
        rpm: item.rpm,
        rpv: item.rpv,
        publisher_revenue: item.publisher_revenue,
        nw_last_update: item.nw_updated_at,

        // clickflare
        tr_visits: item.tr_visits,
        tr_searches: item.tr_searches,
        tr_conversions: item.tr_conversions,
        tr_ctr: item.tr_ctr,
        cf_last_update: item.created_at,

        // postback_events
        pb_lander_conversions: item.pb_lander_conversions,
        pb_serp_conversions: item.pb_serp_conversions,
        pb_conversions: item.pb_conversions,
        sheet_last_update: item.sheet_last_update,
      }

      // Change the delete on adset vs campaign
      aggregateBy === 'campaigns'
      ? result.campaign_id = item.campaign_id
      : result.adset_id = item.adset_id

      return preferredOrder(result, columns)
    })
    return {columns, rows}
  }

}

module.exports = RevealBotSheetService;
