const axios = require("axios");
const { FB_API_URL } = require("../constants/facebook");

const getLongToken = async (accessToken) => {
  const longToken = await axios
    .get(
      `${FB_API_URL}oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.APP_ID}&client_secret=${process.env.APP_SECRET}&fb_exchange_token=${accessToken} `
    )
    .catch((err) => console.log("error fetching ltt ", err));
  return longToken.data.access_token;
};

module.exports = { getLongToken };
