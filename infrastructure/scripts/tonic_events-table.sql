CREATE TABLE tonic_events (
  event_id String,
  received_timestamp String,
  event_timestamp String,
  network_campaign_id String,
  network_campaign_name String,
  ad_type String,
  advertiser String,
  template String,
  pixel_id String,
  adset_id String,
  adset_name String,
  ad_id String,
  traffic_source String,
  session_id String,
  client_ip String,
  country String,
  region String,
  city String,
  external String,
  user_agent String,
  conversions Int32,
  revenue Float32,
  keyword_clicked String,
  event_type String
)
engine = MergeTree
PRIMARY KEY (event_timestamp, network_campaign_id, session_id)
