// src/modules/taskNavigator/views/TaskNavigatorView.ts
import { ItemView, WorkspaceLeaf, Plugin, TFile } from 'obsidian';
import { TaskHierarchyBuilder } from '../services/TaskHierarchyBuilder';
import { TaskClassifier } from '../services/TaskClassifier';
import { TaskParser } from '../services/TaskParser';
import { EntityDetector } from '../services/EntityDetector';
import { ViewRenderer } from '../components/ViewRenderer';
import { FilterPanel } from '../components/FilterPanel';
import { HierarchyViewModel } from '../models/HierarchyViewModel';

export class TaskNavigatorView extends ItemView {
    private plugin: Plugin;
    private hierarchyBuilder: TaskHierarchyBuilder;
    private taskClassifier: TaskClassifier;
    private taskParser: TaskParser;
    private entityDetector: EntityDetector;
    private viewRenderer: ViewRenderer;
    private filterPanel: FilterPanel;
    private currentModel: HierarchyViewModel | null = null;
    private activeFile: TFile | null = null;
    private refreshInterval: number | null = null;
    
    constructor(leaf: WorkspaceLeaf, plugin: Plugin) {
        super(leaf);
        this.plugin = plugin;
        
        // Inicializar servicios
        this.taskParser = new TaskParser();
        this.hierarchyBuilder = new TaskHierarchyBuilder(this.plugin);
        this.taskClassifier = new TaskClassifier();
        this.entityDetector = new EntityDetector(this.plugin);
        
        // Inicializar componentes de UI
        this.viewRenderer = new ViewRenderer();
        this.filterPanel = new FilterPanel((filters) => this.applyFilters(filters));
    }
    
    getViewType(): string {
        return 'task-navigator-view';
    }
    
    getDisplayText(): string {
        return 'Navegador de Tareas GTD';
    }
    
    getIcon(): string {
        return 'checkmark';
    }
    
    /**
     * Se ejecuta cuando la vista se abre
     */
    async onOpen(): Promise<void> {
        // Mostrar mensaje de carga inicial
        this.contentEl.empty();
        this.contentEl.addClass('task-navigator-container');
        this.contentEl.createEl('div', { text: 'Cargando navegador de tareas...', cls: 'task-navigator-loading' });
        
        // Obtener el archivo activo actual
        this.activeFile = this.app.workspace.getActiveFile();
        
        // Construir la vista inicial
        await this.refreshView();
        
        // Configurar actualización periódica (cada 2 minutos)
        this.refreshInterval = window.setInterval(() => {
            this.refreshView();
        }, 120000);
        
        // Añadir listener para cambios de archivo activo
        this.registerEvent(
            this.app.workspace.on('active-leaf-change', async () => {
                const newActiveFile = this.app.workspace.getActiveFile();
                if (newActiveFile && newActiveFile !== this.activeFile) {
                    this.activeFile = newActiveFile;
                    await this.refreshView();
                }
            })
        );
    }
    
    /**
     * Se ejecuta cuando la vista se cierra
     */
    onClose(): void {
        // Limpiar el intervalo de actualización
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }
    
    /**
     * Actualiza la vista con los datos más recientes
     */
    async refreshView(): Promise<void> {
        try {
            // Mostrar indicador de carga
            const loadingIndicator = this.contentEl.createEl('div', { 
                cls: 'task-navigator-loading',
                text: 'Actualizando datos...'
            });
            
            // Detectar el tipo de entidad del archivo activo actual (si existe)
            let entityContext = null;
            if (this.activeFile) {
                entityContext = await this.entityDetector.detectEntityFromFile(this.activeFile);
            }
            
            // Construir el modelo de jerarquía
            this.currentModel = await this.hierarchyBuilder.buildHierarchy(entityContext);
            
            // Clasificar las tareas según reglas GTD
            if (this.currentModel) {
                await this.taskClassifier.classifyTasks(this.currentModel);
            }
            
            // Limpiar la vista actual
            this.contentEl.empty();
            
            // Renderizar la nueva vista
            this.viewRenderer.render(this.contentEl, this.currentModel, this.filterPanel);
            
        } catch (error) {
            console.error('Error al actualizar vista de TaskNavigator:', error);
            this.contentEl.empty();
            this.contentEl.createEl('div', {
                cls: 'task-navigator-error',
                text: `Error al cargar el navegador de tareas: ${error.message}`
            });
        }
    }
    
    /**
     * Aplica los filtros seleccionados por el usuario
     */
    private applyFilters(filters: any): void {
        if (!this.currentModel) return;
        
        // Aplicar filtros al modelo actual
        this.currentModel.applyFilters(filters);
        
        // Re-renderizar la vista con los filtros aplicados
        this.contentEl.empty();
        this.viewRenderer.render(this.contentEl, this.currentModel, this.filterPanel);
    }
}

// DEVELOPMENT_CHECKPOINT: "main_view_implementation"
// Descripción: Implementación de la vista principal del navegador de tareas
// Dependencias: TaskHierarchyBuilder, TaskClassifier, TaskParser, EntityDetector, ViewRenderer, FilterPanel, HierarchyViewModel
// Estado: Completo