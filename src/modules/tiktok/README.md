# Tik Tok API Module

# Docs
Ad Accounts entity/repository/service/controller: [Ad Accounts Endpoint!](https://business-api.tiktok.com/portal/docs?id=1738455259137026)
Campaigns entity/repository/service/controller: [Campaigns Endpoint!](https://business-api.tiktok.com/portal/docs?id=1739315828649986)
Ad Groups entity/repository/service/controller: [Ad Groups Endpoint!](https://business-api.tiktok.com/portal/docs?id=1739314558673922)
Ads entity/repository/service/controller: [Ads Endpoint!](https://business-api.tiktok.com/portal/docs?id=1735735588640770)
Ad Insights entity/repository/service/controller: [Ad Insights Report Endpoint!](https://business-api.tiktok.com/portal/docs?id=1738864915188737)
Events API : [Events API Endpoint!](https://business-api.tiktok.com/portal/docs?id=1739584864945154)

# Overview
...

# Data Structure
..

# Potential Problems & things to look at
Check the logs to ensure that the number of successful ad accounts fetching telemetry matches the number of fetched ad accounts from the API. If the numbers don't match, then it's failing to sync data for some ad accounts which causes discrepancy between the real data and the data Efflux becomes
aware of.

To handle the error above we've put a concurrency limitation to the core fetching function on helpers/getTikTokEndpointData.
The data for TikTok should be completely fetched for < 4 minutes in order to correctly be reflected in the aggregates which is the unified 
data model we use to present data to our end users. If we scale enough and the syncing takes more time than 4 minutes, then there will
be data delays. To cope with it we would have to either increase the concurrency limitation (while testing that we don't break it),
or to push the aggregation syncing as it's specified in the crons/aggrgates/rules of the aggregates module.
