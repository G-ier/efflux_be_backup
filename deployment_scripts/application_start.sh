#!/bin/bash

cd /var/www/efflux-backend

pm2 stop ecosystem.config.js
pm2 start ecosystem.config.js --env production

# Save the current process list so that it can be restored on reboot
pm2 save
