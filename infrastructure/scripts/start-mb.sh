!#/bin/bash

sudo apt-get update
sudo apt-get install -y docker.io
sudo docker pull metabase/metabase:latest
cd ~/mb
curl -L -o plugins/ch.jar https://github.com/clickhouse/metabase-clickhouse-driver/releases/download/1.2.3/clickhouse.metabase-driver.jar
sudo docker run -d -p 3000:3000 \
  --mount type=bind,source=$PWD/plugins/ch.jar,destination=/plugins/clickhouse.jar \
  --name metabase metabase/metabase:latest