module.exports = {
  apps: [
    {
      name: "efflux-be",
      script: "node -r newrelic index.js",
      ignore_watch: ["./node_modules", "./logs", "./storage", "newrelic_agent.log"],
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
