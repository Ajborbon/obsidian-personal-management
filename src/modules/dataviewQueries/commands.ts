// src/modules/dataviewQueries/commands.ts
import { Plugin, Notice } from 'obsidian';

export function registerCommands(plugin: Plugin): void {
    // Comando para limpiar el caché de consultas
    const clearCacheCommand = plugin.addCommand({
        id: 'clear-dataview-queries-cache',
        name: 'Limpiar caché de consultas',
        callback: () => {
            try {
                const moduleInstance = (plugin as any).moduloDataviewQueries;
                if (moduleInstance?.queryManager) {
                    moduleInstance.queryManager.clearCache();
                    new Notice('Caché de consultas limpiado');
                }
            } catch (error) {
                console.error('Error al limpiar caché:', error);
                new Notice('Error al limpiar caché de consultas');
            }
        }
    });

    // Comando para recargar todas las consultas activas
    const reloadQueriesCommand = plugin.addCommand({
        id: 'reload-dataview-queries',
        name: 'Recargar consultas activas',
        callback: () => {
            try {
                const moduleInstance = (plugin as any).moduloDataviewQueries;
                if (moduleInstance?.queryManager) {
                    moduleInstance.clearCache();
                    app.workspace.trigger('dataview:refresh-views');
                    new Notice('Consultas recargadas');
                }
            } catch (error) {
                console.error('Error al recargar consultas:', error);
                new Notice('Error al recargar consultas');
            }
        }
    });

    // Registrar los IDs de los comandos para poder desactivarlos después
    (plugin as any).registeredDataviewQueryCommandIds = [
        clearCacheCommand.id,
        reloadQueriesCommand.id
    ];
}

export function deactivateCommands(plugin: Plugin): void {
    const commandIds = (plugin as any).registeredDataviewQueryCommandIds;
    if (!commandIds) return;
    
    commandIds.forEach((commandId: string) => {
        const command = plugin.app.commands.commands[commandId];
        if (command) {
            command.callback = () => new Notice("Este comando ha sido desactivado.");
        }
    });
    
    // Limpiar el array de comandos registrados
    (plugin as any).registeredDataviewQueryCommandIds = [];
}