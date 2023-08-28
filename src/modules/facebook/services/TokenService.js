// Third party imports
const axios = require("axios");

// Local application imports
const { FB_API_URL } = require('../constants');

class TokenService {

  // This needs editing, it should simply check whether the token is valid or not and return for how many days it is valid for a single token.
  static async debug(admin_token, access_token, expire_warning_sent = 0, max_expire_warning_sent = 1) {

      const url = `${FB_API_URL}debug_token?access_token=${admin_token}&input_token=${access_token}`;
      let res = null;
      try {
          const response = await axios.get(url);
          res = response.data.data;
      } catch (err) {
          // ADD LOGGER
          console.info("ERROR GETTING OWNED AD ACCOUNTS", err.response?.data.error || err);
          return ["", false];
      }

      if (res.is_valid) {
        const diffTime = Math.abs(new Date() - new Date(res.expires_at * 1000));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        // ADD LOGGER
        console.log("Token expires in", diffDays, "days");
        // ADD A NOTIFICATION SYSTEM
        return ["", res.is_valid];

      } else {
        // ADD LOGGER
        console.log("Token is not valid");
        return ["", false];
      }
  }

  static async getFacebookLongToken(access_token) {
    await axios.get(`${FB_API_URL}oauth/access_token`, {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        fb_exchange_token: access_token,
      }
    }).then(({ data }) => {
      return data.access_token;
    }).catch(err => {
      // ADD LOGGER
      console.error("Error fetching facebook long token", err);
      return null;
    });

  }

  static async revokeFacebookToken(access_token, userId) {
    try {
      await axios.delete(`${FB_API_URL}${userId}/permissions`, {
        params: {
          access_token: access_token,
        }
      })
      return true;
    } catch (err) {
      // ADD LOGGER
      console.error('Error revoking facebook token', err);
      return false;
    }
  }

}

module.exports = TokenService;
