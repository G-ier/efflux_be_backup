#!/bin/bash

open -a Docker
wait 5
docker run -p 6379:6379 -it memcached | spacer
npm install
npm run server
