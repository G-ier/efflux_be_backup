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

    // Loop through each item in hourlyInsights
    const compiledData = hourlyInsights.map(hourlyInsight => {

        const dailyCorrespondingInsight = dailyInsightsMap[hourlyInsight.date_level_matching_identifier];

        // If there's a matching yesterday item
        if (dailyCorrespondingInsight) {

            telemetryObject['matched'].push(hourlyInsight.campaign_id);  // Store the campaign_id for matched records
            delete hourlyInsight.date_level_matching_identifier;
            if (!telemetryObject['dailyMatched'].includes(dailyCorrespondingInsight.unique_identifier)){
              telemetryObject['dailyMatched'].push(dailyCorrespondingInsight.unique_identifier);
              telemetryObject['dailyMatchedRaw'].push(dailyCorrespondingInsight);
            }

            const finalDailyConversionsForAggregation = dailyCorrespondingInsight.clicks;
            const currentAggregationConversions = hourlyInsight.revenue_events;

            // Calculate the proportion of conversions for the current hour compared to the total for the day
            const conversionProportion = finalDailyConversionsForAggregation !== 0
              ? currentAggregationConversions / finalDailyConversionsForAggregation
              : 0;

            // Distribute the revenue based on the conversion proportion
            const revenue = conversionProportion * dailyCorrespondingInsight.revenue;

            return {
                ...hourlyInsight,
                revenue: revenue,
            };

        } else {
            telemetryObject['notMatched'].push(hourlyInsight);
            delete hourlyInsight.date_level_matching_identifier;

            // If no matching yesterday item, return hourlyInsight as is
            return hourlyInsight;
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
      logger.info("Number of Hourly Data" , hourlyInsights.length);
      logger.info(`Number of Hourly Data Matched ${telemetryObject.matched.length}`);
      logger.info(`Matched Hourly Data Revenue ${calculateAccumulated(compiledData, ["revenue"])}`);
      logger.info(`Number of Unmatched Hourly Data ${notMatched.size}`);
      logger.info("Unmatched hourly Data Revenue" , calculateAccumulated(telemetryObject.notMatched, ["revenue"]));
    }

    return compiledData;
  }

}

module.exports = DataCompiler;
