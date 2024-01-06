#!/bin/bash

docker run -p 6379:6379 -it redis/redis-stack-server:latest | spacer &
npm install
npm run server | spacer
