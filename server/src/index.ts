import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config';

import authRoutes from './routes/authRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import customerRoutes from './routes/customerRoutes';
import segmentRoutes from './routes/segmentRoutes';
import transactionRoutes from './routes/transactionRoutes';
import invoiceRoutes from './routes/invoiceRoutes';
import subscriptionRoutes from './routes/subscriptionRoutes';
import reminderRoutes from './routes/reminderRoutes';
import actionCenterRoutes from './routes/actionCenterRoutes';
import aiAgentRoutes from './routes/aiAgentRoutes';
import webhookRoutes from './routes/webhookRoutes';
import auditLogRoutes from './routes/auditLogRoutes';
import demoRoutes from './routes/demoRoutes';

export const app = express();

app.use(
  cors({
    origin: config.clientUrl || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'PayPilot Revenue Operations API',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/segments', segmentRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/action-center', actionCenterRoutes);
app.use('/api/ai-agent', aiAgentRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/audit-log', auditLogRoutes);
app.use('/api/demo', demoRoutes);

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`🚀 PayPilot API server running on port ${config.port}`);
    console.log(`👉 Environment: ${config.nodeEnv}`);
    console.log(`🔗 PayPal Sandbox Endpoint: ${config.paypal.baseUrl}`);
  });
}

export default app;
