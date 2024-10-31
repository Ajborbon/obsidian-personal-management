// src/modules/moduloTabTitle/utils/logger.ts
export class Logger {
    private static readonly PREFIX = '🏷️ [TabTitle]';
    
    static debug(message: string, ...args: any[]) {
        console.debug(`${this.PREFIX} ${message}`, ...args);
    }
    
    static info(message: string, ...args: any[]) {
        console.info(`${this.PREFIX} ${message}`, ...args);
    }
    
    static error(message: string, error?: any) {
        console.error(`${this.PREFIX} ${message}`, error || '');
    }
    
    static warn(message: string, ...args: any[]) {
        console.warn(`${this.PREFIX} ${message}`, ...args);
    }
}