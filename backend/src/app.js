import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/index.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import * as webhookController from './controllers/webhookController.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: config.env === 'development' ? true : process.env.CORS_ORIGIN?.split(',') || true,
      credentials: true,
    })
  );

  app.post(
    '/webhooks/stripe',
    express.raw({ type: 'application/json' }),
    webhookController.stripe
  );
  app.post(
    '/webhooks/razorpay',
    express.raw({ type: 'application/json' }),
    webhookController.razorpay
  );

  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (req, res) => {
    res.json({ ok: true, env: config.env });
  });

  app.use('/api', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
