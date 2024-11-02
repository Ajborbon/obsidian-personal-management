// src/modules/dataviewQueries/index.ts
import { Plugin } from 'obsidian';
import { DataviewQueryManager } from './DataviewQueryManager';
import { registerCommands, deactivateCommands } from './commands';
import { QueryRenderer } from './QueryRenderer';

export class ModuloDataviewQueries {
    private plugin: Plugin;
    private queryManager: DataviewQueryManager;
    private queryRenderer: QueryRenderer;
    private _isActive: boolean = false;

    constructor(plugin: Plugin) {
        console.log('ModuloDataviewQueries: Inicializando...');
        this.plugin = plugin;
        this.queryManager = new DataviewQueryManager(plugin);
        this.queryRenderer = new QueryRenderer();
    }

    activate(): void {
        console.log('ModuloDataviewQueries: Iniciando activación...');
        if (this._isActive) {
            console.log('ModuloDataviewQueries: Ya está activo');
            return;
        }

        try {
            registerCommands(this.plugin);
            this.registerDataviewExtensions();
            this._isActive = true;
            console.log('ModuloDataviewQueries: Activación exitosa');
        } catch (error) {
            console.error('ModuloDataviewQueries: Error en activación:', error);
            this._isActive = false;
            throw error;
        }
    }

    deactivate(): void {
        console.log('ModuloDataviewQueries: Iniciando desactivación...');
        if (!this._isActive) {
            console.log('ModuloDataviewQueries: Ya está inactivo');
            return;
        }

        try {
            deactivateCommands(this.plugin);
            this.unregisterDataviewExtensions();
            this._isActive = false;
            console.log('ModuloDataviewQueries: Desactivación exitosa');
        } catch (error) {
            console.error('ModuloDataviewQueries: Error en desactivación:', error);
            throw error;
        }
    }

    isActive(): boolean {
        return this._isActive;
    }

    async renderQuery(queryType: string, params: {
        container: HTMLElement,
        dv: any,
        options?: any
    }) {
        if (!this._isActive) {
            throw new Error('El módulo no está activo');
        }

        switch (queryType) {
            case 'taskButtons':
                await this.queryRenderer.renderTaskButtons(params.container, params.options);
                break;
            default:
                throw new Error(`Tipo de consulta no soportado: ${queryType}`);
        }
    }

    private registerDataviewExtensions() {
        // Crear objeto de funciones antes de registrarlas
        const boundFunctions = {
            renderTaskButtons: (dv: any, container: HTMLElement, options: any) => {
                return this.queryRenderer.renderTaskButtons(container, options);
            },
            renderProjectHierarchy: (dv: any, container: HTMLElement, options: any) => {
                return this.queryRenderer.renderProjectHierarchy(container, options);
            }
        };

        // Registrar las funciones en el espacio global
        (window as any).customQueries = boundFunctions;
        console.log('ModuloDataviewQueries: Extensions registradas');
    }

    private unregisterDataviewExtensions() {
        delete (window as any).customQueries;
        console.log('ModuloDataviewQueries: Extensions eliminadas');
    }
}