// Local application imports
const TokenService = require('../services/TokenService');

class TokenController {

  static async debug(admin_token, access_token) {
    return await TokenService.debug(admin_token, access_token);
  }

  static async getFacebookLongToken(req, res) {
    const { admin_token, access_token } = req.body;
    const longToken = await TokenService.getFacebookLongToken(access_token);

    res.json({
      long_token: longToken
    });
  }

  static async revokeToken(req, res) {
    const { admin_token, access_token, userId } = req.body; // assuming userId is also sent in the body
    const response = await TokenService.revokeFacebookToken(access_token, userId);

    res.json({
      response: response
    });
  }
}

module.exports = TokenController;
