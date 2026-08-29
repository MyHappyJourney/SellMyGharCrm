import { createExpressApp } from '../server/createApp';

const app = createExpressApp();

// Vercel serverless function entrypoint
export default app;
