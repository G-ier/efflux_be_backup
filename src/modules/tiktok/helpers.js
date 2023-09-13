const axios = require("axios");
const { TIKTOK_API_URL } = require("./constants");
const { TiktokLogger } = require("../../shared/lib/WinstonLogger");

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

module.exports = { getTikTokEndpointData };
