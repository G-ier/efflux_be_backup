// Standard library imports
const _ = require('lodash');

// Local application imports
const UserAccountService = require('./src/modules/facebook/services/UserAccountService');
const AdAccountService = require('./src/modules/facebook/services/AdAccountService');
const PixelsService = require('./src/modules/facebook/services/PixelsService');
const CampaignsService = require('./src/modules/facebook/services/CampaignsService');
const AdsetsService = require('./src/modules/facebook/services/AdsetsService');
const AdInsightsService = require('./src/modules/facebook/services/AdInsightsService');

const updateFacebookData = async () => {

  // Get fetching accounts from the database
  const account = await new UserAccountService().getFetchingAccount();
  const { token, user_id, id, provider_id } = account;

  // Construct the ad account service
  const adAccountService = new AdAccountService();
  // Update the ad accounts
  const updatedAdAccountIds = await adAccountService.syncAdAccounts(provider_id, user_id, id, token);
  // Fetch the updated ad accounts and map them by provider_id
  const updatedAdAccountsDataMap = _(await adAccountService.fetchAdAccountsFromDatabase(
    ['id', 'provider_id', 'user_id', 'account_id'],
    { provider_id: updatedAdAccountIds.map((id) => id.replace("act_", "")) }
  )).keyBy('provider_id').value();
  console.log("Done with updating ad accounts", updatedAdAccountIds.length);

  const pixelService = new PixelsService();
  const updatedPixelIds = await pixelService.syncPixels(
    token,
    updatedAdAccountIds,
    updatedAdAccountsDataMap
  )
  console.log("Done with updating pixels", updatedPixelIds.length);

  // Update the campaigns
  const campaignService = new CampaignsService();
  const updatedCampaignIds = await campaignService.syncCampaigns(
    token,
    updatedAdAccountIds,
    updatedAdAccountsDataMap
  )
  const campaignIdsObjects = await campaignService.fetchCampaignsFromDatabase(['id'])
  const campaignIds = campaignIdsObjects.map((campaign) => campaign.id);
  console.log("Done with updating campaigns", updatedCampaignIds.length);

  // Update the adsets
  const updatedAdsetIds = await new AdsetsService().syncAdsets(
    token,
    updatedAdAccountIds,
    updatedAdAccountsDataMap,
    campaignIds
  )
  console.log("Done with updating adsets", updatedAdsetIds.length);

  const adAccounts = await adAccountService.fetchAdAccountsFromDatabase(
    ["id", "name", "status", "provider", "provider_id", "network", "tz_name", "tz_offset"],
    {account_id: id}
  );
  const adAccountsIds = adAccounts.map(({ provider_id }) => `act_${provider_id}`);
  const insights = await new AdInsightsService().syncAdInsights(token, adAccountsIds, "2023-08-26");
  console.log("Done with updating insights", insights.length)

  console.log("Done with updating all facebook data")

}

updateFacebookData()
