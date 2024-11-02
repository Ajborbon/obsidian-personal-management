// src/modules/dataviewQueries/index.ts
import { Plugin } from 'obsidian';
import { DataviewQueryManager } from './DataviewQueryManager';
import { registerCommands, deactivateCommands } from './commands';
import { QueryRenderer } from './QueryRenderer';

export class ModuloDataviewQueries {
    private plugin: Plugin;
    private queryManager: DataviewQueryManager;
    private queryRenderer: QueryRenderer;

    constructor(plugin: Plugin) {
        this.plugin = plugin;
        this.queryManager = new DataviewQueryManager(plugin);
        this.queryRenderer = new QueryRenderer();
    }

    activate() {
        registerCommands(this.plugin);
        this.registerDataviewExtensions();
    }

    deactivate() {
        deactivateCommands(this.plugin);
        this.unregisterDataviewExtensions();
    }

    private registerDataviewExtensions() {
        // Registrar las funciones personalizadas en el espacio global de dataviewjs
        (window as any).customQueries = {
            renderTaskButtons: this.queryRenderer.renderTaskButtons.bind(this.queryRenderer),
            renderProjectHierarchy: this.queryRenderer.renderProjectHierarchy.bind(this.queryRenderer),
            // Añadir más funciones aquí según necesites
        };
    }

    private unregisterDataviewExtensions() {
        delete (window as any).customQueries;
    }
}