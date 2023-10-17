// Third party imports
const _                                           = require("lodash");

// Local imports
const { calculateAccumulated } = require("../../../shared/helpers/Utils")

/**
 * Distributes daily insights into corresponding hourly insights.
 *
 * This method associates each hourly insight with its matching daily insight based on unique identifiers.
 * If a match is found, it adjusts the revenue data in the hourly insight based on the proportion of conversions
 * for the current hour compared to the total conversions for the day. If no match is found, the hourly insight
 * remains unchanged.
 *
 * @param {Array} hourlyInsights - Array of hourly insights data.
 * @param {Array} dailyInsights - Array of daily insights data.
 * @param {Object|null} [logger=null] - Optional logger for debugging purposes.
 *
 * @returns {Array} An array of compiled hourly insights with adjusted revenue data.
 *
 * @example
 * const hourly = [...]; // your hourly insights data
 * const daily = [...]; // your daily insights data
 * const result = DataCompiler.distributeDtoH(hourly, daily);
 */
class DataCompiler {

  static distributeDtoH(hourlyInsights, dailyInsights, logger=null) {

    const dailyInsightsMap = _.keyBy(dailyInsights, 'unique_identifier');

    const telemetryObject = {
      matched: [],
      notMatched: [],
      dailyMatched: [],
      dailyMatchedRaw: []
    };

    // Group hourly insights by date_level_matching_identifier.
    const groupedHourlyInsights = _.groupBy(hourlyInsights, "date_level_matching_identifier")

    const distributeIntegerValues = (values, total) => {

      // Create a list of rounded values
      let roundedValues = values.map(value => Math.round(value));

      // Caluclate the rounding loss
      let diff = total - _.sum(roundedValues);

      // Randomly add or subtract to some of the values to make the totals match 100%
      return adjustRoundedValues(roundedValues, diff);
    }

    const adjustRoundedValues = (values, diff) => {

      const indices = [...Array(values.length).keys()];
      while (diff !== 0) {
          let index;
          if (diff > 0) {
              index = _.sample(indices);
              values[index]++;
              diff--;
          } else {
              index = _.sample(indices);
              if (values[index] > 0) {
                  values[index]--;
                  diff++;
              }
          }
      }
      return values;
    }

    // Apply the downscaling to every hourly group
    const compiledData = Object.entries(groupedHourlyInsights).map(([date_level_matching_identifier, hourlyGroup]) => {

      // Find corresponding daily insight to the group from the map above.
      const dailyCorrespondingInsight = dailyInsightsMap[date_level_matching_identifier];

      if (dailyCorrespondingInsight) {

        if (!telemetryObject['dailyMatched'].includes(dailyCorrespondingInsight.unique_identifier)){
          telemetryObject['dailyMatched'].push(dailyCorrespondingInsight.unique_identifier);
          telemetryObject['dailyMatchedRaw'].push(dailyCorrespondingInsight);
        }

        // Calculate total hours metrics
        const hourlyTotalsMetrics = hourlyGroup.reduce((acc, item) => {
          acc.visits += item.lander_visits
          acc.conversions += item.revenue_events
          acc.revenue += item.revenue
          return acc
        }, {
          visits: 0,
          conversions: 0,
          revenue: 0
        })
        const preRoundedConversions = [];
        const preRoundedVisitors = [];
        const finalRevenues = [];

        hourlyGroup.forEach(item => {
            finalRevenues.push(hourlyTotalsMetrics.revenue !== 0
                ? (item.revenue / hourlyTotalsMetrics.revenue) * dailyCorrespondingInsight.revenue
                : 0);

            preRoundedConversions.push(hourlyTotalsMetrics.conversions !== 0
                ? (item.revenue_events / hourlyTotalsMetrics.conversions) * dailyCorrespondingInsight.clicks
                : 0);

            preRoundedVisitors.push(hourlyTotalsMetrics.visits !== 0
                ? (item.lander_visits / hourlyTotalsMetrics.visits) * dailyCorrespondingInsight.visitors
                : 0);
        });

        const finalConversions = distributeIntegerValues(preRoundedConversions, dailyCorrespondingInsight.clicks);
        const finalVisitors = distributeIntegerValues(preRoundedVisitors, dailyCorrespondingInsight.visitors);

        // Update every hour
        const compiledHours = hourlyGroup.map((item, index) => {
          telemetryObject['matched'].push(item.campaign_id);
          delete item.date_level_matching_identifier;
          const finalHourData = {
              ...item,
              revenue: finalRevenues[index],
              revenue_events: finalConversions[index],
              lander_visits: finalVisitors[index],
              total_visitors: finalVisitors[index],
              total_visits: finalVisitors[index]
          };
          return finalHourData
        });
        return compiledHours

      } else {
        // Return items one by one, while deleting their date_level_matching_identifier
        return hourlyGroup.map((item) => {
          telemetryObject['notMatched'].push(item);
          delete item.date_level_matching_identifier
          return item
        })
      }
    });

    if (logger) {
      const unmatchedDaily = dailyInsights.filter(daily => !telemetryObject.dailyMatched.includes(daily.unique_identifier));
      logger.info("Number of Daily Data" , dailyInsights.length);
      logger.info("Number of Daily Data Matched" , telemetryObject.dailyMatched.length)
      logger.info("Matched Daily Data Revenue" , calculateAccumulated(telemetryObject.dailyMatchedRaw, ["revenue"]));
      logger.info("Number of Daily Data Unamtched" , unmatchedDaily.length)
      logger.info("Unmatched Daily Data Revenue" , calculateAccumulated(unmatchedDaily, ["revenue"]));

      const notMatched = new Set(telemetryObject.notMatched);
      logger.info("Number of Hourly Data", hourlyInsights.length);
      logger.info(`Number of Hourly Data Matched ${telemetryObject.matched.length}`);
      logger.info(`Matched Hourly Data Revenue ${calculateAccumulated(compiledData, ["revenue"])}`);
      logger.info(`Number of Unmatched Hourly Data ${notMatched.size}`);
      logger.info("Unmatched hourly Data Revenue" , calculateAccumulated(telemetryObject.notMatched, ["revenue"]));
    }
    return _.flatten(compiledData)
  }

}

module.exports = DataCompiler;
