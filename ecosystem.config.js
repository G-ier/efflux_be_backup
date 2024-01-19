module.exports = {
  apps: [
    {
      name: 'efflux-be',
      script: 'node -r newrelic index.js',
      ignore_watch: ['./node_modules', './logs', './storage', 'newrelic_agent.log'],
      watch: true,
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: 'production',
        NEW_RELIC_APP_NAME: 'Efflux BE Production',
        NEW_RELIC_LICENSE_KEY: '05deb215fbdea6d15e080ae888415b2dFFFFNRAL',
        PORT: 80,
      },
      env_staging: {
        NODE_ENV: 'staging',
        NEW_RELIC_APP_NAME: 'Efflux BE Staging',
        NEW_RELIC_LICENSE_KEY: '05deb215fbdea6d15e080ae888415b2dFFFFNRAL',
        PORT: 80,
      },
    },
  ],
};
