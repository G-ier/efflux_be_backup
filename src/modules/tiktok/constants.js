const TIKTOK_API_URL = "https://business-api.tiktok.com/open_api/v1.3";

const TIKTOK_CAMPAIGN_FIELDS = [
  "campaign_id",
  "campaign_name",
  "create_time",
  "modify_time",
  "operation_status",
  "advertiser_id",
  "budget",
];

const TIKTOK_AD_ACCOUNT_AVAILABLE_FIELDS = [
  "telephone_number",
  "contacter",
  "currency",
  "cellphone_number",
  "timezone",
  "advertiser_id",
  "role",
  "company",
  "status",
  "description",
  "rejection_reason",
  "address",
  "name",
  "language",
  "industry",
  "license_no",
  "email",
  "license_url",
  "country",
  "balance",
  "create_time",
  "display_timezone",
  "owner_bc_id",
];

const TIKTOK_AD_FIELDS = [
  "campaign_id",
  "advertiser_id",
  "adgroup_id",
  "ad_id",
  "ad_name",
  "operation_status",
  "create_time",
  "modify_time",
];

const TIKTOK_ADSET_AVAILABLE_FIELDS = [
  "campaign_id",
  "adgroup_name",
  "adgroup_id",
  "create_time",
  "modify_time",
  "operation_status",
  "advertiser_id",
  "budget",
];

const TIKTOK_INSIGHTS_ADDITIONAL_PARAMS = {
  report_type: "BASIC",
  dimensions: JSON.stringify(["ad_id", "stat_time_hour"]),
  data_level: "AUCTION_AD",
  metrics: JSON.stringify([
    "spend",
    "currency",
    "campaign_id",
    "campaign_name",
    "adgroup_id",
    "adgroup_name",
    "ad_name",
    "impressions",
    "cpm",
    "clicks",
    "cpc",
    "ctr",
    "conversion",
    "campaign_budget",
    "budget"
  ]),
  filtering: JSON.stringify([{ field_name: "ad_status", filter_type: "IN", filter_value: '["STATUS_ALL"]' }]),
  query_mode: "CHUNK",
};

const TIKTOK_APP_ID = "7241448674398584833";
const TIKTOK_APP_SECRET = "c071f3fddeff10c8cc39539d4ac3e44a639c7a50";
const TIKTOK_AUTH_CODE = "977ba1f9721a21e0d1d55f2e644a37fd5c353d74";
const FETCHING_USER_ACCOUNT_ID = 31;

const availableStatuses = ["ACTIVE", "PAUSED", "DELETED", "ARCHIVED"];
const TIKTOK_CAMPAIGN_FIELDS_FILTER = JSON.stringify(TIKTOK_CAMPAIGN_FIELDS);
const adAccountFieldsForTodaySpent = ["spent"];
const fieldsForTodaySpent = adAccountFieldsForTodaySpent.join(",");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = {
  TIKTOK_API_URL,
  TIKTOK_CAMPAIGN_FIELDS,
  fieldsForTodaySpent,
  delay,
  TIKTOK_CAMPAIGN_FIELDS_FILTER,
  availableStatuses,
  TIKTOK_AD_FIELDS,
  TIKTOK_INSIGHTS_ADDITIONAL_PARAMS,
  TIKTOK_AD_ACCOUNT_AVAILABLE_FIELDS,
  TIKTOK_ADSET_AVAILABLE_FIELDS,
  TIKTOK_APP_ID,
  TIKTOK_APP_SECRET,
  TIKTOK_AUTH_CODE,
  FETCHING_USER_ACCOUNT_ID
};
