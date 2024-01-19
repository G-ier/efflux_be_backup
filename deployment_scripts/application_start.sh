#!/bin/bash

cd /var/www/efflux-backend

# get the environment from the environment variable passed from the CodePipeline
# this will be either staging, production, dus_staging or dus_production
ENV=$1

# if the environment variable is not set, default to production
if [ -z "$ENV" ]
then
    ENV=production
fi

pm2 stop ecosystem.config.js
pm2 start ecosystem.config.js --env $ENV

# Save the current process list so that it can be restored on reboot
pm2 save
