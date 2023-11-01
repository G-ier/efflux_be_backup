module.exports = {
  apps: [
    {
      name: "efflux-be",
      script: "./index.js",
      ignore_watch: ["./node_modules", "./logs", "./storage"],
      watch: true,
      instances: 2,
      exec_mode: "fork",
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "development",
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 5000,
      },
    },
  ],
};
