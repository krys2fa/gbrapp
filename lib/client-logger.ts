// lib/client-logger.ts
export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  CRITICAL = "CRITICAL",
}

export enum LogCategory {
  SYSTEM = "SYSTEM",
  AUTH = "AUTH",
  SMS = "SMS",
  EMAIL = "EMAIL",
  EXCHANGE_RATE = "EXCHANGE_RATE",
  USER_MANAGEMENT = "USER_MANAGEMENT",
  JOB_CARD = "JOB_CARD",
  ASSAY = "ASSAY",
  APPROVAL = "APPROVAL",
  NOTIFICATION = "NOTIFICATION",
  DATABASE = "DATABASE",
  API = "API",
  SECURITY = "SECURITY",
}

export interface ClientLogEntry {
  level: LogLevel;
  category: LogCategory;
  message: string;
  metadata?: Record<string, any>;
  timestamp?: Date;
  url?: string;
  userAgent?: string;
}

export class ClientLogger {
  private static instance: ClientLogger;
  private logEndpoint = '/api/logs';

  private constructor() {}

  static getInstance(): ClientLogger {
    if (!ClientLogger.instance) {
      ClientLogger.instance = new ClientLogger();
    }
    return ClientLogger.instance;
  }

  private async sendLog(entry: ClientLogEntry): Promise<void> {
    try {
      const logData = {
        ...entry,
        timestamp: entry.timestamp || new Date(),
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      };

      // Send to API endpoint
      await fetch(this.logEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logData),
      });
    } catch (error) {
      // Fallback to console only if API fails
      console.error('Failed to send log to server:', error);
    }
  }

  async debug(
    category: LogCategory,
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    console.log(`[DEBUG] [${category}] ${message}`, metadata || '');
    await this.sendLog({ level: LogLevel.DEBUG, category, message, metadata });
  }

  async info(
    category: LogCategory,
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    console.log(`[INFO] [${category}] ${message}`, metadata || '');
    await this.sendLog({ level: LogLevel.INFO, category, message, metadata });
  }

  async warn(
    category: LogCategory,
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    console.warn(`[WARN] [${category}] ${message}`, metadata || '');
    await this.sendLog({ level: LogLevel.WARN, category, message, metadata });
  }

  async error(
    category: LogCategory,
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    console.error(`[ERROR] [${category}] ${message}`, metadata || '');
    await this.sendLog({ level: LogLevel.ERROR, category, message, metadata });
  }

  async critical(
    category: LogCategory,
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    console.error(`[CRITICAL] [${category}] ${message}`, metadata || '');
    await this.sendLog({ level: LogLevel.CRITICAL, category, message, metadata });
  }
}