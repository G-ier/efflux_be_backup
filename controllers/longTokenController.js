const { getLongToken } = require("../services/longTokenService");
const { updateLongToken } = require("../services/saveLongTokenService");
const { handleFBID } = require("../services/fbIDService");

const longTokenController = async (req, res, next) => {
  try {
    const accessToken = req.query.accessToken;
    const userId = req.query.id;
    const alias = req.query.alias;
    await handleFBID(userId, alias);
    const longToken = await getLongToken(accessToken);
    //logged to console to verify this works
    console.log("old token ", req.query.accessToken);
    console.log("new token ", longToken);
    await updateLongToken(userId, accessToken, longToken);
    return longToken;
  } catch (err) {
    return { err: err };
  }
};

module.exports = { longTokenController };
