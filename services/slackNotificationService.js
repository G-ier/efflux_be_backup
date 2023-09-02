const axios = require('axios');


const token = "xoxb-3534771044320-5197636119910-5haDnl6FYADYdnV4T55qPK5D"
const SLACK_API_URL = "https://hooks.slack.com/services/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"

async function getPublicIP() {
  try {
    const response = await axios.get('https://api.ipify.org?format=json');
    return response.data.ip;
  } catch (error) {
    console.error('Error fetching public IP:', error);
  }
}


const sendSlackNotification = async (message) => {
  const publicIp = await getPublicIP();
  const payload = {
    text: publicIp + message
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
