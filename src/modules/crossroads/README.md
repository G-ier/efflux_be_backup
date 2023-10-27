# CROSSROADS API MODULE

# Docs
https://crossroads.domainactive.com/docs

# Overview
Entity/Repository/Service/Controller folder structure.
Crossroads is an advertising network and as such provides tools to receive reporting and analytical data.Through cron jobs, CompositeController updates the data through crossroads' api every 15 minutes. In addition to that several tools that allow checking for domains and availability, creating campaigns and getting metadata are possible and implemented, but not in use or tested.

# Data Structure
The data is retrieved in two levels: Campaign Level and Ad hourly event aggregation level.
The event data is stored in the crossroads table, while the campaign level data in the crossroads_campaigns table.
Crossroads_campaings.id -> Foreign key to: Crossroads.campaign_id