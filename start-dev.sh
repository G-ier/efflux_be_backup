#!/bin/bash

open -a Docker
wait 5
docker run -p 6379:6379 -it redis/redis-stack-server:latest | spacer &
npm install
npm run server
