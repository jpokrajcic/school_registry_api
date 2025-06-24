import express, { type Express } from 'express';

export class ParsingConfig {
  // Request body parsing configuration
  static configureParsingMiddleware(app: Express): void {
    // Parse incoming requests with a Content-Type: application/json header
    app.use(express.json());
    // Parse incoming requests with a Content-Type: application/x-www-form-urlencoded header (form submissions)
    app.use(express.urlencoded({ extended: true }));
  }
}
