import RNFS from 'react-native-fs';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogOptions {
    maxLogFiles?: number;
    maxFileSizeBytes?: number;
    filePrefix?: string;
    currentLogName?: string; // Name for the current log file
    timeZoneOffset?: number; // Manual override for hours offset from UTC
    useDeviceTimeZone?: boolean; // Whether to use the device's time zone
}

interface LogMetadata {
    module?: string;
    [key: string]: any;
}

class Logger {
    private logDirectory: string;
    private currentLogFile: string;
    private options: Required<LogOptions>;
    private deviceTimeZoneOffsetInHours: number;

    constructor(options: LogOptions = {}) {
        // Get device time zone offset
        this.deviceTimeZoneOffsetInHours = this.getDeviceTimeZoneOffsetInHours();

        this.options = {
            maxLogFiles: options.maxLogFiles || 5,
            maxFileSizeBytes: options.maxFileSizeBytes || 1024 * 1024, // 1MB default
            filePrefix: options.filePrefix || 'app_log_',
            currentLogName: options.currentLogName || 'app.log',
            timeZoneOffset: options.timeZoneOffset !== undefined ? options.timeZoneOffset : this.deviceTimeZoneOffsetInHours,
            useDeviceTimeZone: options.useDeviceTimeZone !== undefined ? options.useDeviceTimeZone : true
        };

        // Set log directory based on platform
        this.logDirectory = `${RNFS.DocumentDirectoryPath}/logs/app_log/`

        this.currentLogFile = `${this.logDirectory}${this.options.currentLogName}`;

        this.initializeLogDirectory();
    }

    private getDeviceTimeZoneOffsetInHours(): number {
        try {
            const date = new Date();
            const offsetInMinutes = date.getTimezoneOffset();
            return -offsetInMinutes / 60; // Convert to hours and invert (JS returns opposite sign)
        } catch (error) {
            console.error('Failed to get device timezone:', error);
            return 0; // Default to UTC if we can't determine the time zone
        }
    }

    private async initializeLogDirectory(): Promise<void> {
        try {
            const exists = await RNFS.exists(this.logDirectory);
            if (!exists) {
                await RNFS.mkdir(this.logDirectory);
            }

            // Cleanup old log files on initialization
            await this.cleanupOldLogs();
        } catch (error) {
            console.error('Failed to initialize log directory:', error);
        }
    }

