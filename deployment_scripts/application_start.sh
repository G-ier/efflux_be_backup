#!/bin/bash

cd /var/www/efflux-backend

# Use the right Newrelic config file
cp /var/www/efflux-backend/infrastructure/newrelic/efflux_$NEWRELIC_ENVIRONMENT.js /var/www/efflux-backend/newrelic.js

pm2 stop ecosystem.config.js
pm2 start ecosystem.config.js --env production

# Save the current process list so that it can be restored on reboot
pm2 save
