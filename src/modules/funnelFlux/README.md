# FUNNELFLUX API MODULE

# Docs
https://docs.funnelflux.com/en/articles/1230715-api-documentation

# Overview
Entity/Repository/Service/Controller folder structure.
Funnel Flux is a platform used for tracking and optimizing through the usage of funnels(stages that potential clients go through before making a conversion or taking a desired action).
The data is regularly updated through api calls from the UpdateTrafficSegments method in FFDataService 4 times each hour through cron rules, while the getAdsetHourlyReport method allows the generation of reports using the data tracked by FunnelFlux. These reports are used by the Sedo network to generate provisional data for the current day.
Appart from that the AuthService refreshes the authentication token stored in the database.

# Data Structure
The data generated from the getAdsetHourlyReport method is used in the sedo repository and stored in the sedo table. 
The Auth token is stored in the funnel_flux_auth_token table.