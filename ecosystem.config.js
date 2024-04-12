module.exports = {
  apps: [
    {
      name: 'efflux-be',
      script: 'index.js',
      ignore_watch: ['./node_modules', './logs', './storage'],
      watch: false,
      instances: 'max',
      exec_mode: 'cluster',
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 80,
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 80,
      },
    },
  ],
};
