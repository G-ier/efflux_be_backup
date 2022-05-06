# Efflux

## Getting Started

1. Install [node and npm](https://nodejs.org/en/download/)
1. Install project dependencies:
   ```bash
    cd /path/to/project
    npm install
   ```
1. Commands
  - Run app with hot reload:
    ```bash
    npm run server
    ```
  - Run app:
    ```bash
    npm run start
    ```
  - Run tests:
    ```bash
    npm run test
    ```
  - Run manual refresh of Crossroads data:
    ```bash
    npm run update:crossroads
    ```
  - Run manual refresh of Facebook data:
    ```bash
    npm run update:facebook
    ```
  - Run manual refresh of AMG data:
    ```bash
    npm run update:facebook
    ```
  - Run migrations:
    ```bash
    npm run migrate
    ```
  - Run rollback of last applied migration:
    ```bash
    npm run migrate:down
    ```
  - Create file of migration:
    ```bash
    npm run migrate:make *name of file*
    ```
  - Knex --help:
    ```bash
    npm run knex
    ```

## Testing

TBD

## CI/CD Pipeline

TBD

## Deployment
  ````bash
  docker build -t efflux-platform
  docker stop efflux-platform 
  docker rm efflux-platform
  docker run -p 5000:5000 -d --name efflux-platform --restart unless-stopped --env 172.17.0.1:-host.docker.internal efflux-platform
  ````
