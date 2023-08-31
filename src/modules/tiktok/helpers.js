const axios = require("axios");
const { TIKTOK_API_URL } = require("./constants");

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
  await Promise.all(
    requests.map(async ({ ad_account_id, promise }) => {
      try {
        const res = await promise;
        if (res.data.code === 0) {
          allData.push(...res.data.data.list);
        } else {
          console.log(`Error in fetching ${endpoint} data for account id ${ad_account_id}`);
        }
      } catch ({ response }) {
        console.log(`Error in fetching ${endpoint} data for account id ${ad_account_id}:`, response);
      }
    })
  );
  return allData;
};

module.exports = { getTikTokEndpointData };
