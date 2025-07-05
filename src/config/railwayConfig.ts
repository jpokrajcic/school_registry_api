import { type Express } from 'express';
import type { AppConfig } from '../types/general';

export class RailwayConfig {
  // Enforcing HTTPS in production environment event if request is not secure
  // This is useful for Railway deployments where the app is behind a reverse proxy
  // and the original request may not be secure, but the proxy handles SSL termination.
  // This middleware checks the 'x-forwarded-proto' header to determine if the request
  // is secure and redirects to HTTPS if it is not.
  // It should be used only in production environments.
  // In development, the app runs on localhost and does not require HTTPS redirection.
  static configureRailwayMiddleware(app: Express, config: AppConfig): void {
    if (config.environment === 'production') {
      app.use((req, res, next) => {
        if (req.header('x-forwarded-proto') !== 'https') {
          res.redirect(`https://${req.header('host')}${req.url}`);
        } else {
          next();
        }
      });
    }
  }
}
