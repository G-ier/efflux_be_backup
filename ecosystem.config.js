module.exports = {
  apps: [
    {
      name: "efflux-be",
      script:
        "NEW_RELIC_APP_NAME=Efflux Backend NEW_RELIC_LICENSE_KEY=05deb215fbdea6d15e080ae888415b2dFFFFNRAL node -r newrelic index.js",
      ignore_watch: ["./node_modules", "./logs", "./storage"],
      watch: true,
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "development",
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 80,
      },
    },
  ],
};
