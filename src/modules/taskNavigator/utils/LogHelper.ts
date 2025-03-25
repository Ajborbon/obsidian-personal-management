// src/modules/taskNavigator/utils/LogHelper.ts

/**
 * Utilidad para generar logs más limpios y organizados durante la depuración
 */
export class LogHelper {
    // Niveles de log
    static LEVEL = {
        ERROR: 0,   // Errores críticos
        WARN: 1,    // Advertencias importantes
        INFO: 2,    // Información general
        DEBUG: 3,   // Información detallada
        TRACE: 4    // Información muy detallada (solo durante depuración profunda)
    };

    // Nivel actual de logging
    private static currentLevel = LogHelper.LEVEL.INFO;
    
    // Determina si se debe mostrar el timestamp
    private static showTimestamp = true;
    
    // Establece el nivel de logging
    static setLogLevel(level: number): void {
        LogHelper.currentLevel = level;
        LogHelper.info("SYSTEM", `Nivel de log establecido a: ${Object.keys(LogHelper.LEVEL).find(key => LogHelper.LEVEL[key] === level)}`);
    }

    // Habilita/deshabilita los timestamps
    static showTimestamps(show: boolean): void {
        LogHelper.showTimestamp = show;
    }

    // Log de error (siempre se muestra)
    static error(module: string, message: string, data?: any): void {
        if (LogHelper.currentLevel >= LogHelper.LEVEL.ERROR) {
            console.error(`${LogHelper.getPrefix('ERROR', module)} ${message}`, data || '');
        }
    }

    // Log de advertencia
    static warn(module: string, message: string, data?: any): void {
        if (LogHelper.currentLevel >= LogHelper.LEVEL.WARN) {
            console.warn(`${LogHelper.getPrefix('WARN', module)} ${message}`, data || '');
        }
    }

    // Log de información general
    static info(module: string, message: string, data?: any): void {
        if (LogHelper.currentLevel >= LogHelper.LEVEL.INFO) {
            console.log(`${LogHelper.getPrefix('INFO', module)} ${message}`, data || '');
        }
    }

    // Log de debugging
    static debug(module: string, message: string, data?: any): void {
        if (LogHelper.currentLevel >= LogHelper.LEVEL.DEBUG) {
            console.log(`${LogHelper.getPrefix('DEBUG', module)} ${message}`, data || '');
        }
    }

    // Log de trace (muy detallado)
    static trace(module: string, message: string, data?: any): void {
        if (LogHelper.currentLevel >= LogHelper.LEVEL.TRACE) {
            console.log(`${LogHelper.getPrefix('TRACE', module)} ${message}`, data || '');
        }
    }

    // Genera un grupo de logs (para organizar mejor la salida)
    static group(module: string, title: string, collapsed = false): void {
        if (LogHelper.currentLevel >= LogHelper.LEVEL.DEBUG) {
            const prefix = LogHelper.getPrefix('GROUP', module);
            if (collapsed) {
                console.groupCollapsed(`${prefix} ${title}`);
            } else {
                console.group(`${prefix} ${title}`);
            }
        }
    }

    // Cierra un grupo de logs
    static groupEnd(): void {
        if (LogHelper.currentLevel >= LogHelper.LEVEL.DEBUG) {
            console.groupEnd();
        }
    }

    // Muestra un resumen de estadísticas (útil para debugging)
    static logStats(module: string, stats: Record<string, any>): void {
        if (LogHelper.currentLevel >= LogHelper.LEVEL.INFO) {
            LogHelper.group(module, 'Estadísticas', false);
            for (const [key, value] of Object.entries(stats)) {
                console.log(`${key}: ${value}`);
            }
            LogHelper.groupEnd();
        }
    }

    // Método para generar una tabla de datos (muy útil para visualizar conjuntos de datos)
    static table(module: string, data: any[], columns?: string[]): void {
        if (LogHelper.currentLevel >= LogHelper.LEVEL.DEBUG) {
            LogHelper.info(module, 'Tabla de datos:');
            if (columns) {
                console.table(data, columns);
            } else {
                console.table(data);
            }
        }
    }

    // Obtiene el prefijo para el mensaje de log
    private static getPrefix(level: string, module: string): string {
        const timestamp = LogHelper.showTimestamp ? `[${new Date().toISOString().substr(11, 8)}] ` : '';
        return `${timestamp}[TaskNavigator:${module}] [${level}]`;
    }
}