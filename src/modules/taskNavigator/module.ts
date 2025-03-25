// src/modules/taskNavigator/module.ts

import { Plugin } from 'obsidian';
import { TaskNavigatorView } from './views/TaskNavigatorView';
import { TaskHierarchyBuilder } from './services/TaskHierarchyBuilder';
import { TaskClassifier } from './services/TaskClassifier';
import { TaskParser } from './services/TaskParser';
import { EntityDetector } from './services/EntityDetector';
import { NavigationUtils } from './utils/NavigationUtils';
import { TaskManagerIntegration } from './services/TaskManagerIntegration';

/**
 * Clase principal para el módulo de navegación de tareas GTD
 */
export class TaskNavigatorModule {
    private plugin: Plugin;
    private readonly VIEW_TYPE = 'task-navigator-view';
    private isActivated = false;
    
    // Servicios
    private hierarchyBuilder: TaskHierarchyBuilder;
    private taskClassifier: TaskClassifier;
    private taskParser: TaskParser;
    private entityDetector: EntityDetector;
    private navigationUtils: NavigationUtils;
    private taskManagerIntegration: TaskManagerIntegration;
    
    constructor(plugin: Plugin) {
        this.plugin = plugin;
        
        // Inicializar servicios
        this.taskParser = new TaskParser();
        this.entityDetector = new EntityDetector(plugin);
        this.hierarchyBuilder = new TaskHierarchyBuilder(plugin);
        this.taskClassifier = new TaskClassifier();
        this.navigationUtils = new NavigationUtils();
        this.taskManagerIntegration = new TaskManagerIntegration(plugin);
    }
    
    /**
     * Activa el módulo TaskNavigator
     */
    activate(): void {
        if (this.isActivated) return;
        
        console.log('Activando módulo TaskNavigator');
        
        // Registrar la vista
        this.plugin.registerView(
            this.VIEW_TYPE,
            (leaf) => new TaskNavigatorView(leaf, this.plugin)
        );
        
        // Registrar comandos
        this.registerCommands();
        
        this.isActivated = true;
    }
    
    /**
     * Desactiva el módulo TaskNavigator
     */
    deactivate(): void {
        if (!this.isActivated) return;
        
        console.log('Desactivando módulo TaskNavigator');
        
        // Eliminar la vista registrada
        this.plugin.app.workspace.detachLeavesOfType(this.VIEW_TYPE);
        
        this.isActivated = false;
    }
    
    /**
     * Comprueba si el módulo está activo
     */
    isActive(): boolean {
        return this.isActivated;
    }
    
    /**
     * Registra los comandos para el módulo
     */
    private registerCommands(): void {
        // Comando para abrir el navegador de tareas
        this.plugin.addCommand({
            id: 'open-task-navigator',
            name: 'Abrir Navegador de Tareas GTD',
            callback: () => this.openTaskNavigatorView()
        });
        
        // Comando para mostrar tareas de la nota actual
        this.plugin.addCommand({
            id: 'show-current-note-tasks',
            name: 'Mostrar Tareas de la Nota Actual',
            callback: () => this.openTaskNavigatorWithCurrentNote()
        });
        
        // Comando para mostrar tareas vencidas
        this.plugin.addCommand({
            id: 'show-overdue-tasks',
            name: 'Mostrar Tareas Vencidas',
            callback: async () => {
                await this.openTaskNavigatorView();
                document.dispatchEvent(new CustomEvent('task-navigator-show-overdue'));
            }
        });
    }
    
 /**
 * Abre la vista del navegador de tareas como una pestaña nueva
 */
async openTaskNavigatorView(): Promise<void> {
    const workspace = this.plugin.app.workspace;
    
    // Verificar si la vista ya está abierta
    const existingLeaves = workspace.getLeavesOfType(this.VIEW_TYPE);
    if (existingLeaves.length > 0) {
        // Si ya está abierta, revelarla
        workspace.revealLeaf(existingLeaves[0]);
        return;
    }
    
    // Guardar la nota activa actual para mantener el contexto
    const activeFile = workspace.getActiveFile();
    
    // Crear una nueva pestaña en el área principal
    // Usamos createLeafInParent para crear una pestaña en el área principal
    const leaf = workspace.getLeaf('tab');
    
    // Configurar la nueva pestaña para mostrar nuestra vista
    await leaf.setViewState({
        type: this.VIEW_TYPE,
        active: true,
        state: {
            contextFile: activeFile ? activeFile.path : null
        }
    });
    
    // Revelar la pestaña recién creada
    workspace.revealLeaf(leaf);
}
    
        /**
         * Abre la vista del navegador centrada en la nota actual
         */
        async openTaskNavigatorWithCurrentNote(): Promise<void> {
            const workspace = this.plugin.app.workspace;
            
            // Obtenemos la nota actual
            const currentFile = workspace.getActiveFile();
            
            if (!currentFile) {
                // Si no hay nota activa, simplemente abrimos la vista normal
                await this.openTaskNavigatorView();
                return;
            }
            
            // Verificar si la vista ya está abierta
            const existingLeaves = workspace.getLeavesOfType(this.VIEW_TYPE);
            if (existingLeaves.length > 0) {
                // Si ya está abierta, actualizamos su contexto
                workspace.revealLeaf(existingLeaves[0]);
                document.dispatchEvent(new CustomEvent('task-navigator-focus-entity', {
                    detail: { filePath: currentFile.path }
                }));
                return;
            }
            
            // Si no está abierta, creamos una pestaña nueva con el contexto de la nota actual
            const leaf = workspace.getLeaf('tab');
            
            // Configurar la nueva pestaña para mostrar nuestra vista
            await leaf.setViewState({
                type: this.VIEW_TYPE,
                active: true,
                state: {
                    contextFile: currentFile.path
                }
            });
            
            // Revelar la pestaña recién creada
            workspace.revealLeaf(leaf);
        }
    
    /**
     * Proporciona el constructor de jerarquía a otros componentes
     */
    getHierarchyBuilder(): TaskHierarchyBuilder {
        return this.hierarchyBuilder;
    }
    
    /**
     * Proporciona el clasificador de tareas a otros componentes
     */
    getTaskClassifier(): TaskClassifier {
        return this.taskClassifier;
    }
    
    /**
     * Proporciona el analizador de tareas a otros componentes
     */
    getTaskParser(): TaskParser {
        return this.taskParser;
    }
    
    /**
     * Proporciona el detector de entidades a otros componentes
     */
    getEntityDetector(): EntityDetector {
        return this.entityDetector;
    }
    
    /**
     * Proporciona las utilidades de navegación a otros componentes
     */
    getNavigationUtils(): NavigationUtils {
        return this.navigationUtils;
    }
    
    /**
     * Proporciona la integración con el gestor de tareas a otros componentes
     */
    getTaskManagerIntegration(): TaskManagerIntegration {
        return this.taskManagerIntegration;
    }
}