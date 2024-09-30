const axios = require('axios');
const { EmailsLogger } = require('./WinstonLogger');
const EnvironmentVariablesManager = require('../services/EnvironmentVariablesManager');

const serviceURL =
  EnvironmentVariablesManager.getEnvVariable('EMAILS_SERVICE_URL') || 'https://emails.effluxboard.com';

class EmailsService {
  emailType = {
    WELCOME: 'welcome',
    INVITATION: 'invitation/new',
  };

  async sendWelcomeEmail(title, message, userId) {
    const data = {
      user_id: userId,
      title: title,
      message: message,
    };

    try {
      const response = await axios.post(serviceURL + '/welcome', data, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.debug(response.data);
      return response.data;
    } catch (error) {
      EmailsLogger.error('Error sending email: ', error.response.data);
      console.error('Error sending email: ', error.response.data);
      throw error;
    }
  }

  async sendInvitationEmail(email, firstName, organizationName, tempPassword) {
    const data = {
      to: email,
      firstName: firstName,
      organizationName,
      tempPassword: tempPassword,
    };

    try {
      const response = await axios.post(serviceURL + '/invitation/new', data, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.debug(response.data);
      console.debug(response.status);
      return response.data;
    } catch (error) {
      EmailsLogger.error('Error sending invitation email: ', error.response.data);
      console.error('Error sending invitation email: ', error.response.data);
      throw error;
    }
  }
}

module.exports = EmailsService;
