module.exports = {
  apps: [
    {
      name: 'eva-backend',
      script: './backend/src/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,
      max_memory_restart: '1G',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      listen_timeout: 3000,
      kill_timeout: 5000,
      wait_ready: true,
      combine_logs: true,
      merge_logs: true
    },
    {
      name: 'eva-worker',
      script: './backend/src/worker.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      },
      error_file: './logs/worker-error.log',
      out_file: './logs/worker-out.log',
      log_file: './logs/worker-combined.log',
      time: true,
      max_memory_restart: '500M',
      autorestart: true,
      watch: false
    }
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: process.env.PRODUCTION_HOST,
      ref: 'origin/main',
      repo: 'git@github.com:YOUR_USERNAME/eva-mental-health-app.git',
      path: '/opt/eva-app',
      'pre-deploy': 'git fetch --all',
      'post-deploy': 'npm install --prefix backend && npm run migrate --prefix backend && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'mkdir -p /opt/eva-app',
      env: {
        NODE_ENV: 'production'
      }
    },
    staging: {
      user: 'deploy',
      host: process.env.STAGING_HOST,
      ref: 'origin/develop',
      repo: 'git@github.com:YOUR_USERNAME/eva-mental-health-app.git',
      path: '/opt/eva-app-staging',
      'post-deploy': 'npm install --prefix backend && npm run migrate --prefix backend && pm2 reload ecosystem.config.js --env staging',
      env: {
        NODE_ENV: 'staging'
      }
    }
  }
};