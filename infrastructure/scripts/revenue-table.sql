CREATE TABLE revenue (
    visit_id String,
    campaign_id String,
    received_at DateTime,
    network String
    ad_id String,
    pixel_id Nullable(String),
    campaign_name String,
    network_campaign_id String, -- convert SEDO domain_id to network_campaign_id
    network_campaign_name String, -- convert SEDO domain_name to network_campaign_name
    adset_id String,
    adset_name String,
    revenue Float32,
    revenue_type String, -- 0 for final revenue, 1 for estimated revenue
)
engine = MergeTree
PRIMARY KEY (campaign_id, visit_id)
