const Adset = require("./Adset");
const {
  calculateCPA,
  calculateCPAROI,
  calculateCPC,
  calculateCTR,
  calculateEstRevenue,
  calculateProfitLoss,
  calculateROI,
  calculateRPC,
  calculateRPI,
  calculateRPM,
  convertToCurrencyValue,
  convertToPercent,
} = require("../calculations");
const { v4 } = require("uuid");

class Aggregates {
  constructor(data) {
    this.campaign_id = data.campaign_id;
    this.campaign_name = data.campaign_name;
    this.status = data.status;
    this.yesterday_spend = data.yesterday_spend;
    this.last_3_days_spend = data.last_3_days_spend;
    this.spend = data.spend;
    this.spend_plus_fee = data.spend_plus_fee;
    this.revenue = data.revenue;
    this.searches = data.searches;
    this.cr_conversions = data.cr_conversions;
    this.visitors = data.visitors;
    this.tracked_visitors = data.tracked_visitors;
    this.link_clicks = data.link_clicks;
    this.impressions = data.impressions;
    this.pb_conversions = data.pb_conversions;
    this.uniq_conversions = data.uniq_conversions;
    this.cost_per_purchase = data.cost_per_purchase;
    this.cost_per_lead = data.cost_per_lead;
    this.cost_per_complete_payment = data.cost_per_complete_payment;
    this.traffic_source_cost_per_result = data.traffic_source_cost_per_result;
    this.budget_level = data.budget_level;
    this.daily_budget = data.daily_budget;
    this.adsets = data.adsets.map((adsetData) => new Adset(adsetData));
  }
}

const processHour = (hour) => {
  if (hour === null || hour === undefined) {
    return "N/A";
  }
  const hh = `0${hour}`.split("").reverse().slice(0, 2).reverse().join("");
  return `${hh}:00`;
};

function prepareDataForTableView(data, totals = false) {
  if (!data) {
    return {};
  }
  const estRevenueAvg3d = calculateEstRevenue(data.pbConversions, data.pixelRevenueLast3d, data.pixelConversionsLast3d);
  const estRevenue = calculateEstRevenue(
    data.pbConversions,
    data.revenue,
    totals ? data.crConversions : data.crConversions,
  );

  return {
    dailyBudget: data.dailyBudget ? convertToCurrencyValue(data.dailyBudget / 100) : "--",
    yesterdaySpend: convertToCurrencyValue(data.yesterdaySpend),
    last3DaysSpend: convertToCurrencyValue(data.last3DaysSpend),
    costPerPurchase: convertToCurrencyValue(data.costPerPurchase),
    costPerLead: convertToCurrencyValue(data.costPerLead),
    costPerCompletePayment: convertToCurrencyValue(data.costPerCompletePayment),
    revenue: convertToCurrencyValue(data.revenue),
    spend: convertToCurrencyValue(data.spend),
    spendPlusFee: convertToCurrencyValue(data.spendPlusFee),
    pixelRevenue: convertToCurrencyValue(data.pixelRevenue),
    estRevenue: convertToCurrencyValue(estRevenue),
    estRevenueAvg3d: convertToCurrencyValue(estRevenueAvg3d),
    profitLoss: convertToCurrencyValue(calculateProfitLoss(data.revenue, data.spendPlusFee)),
    estProfitLoss: convertToCurrencyValue(calculateProfitLoss(estRevenue, data.spendPlusFee)),
    roi: convertToPercent(calculateROI(data.revenue, data.spendPlusFee)),
    estRoi: convertToPercent(calculateROI(estRevenue, data.spendPlusFee)),
    cpc: `${calculateCPC(data.spendPlusFee, data.linkClicks)}`,
    cpa: convertToCurrencyValue(calculateCPA(data.spendPlusFee, totals ? data.crConversions : data.crConversions)),
    liveCpa: convertToCurrencyValue(calculateCPA(data.spendPlusFee, data.pbConversions)),
    uniqCpa: convertToPercent(calculateCPA(data.spendPlusFee, data.pbUniqConversions)),
    ctr: convertToPercent(calculateCTR(totals ? data.crConversions : data.crConversions, data.trackedVisitors)),
    liveCtr: convertToPercent(calculateCTR(data.pbConversions, data.linkClicks)),
    fbCtr: convertToPercent(calculateCTR(data.linkClicks, data.impressions)),
    rpc: convertToCurrencyValue(calculateRPC(data.revenue, data.crConversions)),
    uniqRpc: `${calculateRPC(data.revenue, data.uniqConversions)}`,
    rpm: convertToPercent(calculateRPM(data.revenue, data.trackedVisitors)),
    cpaRoi: convertToPercent(
      calculateCPAROI(
        data.revenue,
        data.spendPlusFee,
        totals ? data.crConversions : data.crConversions,
        data.pbConversions,
      ),
    ),
    uniqCpaRoi: convertToPercent(
      calculateCPAROI(data.revenue, data.spendPlusFee, data.uniqConversions, data.pbUniqConversions),
    ),
    roiEstLast3d: convertToPercent(calculateROI(estRevenueAvg3d, data.spendPlusFee)),
    avgRpc: `${calculateRPC(data.pixelRevenue, data.pixelConversions)}`,
    uniqAvgRpc: `${calculateRPC(data.pixelRevenue, data.pixelUniqConversions)}`,
    uniqAvgCpaRoi: convertToPercent(
      calculateCPAROI(data.pixelRevenue, data.spendPlusFee, data.pixelUniqConversions, data.pbUniqConversions),
    ),
    rpi: `${calculateRPI(data.revenue, data.impressions)}`,
  };
}

