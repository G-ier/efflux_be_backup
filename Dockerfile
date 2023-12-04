FROM node:21-alpine

RUN apk add python3 && apk add make && apk add g++

COPY package*.json ./
RUN npm ci --production

COPY . .

EXPOSE 5000
CMD npm start
