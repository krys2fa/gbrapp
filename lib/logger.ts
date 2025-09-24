// lib/logger.ts
// Note: avoid importing Node-only modules at top-level so this file
// can be imported from edge runtime code (middleware). We'll lazily
// import `fs/promises`, `path`, and the Prisma client only when running
// in a Node (non-edge) runtime.

const isEdgeRuntime =
  typeof process !== "undefined" &&
  process.env &&
  process.env.NEXT_RUNTIME === "edge";

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  CRITICAL = "CRITICAL",
}

export enum LogCategory {
  SYSTEM = "SYSTEM",
  AUDIT = "AUDIT",
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
  FEE = "FEE",
  INVOICE = "INVOICE",
  EXPORTER = "EXPORTER",
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
  // Disable file & database logging in edge runtime (no fs/prisma)
  private enableFile: boolean = !isEdgeRuntime;
  private enableDatabase: boolean = !isEdgeRuntime;

  // Lazily-loaded node modules (only available in Node runtimes)
  private fs: any | undefined;
  private path: any | undefined;
  private prisma: any | undefined;

  private constructor() {
    // Avoid calling node-specific APIs in the constructor so the module
    // can be imported in edge runtimes. Use a safe default path string
    // and perform real setup lazily when file logging is used.
    this.logDirectory = "logs";
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private async ensureLogDirectory(): Promise<void> {
    if (!this.enableFile) return;
    await this.ensureNodeModules();
    if (!this.fs) return; // couldn't load fs, give up silently

    // If we're in a Node runtime and have path available, lazily resolve
    // a proper log directory relative to process.cwd(). Avoid referencing
    // process.cwd() at module import time to keep this file edge-safe.
    try {
      if (this.path && typeof process !== "undefined" && (process as any).cwd) {
        try {
          const cwd = (process as any).cwd();
          // Use path.join to be safe on Windows/Posix
          this.logDirectory = this.path.join(cwd, "logs");
        } catch (_e) {
          // ignore failures resolving cwd
        }
      }
    } catch (_e) {
      // swallow any unexpected errors here to remain edge-safe
    }

    try {
      await this.fs.access(this.logDirectory);
    } catch {
      await this.fs.mkdir(this.logDirectory, { recursive: true });
    }
  }

  private async ensureNodeModules(): Promise<void> {
    if (this.fs && this.path) return;
    try {
      this.fs = await import("fs/promises");
      this.path = await import("path");
    } catch (error) {
      // If dynamic import fails (e.g., running in edge), leave modules undefined
      this.fs = undefined;
      this.path = undefined;
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
      await this.ensureNodeModules();
      if (!this.fs || !this.path) return;

      const date = entry.timestamp.toISOString().split("T")[0];
      const filename = `app-${date}.log`;
      const filepath = this.path.join(this.logDirectory, filename);

      const logMessage = this.formatLogMessage(entry) + "\n";

      // Check file size and rotate if necessary
      try {
        const stats = await this.fs.stat(filepath);
        if (stats.size > this.maxFileSize) {
          await this.rotateLogFile(filepath);
        }
      } catch {
        // File doesn't exist, which is fine
      }

      await this.fs.appendFile(filepath, logMessage);
    } catch (error) {
      // Avoid throwing from logger; fallback to console
      console.error("Failed to write to log file:", error);
    }
  }

  private async rotateLogFile(filepath: string): Promise<void> {
    if (!this.enableFile) return;
    try {
      await this.ensureNodeModules();
      if (!this.fs) return;

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const rotatedPath = filepath.replace(".log", `-${timestamp}.log`);
      await this.fs.rename(filepath, rotatedPath);

      // Clean up old log files
      await this.cleanupOldLogs();
    } catch (error) {
      console.error("Failed to rotate log file:", error);
    }
  }

  private async cleanupOldLogs(): Promise<void> {
    if (!this.enableFile) return;
    try {
      await this.ensureNodeModules();
      if (!this.fs || !this.path) return;

      const files = await this.fs.readdir(this.logDirectory);
      const logFiles = files
        .filter((file: string) => file.endsWith(".log"))
        .map((file: string) => ({
          name: file,
          path: this.path.join(this.logDirectory, file),
        }));

      if (logFiles.length > this.maxFiles) {
        // Sort by modification time and delete oldest files
        const filesWithStats = await Promise.all(
          logFiles.map(async (file: any) => ({
            ...file,
            stats: await this.fs.stat(file.path),
          }))
        );

        filesWithStats
          .sort(
            (a: any, b: any) =>
              a.stats.mtime.getTime() - b.stats.mtime.getTime()
          )
          .slice(0, filesWithStats.length - this.maxFiles)
          .forEach(async (file: any) => {
            await this.fs.unlink(file.path);
          });
      }
    } catch (_error) {
      console.error("Failed to cleanup old logs:", _error);
    }
  }

  private async writeToDatabase(entry: LogEntry): Promise<void> {
    if (!this.enableDatabase) return;

    try {
      // Lazily import Prisma client only when database logging is enabled
      if (!this.prisma) {
        try {
          const mod = await import("@/app/lib/prisma");
          this.prisma = mod.prisma;
        } catch (_err) {
          // Could not import prisma (likely in edge or constrained runtime)
          this.prisma = undefined;
        }
      }

      if (!this.prisma) return;

      await this.prisma.systemLog.create({
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
    } catch (_error) {
      console.error("Failed to write to database log:", _error);
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

    // Write to file always when file logging is enabled. For database logging,
    // skip SYSTEM and AUDIT categories — we no longer persist those to the DB.
    const tasks: Promise<void>[] = [];

    if (this.enableFile) {
      tasks.push(this.writeToFile(fullEntry));
    }

    // Only push to database for non-system/audit categories and when DB logging
    // is enabled. This avoids importing Prisma for system/audit logs.
    if (
      this.enableDatabase &&
      fullEntry.category !== LogCategory.SYSTEM &&
      fullEntry.category !== LogCategory.AUDIT
    ) {
      tasks.push(this.writeToDatabase(fullEntry));
    }

    await Promise.allSettled(tasks);
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

    // Lazily import prisma if needed (avoid bundling into edge runtime)
    if (!this.prisma) {
      try {
        const mod = await import("@/app/lib/prisma");
        this.prisma = mod.prisma;
      } catch (err) {
        // Prisma not available (likely edge/runtime), return empty array as fallback
        return [];
      }
    }

    return await this.prisma.systemLog.findMany({
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
    // Allow toggling DB logging generally, but note SYSTEM and AUDIT logs are
    // never written to the database by policy. The flag controls DB logging
    // for other categories only.
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
