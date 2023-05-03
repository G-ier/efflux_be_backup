const axios = require('axios');


const token = "xoxb-3534771044320-5197636119910-5haDnl6FYADYdnV4T55qPK5D"
const SLACK_API_URL = "https://hooks.slack.com/services/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"

const sendSlackNotification = async (message) => {
  const payload = {
    text: message
  }
  const data = await axios.post(
    SLACK_API_URL,
    payload
    );

  if (data.status === 200) {
    console.log("Slack notification sent successfully");
  } else {
    console.log("Slack notification failed");
  }

  return data;
};

module.exports = {
  sendSlackNotification,
};
