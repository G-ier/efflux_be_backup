// Third party imports
const _                                               = require('lodash');
const { CronJob }                                     = require('cron');

// Local application imports
const EnvironmentVariablesManager                     = require('../../../shared/services/EnvironmentVariablesManager');
const { todayYMD, todayHH }                           = require('../../../shared/helpers/calendar');
const { api_vs_pb_mild_report }                       = require('../reports/api_vs_pb_report_milder')
const DatabaseRepository                              = require('../../../shared/lib/DatabaseRepository');
const InsightsService                                 = require('../../crossroads/services/InsightsService');
const { AnalysisLogger }                              = require('../../../shared/lib/WinstonLogger');
const database                                        = new DatabaseRepository();
const InsightsServiceInstance                         = new InsightsService();

const account =   {
  id: "account-1",
  key: "1a3c3ae4-2755-450d-ac24-8d10371910c5",
}

const TESTING_CAMPAIGN_IDS = EnvironmentVariablesManager.getEnvVariable('TESTING_CAMPAIGN_IDS');
const updatePbAnalysis = async (date, hour) => {

  const ParsedTestCampaignIds = TESTING_CAMPAIGN_IDS ? JSON.parse(TESTING_CAMPAIGN_IDS.replace(/'/g, '"')) : []
  if (!TESTING_CAMPAIGN_IDS || ParsedTestCampaignIds.length === 0) {
    AnalysisLogger.error("TESTING_CAMPAIGN_IDS environment variable is not set")
    throw new Error("TESTING_CAMPAIGN_IDS environment variable is not set")
  }

  // Update crossroads raw data
  AnalysisLogger.info(`Updating crossroads raw data for campaign ids: ${ParsedTestCampaignIds.join(",")}`)
  const saveAggregated = false; const saveRawData = true; const saveRawDataToFile = false; const campaignIdRestrictions = ParsedTestCampaignIds;
  try {
    await InsightsServiceInstance.updateCrossroadsData(account, date,
      saveAggregated, saveRawData, saveRawDataToFile, campaignIdRestrictions
    )
  } catch (error) {
    AnalysisLogger.error(`Error updating crossroads raw data for campaign ids: ${ParsedTestCampaignIds.join(",")}`)
    throw error
  }
  AnalysisLogger.info(`Finished updating crossroads raw data for campaign ids: ${ParsedTestCampaignIds.join(",")}`)

  // Generate report
  AnalysisLogger.info(`Generating report for campaign ids: ${ParsedTestCampaignIds.join(",")}`)
  const campaignIdRestrictionsForReport = `('${ParsedTestCampaignIds.join("','")}')`;
  const data = await api_vs_pb_mild_report(database, date, hour, campaignIdRestrictionsForReport);
  AnalysisLogger.info(`Finished generating report for campaign ids: ${ParsedTestCampaignIds.join(",")}`)

  // Chunk data into 500 rows per insert
  const dataChunks = _.chunk(data, 500);

  AnalysisLogger.info(`Inserting data into database for campaign ids: ${ParsedTestCampaignIds.join(",")}`)
  // Insert data into database
  for (const chunk of dataChunks) {
    await database.upsert('pb_analysis_data', chunk, "unique_identifier");
  }
  AnalysisLogger.info(`Postback Analysis Updated for: ${ParsedTestCampaignIds.join(",")}`)

}

const updatePbAnalysisRegular = new CronJob(
  '10 * * * *',
  (async () => {
    await updatePbAnalysis(todayYMD(), Number(todayHH()));
  }
));

const initializeTemporaryCron = () => {
  updatePbAnalysisRegular.start();
}

module.exports = initializeTemporaryCron

