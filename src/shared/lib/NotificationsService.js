const axios = require('axios');
const { NotificationsLogger } = require('../lib/WinstonLogger');
const EnvironmentVariablesManager = require('../services/EnvironmentVariablesManager');

const serviceURL =
  EnvironmentVariablesManager.getEnvVariable('NOTIFICATIONS_SERVICE_URL') ||
  'https://notifications.efflux.com';

class NotificationsService {
  async notifyUser(title, message, userId) {
    const data = {
      user_id: userId,
      title: title,
      message: message,
    };

    console.log("Notifications Data", data)

    try {
      const response = await axios.post(serviceURL + '/create', data, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.debug(response.data);
      return response.data;
    } catch (error) {
      NotificationsLogger.error('Error sending notification: ', error.response.data);
      console.error('Error sending notification: ', error.response.data);
      throw error;
    }
  }
}

// Creating a singleton instance of NotificationsService
const notificationsServiceInstance = new NotificationsService();

// Exporting the singleton instance
module.exports = notificationsServiceInstance;
