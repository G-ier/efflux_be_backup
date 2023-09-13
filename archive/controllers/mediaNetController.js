// Local imports
const {
  getMediaNetData,
  insertMediaNetData,
  convertMediaNetDate,
  convertMediaNetQueryDate,
  parseXml,
} = require('../services/mediaNetService');
const { hourlySubUrl } = require('../constants/mediaNet');
const { sendSlackNotification } = require("../services/slackNotificationService");

/**
 * Processes the MediaNet data.
 *
 * This function takes in a list of MediaNet data, then processes and
 * formats the data to extract relevant information including date, hour,
 * campaign details, adset details, impressions, total clicks, and estimated
 * revenue.
 *
 * @param {Array} data - The MediaNet data to be processed. Each item in
 * the array should be an object with a property '$' containing the actual data.
 *
 * @return {Array} Returns an array of objects. Each object contains processed
 * information about the MediaNet data, including source_geo, date, hour,
 * campaign_id, campaign_name, adset_id, adset_name, ad_id, impressions,
 * total_clicks, and estimated_revenue.
*/
const processMediaNetData = (data) => {

  let print_telemetry = false;
  return data.map((item) => {
    const juiceData = item['$'];

    const [date, hour] = convertMediaNetDate(juiceData.date);
    const [originalDate, originalHour] = convertMediaNetDate(juiceData.date, timezone='CEST');
    const impressions = Number(juiceData.impressions);
    const totalClicks = Number(juiceData.totalClicks);
    const estimatedRevenue = parseFloat(juiceData.estimatedRevenue.replace('$', ''));
    const [sub1, sub2, sub3] = ['channelName', 'channelName2', 'channelName3'].map(name => juiceData[name]);

    if (print_telemetry) {
      console.log("--------------------------------------------------------")
      console.log(juiceData)
      console.log("Unformatted Date:", juiceData.date)
      console.log("Date:", date, hour)
      console.log("Original Date:", originalDate, originalHour)
    }

    const extractData = (sub, splitChar, defaultVal = ['', '']) =>
      !['default', `source_geo`, `campaignnamecampaignid`, `adsetnameadsetid`].includes(sub)
        ? sub.split(splitChar)
        : defaultVal;

    const [source_geo, ad_id] = extractData(sub1, /[A-Z]+|[a-z]+/g);
    const [campaign_name, campaign_id] = extractData(sub2, '-');
    const [adset_name, adset_id] = extractData(sub3, '-');

    if (print_telemetry) {
      console.log("Return object:", {
        source_geo,
        date,
        original_date: originalDate,
        hour,
        campaign_id:  campaign_id || '',
        campaign_name,
        adset_id: adset_id || '',
        adset_name,
        ad_id: ad_id || '',
        impressions,
        total_clicks: totalClicks,
        estimated_revenue: estimatedRevenue,
      })
      console.log("--------------------------------------------------------")
      i += 1
    }
    return {
      source_geo,
      date,
      original_date: originalDate,
      hour,
      campaign_id:  campaign_id || '',
      campaign_name,
      adset_id: adset_id || '',
      adset_name,
      ad_id: ad_id || '',
      impressions,
      total_clicks: totalClicks,
      estimated_revenue: estimatedRevenue,
    };
  });
}

// This is the function that will be initialized in the cron job
const updateMediaNetStats = async (unformattedDate) => {
  // unformattedDate is in YYYY-MM-DD format respresenting the date for which we will query from the API.

  try {
    // Converting the dates from YYYY-MM-DD to MM/DD/YYYY (no-timezone-changin done here)
    date = convertMediaNetQueryDate(unformattedDate)

    // Retrieving the hourly data from MediaNet API
    let data = await getMediaNetData(hourlySubUrl, date)

    // Parsing the XML data
    data = await parseXml(data)

    // Processing the tracked data
    const statistics = data.reportStats.statsData[0].reportItem
    const processedStatistics = processMediaNetData(statistics)

    // Inserting the data into the database
    await insertMediaNetData(processedStatistics, unformattedDate)

  } catch (err) {
    console.log(err)
    await sendSlackNotification("FOR THE DEV: MediaNet API Error", err)
  }

}

module.exports = {
  updateMediaNetStats,
}
