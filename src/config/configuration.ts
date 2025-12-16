export default () => ({
  port: parseInt(process.env.PORT || '3000', 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    url: process.env.DATABASE_URL,
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10) || 6379,
  },

  crm: {
    baseUrl: process.env.CRM_API_BASE_URL,
    username: process.env.CRM_USERNAME,
    password: process.env.CRM_PASSWORD,
  },

  finance: {
    baseUrl: process.env.FINANCE_API_BASE_URL,
    username: process.env.FINANCE_USERNAME,
    password: process.env.FINANCE_PASSWORD,
  },

  webhook: {
    secret: process.env.WEBHOOK_SECRET,
    baseUrl: process.env.WEBHOOK_BASE_URL,
  },

  sync: {
    pollIntervalSeconds: parseInt(process.env.POLL_INTERVAL_SECONDS || '300', 10) || 300,
    maxRetryAttempts: parseInt(process.env.MAX_RETRY_ATTEMPTS || '3', 10) || 3,
    enableWebhooks: process.env.ENABLE_WEBHOOKS === 'true',
  },
});

