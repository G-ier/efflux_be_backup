const { google } = require('googleapis');
const { tomorrowYMD } = require('../common/day');
const gmail = google.gmail({ version: "v1" });

const auth = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

async function listInboxFrom(accessToken, userId, fromEmail, date) {
  auth.setCredentials({
    access_token: accessToken
  });
  const dateQuery = date ? `after:${date} before:${tomorrowYMD(tomorrowYMD(date))}` : ''

  const { data } = await gmail.users.messages.list({
    userId,
    maxResults: 24,
    q: `from:${fromEmail} ${dateQuery}`,
    auth,
  });

  return data.messages || [];
}

async function getInbox(accessToken, userId, messageId) {
  auth.setCredentials({
    access_token: accessToken,
  });

  const { data } = await gmail.users.messages.get({
    id: messageId,
    userId,
    auth,
  });

  return data;
}

async function getInboxAttachment(accessToken, userId, messageId, attachmentId) {
  auth.setCredentials({
    access_token: accessToken
  });

  const { data } = await gmail.users.messages.attachments.get({
    auth,
    userId,
    messageId,
    id: attachmentId,
  });

  return data;
}

module.exports = {
  listInboxFrom,
  getInbox,
  getInboxAttachment,
}
