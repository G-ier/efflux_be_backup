# FACEBOOK API MODULE

# Docs
Graph-API(V17.0) general overview: (https://developers.facebook.com/docs/graph-api/overview)
Ad Campaign structure: (https://developers.facebook.com/docs/marketing-api/campaign-structure)
Pixel: (https://developers.facebook.com/docs/marketing-api/reference/ads-pixel/)

Ad Accounts: [Ad Accounts Endpoint!](https://developers.facebook.com/docs/marketing-api/business-asset-management/guides/ad-accounts)
Ad Creative: [Ad Creative Endpoint!](https://developers.facebook.com/docs/marketing-api/creative)
Ad Insight: [Ad Insight Endpoint!](https://developers.facebook.com/docs/marketing-api/reference/adgroup/insights)
AdSets: [AdSet Endpoint!](https://developers.facebook.com/docs/marketing-api/reference/ad-campaign)
Campaign: [Campaign Endpoint!](https://developers.facebook.com/docs/marketing-api/reference/ad-campaign-group)
Pixel: [Pixel Endpoint!](https://developers.facebook.com/docs/marketing-api/reference/ad-study-objective/adspixels/)
Token: [Token Endpoint!](https://developers.facebook.com/docs/graph-api/reference/v18.0/debug_token)

# Ad Launcher Endpoints
Ad Account Ad Campaigns  :   (https://developers.facebook.com/docs/marketing-api/reference/ad-account/campaigns/#Creating)
Ad Account Adsets        :   (https://developers.facebook.com/docs/marketing-api/reference/ad-account/adsets/#Creating)
Ad Account Ad Creative   :   (https://developers.facebook.com/docs/graph-api/reference/adaccount/adcreatives/#Creating)
Ad Account Ads           :   (https://developers.facebook.com/docs/marketing-api/reference/ad-account/ads/)


# Overview
This folder facilitates access to various levels of the Facebook ad structure, including data retrieval, formatting, and storage in a PostgreSQL database, along with CRUD operations.
In addition to that, it also handles user account management, data syncing, and a token expiration notification system.
The 'crons' folder is responsible for scheduling regular database updates using the 'compositeService.UpdateFacebookData' method.

# Data Structure
Entity/Repository/Service/Controller folder structure.
User accounts are the core of the system. The hierarchy of data is as follows: User acccounts contain Ad accounts, Ad accounts contain campaigns and pixels, campaigns contain adsets, adsets contain ads and ads contain Ad creatives. Ad insights can be on an ad, adset or campaign level.
DB connections:
    User account id -> Foreign key to: ad_accounts, campaigns, adsets, ads and pixels
    Ad account id -> Foreign key to: campaigns, adsets, ads
    Campaign id -> Foreign key to: adsets, ads
    Adsets id-> Foreign key to: ads
    Ad creative id -> Foreign key to: ads
    Ad insights -> Reference: campaign, adset and ad ids

# Potential Problems & things to look at
...

### Business Logic
    - Advantage+ campaigns doesn't require `placements` field to be passed into
    payload on adset creation. Facebook will optimize for placement in this case. Sending `daily_budget` on campaign creation payload will make the campaing Advantage+.