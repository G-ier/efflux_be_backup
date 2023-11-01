#!/bin/bash
cd /var/www/efflux-backend

NODE_PORT=5000
NODE_ENV=production
pm2 stop ecosystem.config.js
pm2 start ecosystem.config.js

# Save the current process list so that it can be restored on reboot
pm2 save
