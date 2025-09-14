module.exports = {
  apps: [
    {
      name: 'gtx-frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start --port 3002',
      cwd: '/root/gtx-frontend/gtx-frontend',
      env: {
        NODE_ENV: 'production',
        PORT: '3002',
      },
    },
  ],
};