    private formatDateTime(date: Date, formatType: 'date' | 'timestamp'): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        if (formatType === 'date') {
            return `${year}-${month}-${day}`;
        } else {
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
        }
    }

    private getAdjustedDate(): Date {
        const now = new Date();

        // If using device time zone, return date adjusted with device offset
        if (this.options.useDeviceTimeZone) {
            return now;
        }

        // Otherwise, use the manually specified time zone offset
        const utcMillis = now.getTime() + (now.getTimezoneOffset() * 60000);
        return new Date(utcMillis + (3600000 * this.options.timeZoneOffset));
    }

    private getFormattedDate(): string {
        return this.formatDateTime(this.getAdjustedDate(), 'date');
    }

    private getTimestamp(): string {
        return this.formatDateTime(this.getAdjustedDate(), 'timestamp');
    }

    // Get the current time zone name for logging purposes
    public getTimeZoneInfo(): string {
        try {
            const offset = this.options.useDeviceTimeZone ?
                this.deviceTimeZoneOffsetInHours :
                this.options.timeZoneOffset;

            const sign = offset >= 0 ? '+' : '-';
            const absOffset = Math.abs(offset);
            const hours = Math.floor(absOffset);
            const minutes = Math.round((absOffset - hours) * 60);

            return `UTC${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        } catch (error) {
            return 'Unknown';
        }
    }

    private async cleanupOldLogs(): Promise<void> {
        try {
            const files = await RNFS.readDir(this.logDirectory);
            // Filter out the current log file and only keep archived log files
            const logFiles = files
                .filter(file => file.name !== this.options.currentLogName && file.name.startsWith(this.options.filePrefix))
                .sort((a, b) => b.mtime?.getTime() - a.mtime?.getTime()); // Sort by modified time, newest first

            // Delete older files beyond maxLogFiles limit (not counting the current log)
            for (let i = this.options.maxLogFiles - 1; i < logFiles.length; i++) {
                await RNFS.unlink(logFiles[i].path);
            }
        } catch (error) {
            console.error('Failed to cleanup old logs:', error);
        }
    }

    private async archiveCurrentLogIfNeeded(): Promise<void> {
        try {
            const fileExists = await RNFS.exists(this.currentLogFile);
            if (fileExists) {
                const stats = await RNFS.stat(this.currentLogFile);
                if (stats.size >= this.options.maxFileSizeBytes) {
                    // Archive the current log with timestamp
                    const archiveFileName = `${this.options.filePrefix}${this.getFormattedDate()}_${Date.now()}.log`;
                    const archiveFilePath = `${this.logDirectory}${archiveFileName}`;

                    // Copy current log to archive
                    await RNFS.copyFile(this.currentLogFile, archiveFilePath);

                    // Clear the current log file
                    await RNFS.unlink(this.currentLogFile);

                    // Clean up old logs, maintaining the desired count
                    await this.cleanupOldLogs();
                }
            }
        } catch (error) {
            console.error('Failed to archive log:', error);
        }
    }

    private formatMetadata(meta?: LogMetadata): string {
        if (!meta) return '';

        // Extract module name if present
        const moduleName = meta.module ? meta.module : 'unknown';

        // Format other metadata (excluding module which is handled separately)
        const otherMeta = { ...meta };
        delete otherMeta.module;

        const metaStr = Object.keys(otherMeta).length > 0 ? ` ${JSON.stringify(otherMeta)}` : '';

        return `[${moduleName}]${metaStr}`;
    }

    public async log(level: LogLevel, message: string, meta?: LogMetadata): Promise<void> {
        try {
            await this.archiveCurrentLogIfNeeded();

            const timestamp = this.getTimestamp();
            const metadataStr = this.formatMetadata(meta);
            const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${metadataStr} ${message}\n`;

            await RNFS.appendFile(this.currentLogFile, logEntry, 'utf8');
        } catch (error) {
            console.error('Failed to write log:', error);
        }
    }

    public async debug(message: string, meta?: LogMetadata): Promise<void> {
        return this.log('debug', message, meta);
    }

    public async info(message: string, meta?: LogMetadata): Promise<void> {
        return this.log('info', message, meta);
    }

    public async warn(message: string, meta?: LogMetadata): Promise<void> {
        return this.log('warn', message, meta);
    }

    public async error(message: string, meta?: LogMetadata): Promise<void> {
        return this.log('error', message, meta);
    }

    // Module-specific logger methods
    public createModuleLogger(moduleName: string) {
        return {
            debug: (message: string, meta?: Omit<LogMetadata, 'module'>) =>
                this.debug(message, { ...meta, module: moduleName }),

            info: (message: string, meta?: Omit<LogMetadata, 'module'>) =>
                this.info(message, { ...meta, module: moduleName }),

            warn: (message: string, meta?: Omit<LogMetadata, 'module'>) =>
                this.warn(message, { ...meta, module: moduleName }),

            error: (message: string, meta?: Omit<LogMetadata, 'module'>) =>
                this.error(message, { ...meta, module: moduleName })
        };
    }

    public async getLogFiles(): Promise<string[]> {
        try {
            const files = await RNFS.readDir(this.logDirectory);
            // Return all log files, including the current log
            return files
                .filter(file => file.name === this.options.currentLogName || file.name.startsWith(this.options.filePrefix))
                .map(file => file.path);
        } catch (error) {
            console.error('Failed to get log files:', error);
            return [];
        }
    }

    public async readLogFile(filePath: string): Promise<string> {
        try {
            return await RNFS.readFile(filePath, 'utf8');
        } catch (error) {
            console.error('Failed to read log file:', error);
            return '';
        }
    }

    public async clearLogs(): Promise<void> {
        try {
            const files = await this.getLogFiles();
            for (const file of files) {
                await RNFS.unlink(file);
            }
        } catch (error) {
            console.error('Failed to clear logs:', error);
        }
    }
}

// Export singleton instance with default options (using device's time zone)
export const logger = new Logger();

// Export class for custom instances
export default Logger;
