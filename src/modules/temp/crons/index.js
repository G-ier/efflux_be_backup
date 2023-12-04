// Third party imports
const _                                               = require('lodash');
const { CronJob }                                     = require('cron');

// Local application imports
const EnvironmentVariablesManager                     = require('../../../shared/services/EnvironmentVariablesManager');
const { todayYMD, todayHH, todayM }                           = require('../../../shared/helpers/calendar');
const { api_vs_pb_report }                            = require('../reports/api_vs_pb_report')
const { api_vs_pb_mild_report }                       = require('../reports/api_vs_pb_report_milder')
const DatabaseRepository                              = require('../../../shared/lib/DatabaseRepository');
const { AnalysisLogger }                              = require('../../../shared/lib/WinstonLogger');
const database                                        = new DatabaseRepository();

const TESTING_CAMPAIGN_IDS = EnvironmentVariablesManager.getEnvVariable('TESTING_CAMPAIGN_IDS');
const updatePbAnalysis = async (date, hour, minute) => {

  const ParsedTestCampaignIds = TESTING_CAMPAIGN_IDS ? JSON.parse(TESTING_CAMPAIGN_IDS.replace(/'/g, '"')) : []
  if (!TESTING_CAMPAIGN_IDS || ParsedTestCampaignIds.length === 0) {
    AnalysisLogger.error("TESTING_CAMPAIGN_IDS environment variable is not set")
    throw new Error("TESTING_CAMPAIGN_IDS environment variable is not set")
  }

  // Generate report
  AnalysisLogger.info(`Generating report for campaign ids: ${ParsedTestCampaignIds.join(",")}`)
  const campaignIdRestrictionsForReport = `('${ParsedTestCampaignIds.join("','")}')`;
  const data = await api_vs_pb_report(database, date, hour, minute, campaignIdRestrictionsForReport);
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
  '4,19,34,49 * * * *',
  (async () => {
    await updatePbAnalysis(todayYMD(), Number(todayHH()), Number(todayM()));
  }
));

const initializeTemporaryCron = () => {
  updatePbAnalysisRegular.start();
}

module.exports = initializeTemporaryCron

