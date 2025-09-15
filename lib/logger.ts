// lib/logger.ts
import fs from "fs/promises";
import path from "path";
import { prisma } from "@/app/lib/prisma";

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

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  category: LogCategory;
  message: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  requestId?: string;
}

export class Logger {
  private static instance: Logger;
  private logDirectory: string;
  private maxFileSize: number = 10 * 1024 * 1024; // 10MB
  private maxFiles: number = 30; // Keep 30 log files
  private enableConsole: boolean = true;
  private enableFile: boolean = true;
  private enableDatabase: boolean = true;

  private constructor() {
    this.logDirectory = path.join(process.cwd(), "logs");
    this.ensureLogDirectory();
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private async ensureLogDirectory(): Promise<void> {
    try {
      await fs.access(this.logDirectory);
    } catch {
      await fs.mkdir(this.logDirectory, { recursive: true });
    }
  }

  private formatLogMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const user = entry.userId
      ? `[${entry.userName || "Unknown"}:${entry.userRole || "N/A"}]`
      : "[SYSTEM]";
    const entity =
      entry.entityType && entry.entityId
        ? `[${entry.entityType}:${entry.entityId}]`
        : "";

    return `${timestamp} [${entry.level}] [${
      entry.category
    }] ${user} ${entity} ${entry.message}${
      entry.metadata ? ` | Metadata: ${JSON.stringify(entry.metadata)}` : ""
    }`;
  }

  private async writeToFile(entry: LogEntry): Promise<void> {
    if (!this.enableFile) return;

    try {
      const date = entry.timestamp.toISOString().split("T")[0];
      const filename = `app-${date}.log`;
      const filepath = path.join(this.logDirectory, filename);

      const logMessage = this.formatLogMessage(entry) + "\n";

      // Check file size and rotate if necessary
      try {
        const stats = await fs.stat(filepath);
        if (stats.size > this.maxFileSize) {
          await this.rotateLogFile(filepath);
        }
      } catch {
        // File doesn't exist, which is fine
      }

      await fs.appendFile(filepath, logMessage);
    } catch (error) {
      console.error("Failed to write to log file:", error);
    }
  }

  private async rotateLogFile(filepath: string): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const rotatedPath = filepath.replace(".log", `-${timestamp}.log`);
      await fs.rename(filepath, rotatedPath);

      // Clean up old log files
      await this.cleanupOldLogs();
    } catch (error) {
      console.error("Failed to rotate log file:", error);
    }
  }

  private async cleanupOldLogs(): Promise<void> {
    try {
      const files = await fs.readdir(this.logDirectory);
      const logFiles = files
        .filter((file) => file.endsWith(".log"))
        .map((file) => ({
          name: file,
          path: path.join(this.logDirectory, file),
        }));

      if (logFiles.length > this.maxFiles) {
        // Sort by modification time and delete oldest files
        const filesWithStats = await Promise.all(
          logFiles.map(async (file) => ({
            ...file,
            stats: await fs.stat(file.path),
          }))
        );

        filesWithStats
          .sort((a, b) => a.stats.mtime.getTime() - b.stats.mtime.getTime())
          .slice(0, filesWithStats.length - this.maxFiles)
          .forEach(async (file) => {
            await fs.unlink(file.path);
          });
      }
    } catch (error) {
      console.error("Failed to cleanup old logs:", error);
    }
  }

  private async writeToDatabase(entry: LogEntry): Promise<void> {
    if (!this.enableDatabase) return;

    try {
      await prisma.systemLog.create({
        data: {
          timestamp: entry.timestamp,
          level: entry.level,
          category: entry.category,
          message: entry.message,
          userId: entry.userId || null,
          userName: entry.userName || null,
          userRole: entry.userRole || null,
          entityType: entry.entityType || null,
          entityId: entry.entityId || null,
          metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
          ipAddress: entry.ipAddress || null,
          userAgent: entry.userAgent || null,
          sessionId: entry.sessionId || null,
          requestId: entry.requestId || null,
        },
      });
    } catch (error) {
      console.error("Failed to write to database log:", error);
    }
  }

  async log(entry: Omit<LogEntry, "timestamp">): Promise<void> {
    const fullEntry: LogEntry = {
      ...entry,
      timestamp: new Date(),
    };

    // Console logging
    if (this.enableConsole) {
      const formattedMessage = this.formatLogMessage(fullEntry);

      switch (entry.level) {
        case LogLevel.DEBUG:
          console.debug(formattedMessage);
          break;
        case LogLevel.INFO:
          console.info(formattedMessage);
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage);
          break;
        case LogLevel.ERROR:
        case LogLevel.CRITICAL:
          console.error(formattedMessage);
          break;
      }
    }

    // Parallel file and database logging
    await Promise.allSettled([
      this.writeToFile(fullEntry),
      this.writeToDatabase(fullEntry),
    ]);
  }

  // Convenience methods
  async debug(
    category: LogCategory,
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({ level: LogLevel.DEBUG, category, message, metadata });
  }

  async info(
    category: LogCategory,
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({ level: LogLevel.INFO, category, message, metadata });
  }

  async warn(
    category: LogCategory,
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({ level: LogLevel.WARN, category, message, metadata });
  }

  async error(
    category: LogCategory,
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({ level: LogLevel.ERROR, category, message, metadata });
  }

  async critical(
    category: LogCategory,
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({ level: LogLevel.CRITICAL, category, message, metadata });
  }

  // Context-aware logging methods
  async logUserAction(
    userId: string,
    userName: string,
    userRole: string,
    category: LogCategory,
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      level: LogLevel.INFO,
      category,
      message,
      userId,
      userName,
      userRole,
      metadata,
    });
  }

  async logSystemEvent(
    category: LogCategory,
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      level: LogLevel.INFO,
      category,
      message,
      metadata,
    });
  }

  async logSecurityEvent(
    level: LogLevel,
    message: string,
    userId?: string,
    ipAddress?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      level,
      category: LogCategory.SECURITY,
      message,
      userId,
      ipAddress,
      metadata,
    });
  }

  // Query methods for log analysis
  async getLogs(
    category?: LogCategory,
    level?: LogLevel,
    userId?: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100
  ) {
    const where: any = {};

    if (category) where.category = category;
    if (level) where.level = level;
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    return await prisma.systemLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: limit,
    });
  }

  // Configuration methods
  setConsoleLogging(enabled: boolean): void {
    this.enableConsole = enabled;
  }

  setFileLogging(enabled: boolean): void {
    this.enableFile = enabled;
  }

  setDatabaseLogging(enabled: boolean): void {
    this.enableDatabase = enabled;
  }

  // Convenience methods for specific categories
  async logAuth(
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.info(LogCategory.AUTH, message, metadata);
  }

  async logSMS(message: string, metadata?: Record<string, any>): Promise<void> {
    await this.info(LogCategory.SMS, message, metadata);
  }

  async logAPI(message: string, metadata?: Record<string, any>): Promise<void> {
    await this.info(LogCategory.API, message, metadata);
  }

  async logSystem(
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.info(LogCategory.SYSTEM, message, metadata);
  }
}

// Export singleton instance
export const logger = Logger.getInstance();
