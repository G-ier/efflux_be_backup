// Third party imports
const _                                     = require('lodash');
const async                                 = require('async');
const axios                                 = require('axios');

// Local application imports
const { TIKTOK_API_URL }                    = require("./constants");
const { TiktokLogger }                      = require("../../shared/lib/WinstonLogger");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const CONCURRENCY_LIMIT = 5;
const getTikTokEndpointData = async (endpoint, access_token, ad_account_ids, additionalParams = {}) => {

  const url = `${TIKTOK_API_URL}/${endpoint}/get/?`;
  const headers = {
    "Access-Token": access_token,
  };

  const results = { success: [], error: [] };

  const allData = await async.mapLimit(ad_account_ids, CONCURRENCY_LIMIT, async (ad_account_id) => {
    const paramsObj = {
      advertiser_id: ad_account_id,
      ...additionalParams,
    };

    const params = new URLSearchParams(paramsObj);
    const response = await axios
      .get(url + params.toString(), { headers })
      .catch((err) => {
        results.error.push(ad_account_id);
        return {};
      });

    if (response?.data?.code === 0) {
      results.success.push(ad_account_id);
      await delay(1000);
      return response.data.data.list;
    } else {
      return [];
    }
  });

  if (results.success.length === 0) throw new Error(`All ad accounts failed to fetch from ${endpoint}`);
  TiktokLogger.info(`Fetched ${allData.flat().length} ${endpoint} from API`);
  TiktokLogger.info(`Ad Accounts ${endpoint} fetching telemetry: SUCCESS(${results.success.length}) | ERROR(${results.error.length})`);

  return _.flatten(allData);
};

const statusMapping = {
  ACTIVE: 'ENABLE',
  PAUSED: 'DISABLE'
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

const calculateAccumulated = (data, fields=['spend']) => {

  return data.reduce((acc, item) => {
    fields.forEach(field => {
      if (!acc[field]) acc[field] = 0
      acc[field] += item.metrics[field] ? parseFloat(item.metrics[field]) : 0
    })
    return acc
  }, {
    spend: 0
  })
}

module.exports = { getTikTokEndpointData, updateTikTokEntity, calculateAccumulated, statusMapping };
