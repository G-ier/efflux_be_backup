const axios = require("axios");
const { TIKTOK_API_URL } = require("./constants");
const { TiktokLogger } = require("../../shared/lib/WinstonLogger");
  // Create a mapping for status values
  const statusMapping = {
    ACTIVE: 'ENABLE',
    PAUSED: 'DISABLE'
  };

const getTikTokEndpointData = async (endpoint, access_token, ad_account_ids, additionalParams = {}) => {
  const url = `${TIKTOK_API_URL}/${endpoint}/get/?`;
  const headers = {
    "Access-Token": access_token,
  };

  const requests = ad_account_ids.map((ad_account_id) => {
    const params = new URLSearchParams({
      advertiser_id: ad_account_id,
      ...additionalParams,
    });
    return {
      ad_account_id,
      promise: axios.get(url + params.toString(), { headers }),
    };
  });

  const allData = [];
  const results = {sucess: [], failure: []}
  await Promise.all(
    requests.map(async ({ ad_account_id, promise }) => {
      try {
        const res = await promise;
        if (res.data.code === 0) {
          allData.push(...res.data.data.list);
          results.sucess.push(ad_account_id);
        } else {
          results.failure.push(ad_account_id);
        }
      } catch {
        results.failure.push(ad_account_id);
      }
    })
  );

  if (results.sucess.length === 0) throw new Error(`All ad accounts failed to fetch from ${endpoint}`);
  TiktokLogger.info(`Fetched ${allData.length} ${endpoint} from API`);
  TiktokLogger.info(`Ad Accounts ${endpoint} fetching telemetry: SUCCESS(${results.sucess.length}) | ERROR(${results.failure.length})`);
  return allData;
};

const updateTikTokEntity = async ({type, access_token, advertiser_id, updateParams, entityId, entityName}) => {
  let endpoint;
  const headers = {
    "Access-Token": access_token,
  };
  
  // Determine the specific ID parameter name based on the type
  const idParamName = type === 'campaign' ? 'campaign_id' : 'adgroup_id';
  // Initialize common params
  const commonParams = new URLSearchParams({
    advertiser_id,
  });
  
  // Function to send request to TikTok API
  const sendRequest = async (endpoint, params) => {
    const url = `${TIKTOK_API_URL}/${endpoint}/?`;
    try {
      const res = await axios.post(url + params.toString(), {}, { headers });
      if (res.data.code === 0) {
        TiktokLogger.info(`Successfully updated ${type} for entityId: ${entityId} at endpoint: ${endpoint}`);
        return res.data;
      } else {
        TiktokLogger.error(`Failed to update ${type} for entityId: ${entityId} at endpoint: ${endpoint}. Error Code: ${res.data.code}`);
        throw new Error(res.data.message);  // Assuming there's a message property with an error description
      }
    } catch (error) {
      TiktokLogger.error(`Exception occurred while updating ${type} for entityId: ${entityId} at endpoint: ${endpoint}. Error: ${error.message}`);
      throw error;
    }
  };
  
  let statusResponse, budgetResponse;
  
// Update status if provided
if (updateParams.status) {
  endpoint = type === 'campaign' ? 'campaign/status/update' : 'adgroup/status/update';
  const statusParams = new URLSearchParams(commonParams);
  
  // Prepare the entity IDs
  const entityIds = Array.isArray(entityId) ? entityId : [entityId];
  
  if(type === 'campaign') {
    statusParams.append("campaign_ids", JSON.stringify(entityIds));
  } else if(type === 'adset') {
    statusParams.append("adgroup_ids", JSON.stringify(entityIds));
  }
  
  statusParams.append('operation_status', updateParams.status);
  
  statusResponse = await sendRequest(endpoint, statusParams);
}
  
  // Update budget if provided
  if (updateParams.dailyBudget !== undefined || updateParams.budget !== undefined) {
    endpoint = type === 'campaign' ? 'campaign/update' : 'adgroup/update';
    const budgetParams = new URLSearchParams(commonParams);
    budgetParams.append('budget', updateParams.dailyBudget || updateParams.budget);
    budgetParams.append(idParamName, entityId)
    if (type === 'campaign' && entityName) {
      budgetParams.append('campaign_name', entityName);
    }
    budgetResponse = await sendRequest(endpoint, budgetParams);
  }
  return { statusResponse, budgetResponse };
};

module.exports = { getTikTokEndpointData, updateTikTokEntity, statusMapping };
