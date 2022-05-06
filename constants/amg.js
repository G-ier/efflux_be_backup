const AMG_KEYMAP = {
  '': 'index',
  'Updated Date': 'updated_date',
  'Updated Time of Day': 'updated_time',
  'Client ID': 'client_id',
  'Platform': 'platform',
  'Channel': 'channel',
  'Clicks': 'clicks',
  'Clicks Spam': 'spam_clicks',
  'Coverage': 'coverage',
  'Cpc': 'cpc',
  'Net Revenue': 'revenue',
  'Ctr': 'ctr',
  'Impressions': 'impressions',
  'Impressions Spam': 'spam_impressions',
  'Matched Queries': 'matched_queries',
  'Queries': 'queries',
  'Queries Spam': 'spam_queries',
  'Rpm': 'rpm',
}

function integer(value) {
  const parsed = parseInt(value.replace(/^\D*/, ''), 10);
  return isNaN(parsed) ? 0 : parsed;
}

function float(value) {
  const parsed = parseFloat(value.replace(/^\D*/, ''));
  return isNaN(parsed) ? 0 : parsed;
}

const AMG_VALUE_MAP = {
  revenue: float,
  clicks: integer,
  spam_clicks: integer,
  queries: integer,
  matched_queries: integer,
  spam_queries: integer,
  impressions: integer,
  spam_impressions: integer,
  coverage: float,
  cpc: float,
  ctr: float,
  rpm: float
}

const AMG_DEFAULTS = {
  revenue: 0,
  clicks: 0,
  spam_clicks: 0,
  queries: 0,
  matched_queries: 0,
  spam_queries: 0,
  impressions: 0,
  spam_impressions: 0,
  coverage: 0,
}


module.exports = { AMG_KEYMAP, AMG_VALUE_MAP, AMG_DEFAULTS }
