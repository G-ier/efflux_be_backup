CREATE TABLE rocket_events (
  org_id String,
  key String,
  querystring Nullable(String),
  client_ip Nullable(String),
  received_at Nullable(DateTime),
  cfn_distribution Nullable(String),
  device Nullable(String),
  country Nullable(String),
  region Nullable(String),
  city Nullable(String),
  timezone Nullable(String),
  waf_thinks Nullable(String)
)
engine = MergeTree
PRIMARY KEY (org_id, key)
