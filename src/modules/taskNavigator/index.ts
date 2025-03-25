// src/modules/taskNavigator/index.ts
import { Plugin, WorkspaceLeaf } from 'obsidian';
import { TaskNavigatorView } from './views/TaskNavigatorView';

export class TaskNavigatorModule {
    private plugin: Plugin;
    private VIEW_TYPE = 'task-navigator-view';
    private isActivated = false;

    constructor(plugin: Plugin) {
        this.plugin = plugin;
    }

    /**
     * Activa el módulo de navegación de tareas
     */
    activate(): void {
        if (this.isActivated) return;
        
        console.log('Activando módulo TaskNavigator');
        
        // Registrar la vista
        this.plugin.registerView(
            this.VIEW_TYPE,
            (leaf: WorkspaceLeaf) => new TaskNavigatorView(leaf, this.plugin)
        );
        
        // Registrar comando para abrir la vista
        this.plugin.addCommand({
            id: 'open-task-navigator',
            name: 'Abrir Navegador de Tareas GTD',
            callback: () => this.openTaskNavigatorView()
        });
        
        this.isActivated = true;
    }
    
    /**
     * Desactiva el módulo de navegación de tareas
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
     * Abre la vista del navegador de tareas
     * Si ya está abierta, la muestra; de lo contrario, crea una nueva hoja
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
        
        // Si no está abierta, crear una nueva hoja
        const leaf = workspace.getRightLeaf(false);
        await leaf.setViewState({
            type: this.VIEW_TYPE,
            active: true
        });
        
        workspace.revealLeaf(leaf);
    }
}

// DEVELOPMENT_CHECKPOINT: "module_entry_point"
// Descripción: Punto de entrada del módulo TaskNavigator
// Dependencias: TaskNavigatorView (que será implementada a continuación)
// Estado: Completo