function camelizeNestedKeys(dataObj) {
  return JSON.parse(
    JSON.stringify(dataObj).replace(/"\w+?(_|-|\s)\w+?":/g, (match) => {
      return match.replace(/(_|-|\s)(\w)/g, (_, __, char) => char.toUpperCase());
    }),
  );
}

const processData = (dataArray) => {
  if (!dataArray) return { items: [], totals: 0 };

  const parseRowData = (datum) => {
    const { yesterdaySpend, last3DaysSpend, costPerPurchase, costPerLead, costPerCompletePayment, budgetLevel } = datum;
    const name = datum.adsetName || datum.campaignName || datum.crCampaignName || datum.amgCampaignName || "N/A";
    const id = datum.adsetId || datum.campaignId || datum.adId || "N/A";
    return {
      key: v4(),
      name,
      id,
      budgetLevel,
      yesterdaySpend,
      last3DaysSpend,
      costPerLead,
      costPerCompletePayment,
      ...(datum.dates ? { dates: processData(datum.dates).items } : {}),
      networkLastUpdate: datum.networkLastUpdate || "--",
      fbLastUpdate: datum.fbLastUpdate || "--",
      date: datum.date || datum.date2 || "--",
      hour: processHour(datum.hour) || processHour(datum.hour2) || "",
      revenue: datum.revenue || 0,
      spend: datum.spend || 0,
      spendPlusFee: datum.spendPlusFee || 0,
      tsConversions: datum.tsConversions || 0,
      linkClicks: datum?.linkClicks || 0,
      trackedVisitors: datum?.trackedVisitors || 0,
      crConversions: datum?.crConversions || 0,
      pbConversions: datum?.pbConversions || 0,
      pbUniqConversions: datum?.pbUniqConversions || 0,
      uniqConversions: datum?.crUniqConversions || 0,
      pixelUniqConversions: datum?.pixelUniqConversions || 0,
      pixelConversions: datum?.pixelConversions || 0,
      impressions: datum?.impressions || 0,
      pbImpressions: datum?.pbImpressions || 0,
      searches: datum?.searches || 0,
      pbSearches: datum?.pbSearches || 0,
      status: datum.status,
      ...prepareDataForTableView(datum),
    };
  };

  const processed = dataArray.reduce(
    (acc, cur) => {
      const datum = camelizeNestedKeys(cur);
      const item = parseRowData(datum);
      item.adsets = datum.adsets?.map((adset) => {
        return parseRowData(adset);
      });

      acc.items.push(item);

      acc.totals.revenue += datum.revenue || 0;
      acc.totals.spend += datum.spend || 0;
      acc.totals.yesterdaySpend += datum.yesterdaySpend || 0;
      acc.totals.last3DaysSpend += datum.last3DaysSpend || 0;
      acc.totals.costPerPurchase += datum.costPerPurchase || 0;
      acc.totals.costPerLead += datum.costPerLead || 0;
      acc.totals.costPerCompletePayment += datum.costPerCompletePayment || 0;
      acc.totals.spendPlusFee += datum.spendPlusFee || 0;
      acc.totals.tsConversions += datum.tsConversions || 0;
      acc.totals.linkClicks += datum?.linkClicks || 0;
      acc.totals.trackedVisitors += datum?.trackedVisitors || 0;
      acc.totals.crConversions += datum?.crConversions || 0;
      acc.totals.uniqConversions += datum?.crUniqConversions || 0;
      acc.totals.pbConversions += datum?.pbConversions || 0;
      acc.totals.pbUniqConversions += datum?.pbUniqConversions || 0;
      acc.totals.pixelConversions += datum?.pixelConversions || 0;
      acc.totals.pixelRevenue += datum?.pixelRevenue || 0;
      acc.totals.pixelUniqConversions += datum?.pixelUniqConversions || 0;
      acc.totals.pixelRevenueLast3d += datum?.pixelRevenueLast3d || 0;
      acc.totals.pixelConversionsLast3d += datum?.pixelConversionsLast3d || 0;
      acc.totals.impressions += datum?.impressions || 0;
      acc.totals.pbImpressions += datum?.pbImpressions || 0;
      acc.totals.searches += datum?.searches || 0;
      acc.totals.pbSearches += datum?.pbSearches || 0;
      return acc;
    },
    {
      totals: {
        revenue: 0,
        spend: 0,
        yesterdaySpend: 0,
        last3DaysSpend: 0,
        costPerPurchase: 0,
        costPerLead: 0,
        costPerCompletePayment: 0,
        spendPlusFee: 0,
        tsConversions: 0,
        linkClicks: 0,
        trackedVisitors: 0,
        crConversions: 0,
        uniqConversions: 0,
        pbConversions: 0,
        pbUniqConversions: 0,
        pixelRevenue: 0,
        pixelConversions: 0,
        pixelUniqConversions: 0,
        searches: 0,
        pbSearches: 0,
        impressions: 0,
        pbImpressions: 0,
        pixelRevenueLast3d: 0,
        pixelConversionsLast3d: 0,
      },
      items: [],
    },
  );

  const { items, totals } = processed;

  const finalTotals = {
    ...totals,
    ...prepareDataForTableView(totals, true),
  };

  return { items, totals: finalTotals };
};

module.exports = { Aggregates, processData };
