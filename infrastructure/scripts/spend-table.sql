CREATE TABLE spend (
  campaign_id String,
  adset_id Nullable(String), -- Taboola doesn't have adset_id
  received_at DateTime, -- ex: 2021-01-01 00:00:00
  timezone String, -- ex: UTC, America/New_York, etc.
  timezone_offset Int32, -- ex: 0, -5, etc.
  campaign_name String,
  traffic_source String, -- Facebook, Tiktok, Google, etc.
  ad_id String,
  pixel_id Nullable(String),
  adset_id String,
  adset_name String,
  spend Float32,
)
engine = MergeTree
PRIMARY KEY (campaign_id)
