#!/bin/bash

open -a Docker
wait 5
# run memcached container
docker run -p 11211:11211 --name memcached -d memcached:1.5.6 | spacer
npm install
npm run server
