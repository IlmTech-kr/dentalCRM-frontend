 module.exports = {
  apps: [
    {
      name: "dental-frontend",
      script: "npm",
      args: "run start",
      cwd: "/var/www/dental/frontend",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 9001,
      },
    },
  ],
};