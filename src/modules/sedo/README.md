# SEDO API MODULE

# Docs
https://api.sedo.com/apidocs/v1/

# Overview
Entity/Repository/Service/Controller folder structure.
Crossroads is an advertising network and as such provides tools to receive reporting and analytical data. Through cronjobs InsightsController updates data every 15 min, however the state of this data is not final.This data is retrevied through the funnelFlux AdsetHourlyReport, processed and then inserted into the DB. The day after, through a different CRON rule, the final data is retrieved through SEDO's api. This data is final however lacking the means to be distributed hourly. Therefore using the non final data previously retrieved as a means to distribute the final data on an hourly level, the data is upserted into the DB.

# Data Structure
The data both final and non final is stored in the sedo table of PostgresSQL.
DataCompiler serves as a helper service for InsightsService and its role is to assign an estimated hourly distribution to the final data.