CREATE TABLE insights (
    id SERIAL PRIMARY KEY,
    date VARCHAR(11),
    hour SMALLINT,
    campaign_id VARCHAR(30),
    campaign_name TEXT,
    adset_id VARCHAR(30),
    adset_name text,
    user_id INTEGER,
    ad_account_id INTEGER,
    revenue NUMERIC(10, 2),
    spend NUMERIC(10, 2),
    spend_plus_fee NUMERIC(10, 2),
    link_clicks INTEGER,
    fb_conversions INTEGER,
    cr_conversions INTEGER,
    cr_uniq_conversions INTEGER,
    pb_conversions INTEGER,
    searches INTEGER,
    lander_visits INTEGER,
    visitors INTEGER,
    tracked_visitors INTEGER,
    impressions INTEGER,
    traffic_source VARCHAR(30)
    unique_identifier VARCHAR(60)
);

CREATE TABLE finders (
    id SERIAL PRIMARY KEY,
    accounts JSON,
    profilename TEXT,
    status account_status,
    proxy_id INTEGER,
    FOREIGN KEY(proxy_id) REFERENCES proxies(id) ON DELETE SET NULL
);

CREATE TABLE column_presets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    presets TEXT[] NOT NULL,
    user_id INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
);
