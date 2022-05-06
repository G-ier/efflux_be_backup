const _ = require('lodash');
const db = require('../data/dbConfig');
const { amgByDate } = require('../common/aggregations')
const { todayHH, dayYMD, dayYMDHM} = require('../common/day')
const redis = require('../services/redisService');
const {getGoogleAccessToken} = require('../services/oauthService');
const {listInboxFrom, getInbox, getInboxAttachment} = require('../services/gmailService');
const {convertFromAMGRows} = require('../common/sheetHelper');

const DefaultItem = {
  revenue: 0,
  clicks: 0,
  spam_clicks: 0,
  queries: 0,
  matched_queries: 0,
  spam_queries: 0,
  impressions: 0,
  spam_impressions: 0,
}

const DefaultPrevItem = {
  total_revenue: 0,
  total_clicks: 0,
  total_spam_clicks: 0,
  total_queries: 0,
  total_matched_queries: 0,
  total_spam_queries: 0,
  total_impressions: 0,
  total_spam_impressions: 0
}

async function updateAMGData(rawData, date) {
  const hour = Number(todayHH())
  const data = groupData(rawData);
  const channels = _(data).map('channel').value();
  await updateCampaigns(channels);
  const channelsMap = await retrieveCampaigns(channels);
  const remove_ids = Object.values(channelsMap).map((c) => c.id);
  const deleted = await db('amg').where({ date, hour }).whereIn('campaign_id', remove_ids).del();
  console.info('AMG Deleted rows: ', deleted);
  const { rows: prev } = await amgByDate(date);
  const items = processItems(data, prev, channelsMap);
  items.forEach((item) => {
    item.date = date;
    item.hour = hour;
  });

  const inserted = await db('amg').insert(items).returning('id');
  console.info(`AMG Updated. Inserted ${inserted.length ?? 0} rows`);
}

async function updateCampaigns(channels) {
  const unknown = await db('campaigns')
    .where((builder) => builder
      .where({ network: 'unknown' })
      .orWhereNull('network'))
    .andWhereRaw(`name LIKE '%/_intl%' ESCAPE '/'`);

  const setKnown = _(unknown).map((campaign) => {
    const match = campaign.name.match(/_(intl\d+)_/);
    if (!match) return null;
    const channel = match[1];
    if (!channels.includes(channel)) return null;
    return campaign.id;
  }).compact().value()

  if (setKnown.length) {
    await db('campaigns').update({ network: 'amg' }).whereIn('id', setKnown);
  }
}

async function retrieveCampaigns(channels) {
  const campaigns = await db('campaigns')
    .where({ network: 'amg' });

  return _(campaigns).map(({id, name}) => {
    const match = name.match(/_(intl\d+)_/);
    if (!match) return null;
    const channel = match[1];
    if (!channels.includes(channel)) return null;
    return [channel, {id, name}];
  }).compact().fromPairs().value();
}

function groupData(data) {
  return _(data)
    .groupBy('channel')
    .map((items, channel) => {
      return items.reduce((memo, item) => {
        memo.revenue += item.revenue;
        memo.clicks += item.clicks;
        memo.spam_clicks += item.spam_clicks;
        memo.queries += item.queries;
        memo.matched_queries += item.matched_queries;
        memo.spam_queries += item.spam_queries;
        memo.impressions += item.impressions;
        memo.spam_impressions += item.spam_impressions;
        return memo;
      }, { channel, ...DefaultItem })
    })
    .value();
}

function processItems(items, prevItems, channelsMap) {
  const prevMap = _.keyBy(prevItems, 'campaign_id');
  return _(items).map((item) => {
    const { id: campaign_id, name: campaign_name } = channelsMap[item.channel] ?? {};
    if (!campaign_id) return null;
    const prevItem = _.defaults(prevMap[campaign_id], DefaultPrevItem);
    return {
      campaign_id,
      campaign_name,
      revenue: item.revenue - prevItem.total_revenue,
      clicks: item.clicks - prevItem.total_clicks,
      spam_clicks: item.spam_clicks - prevItem.total_spam_clicks,
      queries: item.queries - prevItem.total_queries,
      matched_queries: item.matched_queries - prevItem.total_matched_queries,
      spam_queries: item.spam_queries - prevItem.total_spam_queries,
      impressions: item.impressions - prevItem.total_impressions,
      spam_impressions: item.spam_impressions - prevItem.total_spam_impressions,
    }
  }).compact().value();
}

async function getAMGData(date) {
  const account = await db('user_accounts').where({ name: 'AMG' }).first();
  const tokenKey = `GOOGLE_ACCESS_TOKEN_${account.provider_id}`
  let accessToken = await redis.get(tokenKey);
  if (!accessToken) {
    const { token, res: { data } } = await getGoogleAccessToken(account.token);
    const EX = Math.ceil((data.expiry_date - Date.now() - 5000) / 1000);
    await redis.set(tokenKey, token, { EX });
    accessToken = token;
  }

  let mail;
  const inboxes = await listInboxFrom(accessToken, account.provider_id, process.env.AMG_EMAIL, date);

  if(date) {
    const mails = await Promise.all(inboxes.map(_inbox => (
      getInbox(accessToken, account.provider_id, _inbox.id)
    )))
    mail = mails.find(item => dayYMD(Number(item.internalDate)) === date)
  }

  const inbox = inboxes[0]
  const mailData = date ? mail : await getInbox(accessToken, account.provider_id, inbox.id);

  // if (lastEmailId === mailData.id) {
  //   console.info('Email already handled. Skipping...');
  //   return;
  // }
  const emailDate = new Date(Number(mailData.internalDate));
  const resultDate = dayYMD(emailDate);
  const attachmentPart = mailData.payload?.parts.find((part) => part.body.attachmentId);

  if (!attachmentPart) return;
  const attachment = await getInboxAttachment(accessToken, account.provider_id, inbox.id, attachmentPart.body.attachmentId);
  const buffer = Buffer.from(attachment.data, 'base64');
  const csv = buffer.toString('utf-8');

  const [head, ...rows] = csv.trim().split('\n').map((row) => row.split(','));
  const amgData = convertFromAMGRows(head, rows);

  return { data: amgData, date: resultDate }
}

module.exports = {
  updateAMGData,
  getAMGData
}
