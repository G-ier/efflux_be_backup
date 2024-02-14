CREATE TABLE rocket_events (
  key String,
  client_ip Nullable(String),
  received_at Nullable(String),
  cfn_distribution Nullable(String),
  device Nullable(String),
  country Nullable(String),
  region Nullable(String),
  city Nullable(String),
  timezone Nullable(String),
  waf_thinks Nullable(String)
)
engine = MergeTree
PRIMARY KEY (key)
