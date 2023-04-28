const axios = require('axios');

const SLACK_API_URL = ""
const sendSlackNotification = async (message) => {
  const { data } = await axios.post(SLACK_API_URL, message);
  return data;
};

module.exports = {
  sendSlackNotification,
};
