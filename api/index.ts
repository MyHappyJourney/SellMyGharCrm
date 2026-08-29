import type { IncomingMessage, ServerResponse } from 'http';
import { createExpressApp } from '../server/createApp';

const app = createExpressApp();

export default async function handler(req: any, res: any) {
  try {
    return app(req, res);
  } catch (error: any) {
    console.error('[Vercel Serverless Invocation Error]:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Vercel Serverless Function Invocation Failed',
        message: error?.message || String(error)
      });
    }
  }
}
