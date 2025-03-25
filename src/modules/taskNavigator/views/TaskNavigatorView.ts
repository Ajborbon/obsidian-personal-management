// src/modules/taskNavigator/views/TaskNavigatorView.ts
import { ItemView, WorkspaceLeaf, Plugin, TFile } from 'obsidian';
import { TaskHierarchyBuilder } from '../services/TaskHierarchyBuilder';
import { TaskClassifier } from '../services/TaskClassifier';
import { TaskParser } from '../services/TaskParser';
import { EntityDetector } from '../services/EntityDetector';
import { ViewRenderer } from '../components/ViewRenderer';
import { FilterPanel } from '../components/FilterPanel';
import { HierarchyViewModel, ViewMode } from '../models/HierarchyViewModel';

export class TaskNavigatorView extends ItemView {
    private plugin: Plugin;
    private hierarchyBuilder: TaskHierarchyBuilder;
    private taskClassifier: TaskClassifier;
    private taskParser: TaskParser;
    private entityDetector: EntityDetector;
    private viewRenderer: ViewRenderer;
    private filterPanel: FilterPanel;
    private currentModel: HierarchyViewModel | null = null;
    private contextFile: TFile | null = null; // Archivo de contexto guardado
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
     * Guarda el estado de la vista
     */
    getState(): any {
        return {
            contextFile: this.contextFile ? this.contextFile.path : null,
            currentFilters: this.currentModel ? this.currentModel.filters : null,
            viewMode: this.currentModel ? this.currentModel.viewMode : null
        };
    }
    
    /**
     * Restaura el estado de la vista
     */
    setState(state: any): void {
        if (state.contextFile) {
            const file = this.app.vault.getAbstractFileByPath(state.contextFile);
            if (file instanceof TFile) {
                this.contextFile = file;
            }
        }
        
        // Restauramos los filtros y el modo de vista si están disponibles
        if (this.currentModel) {
            if (state.currentFilters) {
                this.currentModel.filters = state.currentFilters;
            }
            
            if (state.viewMode) {
                this.currentModel.viewMode = state.viewMode;
            }
        }
    }
    
    /**
     * Se ejecuta cuando la vista se recarga (tras cambiar de pestaña y volver)
     */
    onload(): void {
        super.onload();
        
        // Actualizar la vista con el contexto guardado
        if (this.contextFile) {
            this.refreshView();
        }
    }
    
    /**
     * Se ejecuta cuando la vista se abre
     */
    async onOpen(): Promise<void> {
        // Mostrar mensaje de carga inicial
        this.contentEl.empty();
        this.contentEl.addClass('task-navigator-container');
        this.contentEl.createEl('div', { text: 'Cargando navegador de tareas...', cls: 'task-navigator-loading' });
        
        // Obtener el archivo de contexto desde el estado o usar el archivo activo actual
        if (this.leaf.getViewState().state?.contextFile) {
            const contextPath = this.leaf.getViewState().state.contextFile;
            const file = this.app.vault.getAbstractFileByPath(contextPath);
            if (file instanceof TFile) {
                this.contextFile = file;
            }
        } 
        
        // Si no hay archivo de contexto en el estado, usar el archivo activo actual
        if (!this.contextFile) {
            this.contextFile = this.app.workspace.getActiveFile();
        }
        
        // Construir la vista inicial basada en el archivo de contexto
        await this.refreshView();
        
        // Configurar actualización periódica (cada 2 minutos)
        this.refreshInterval = window.setInterval(() => {
            this.refreshView();
        }, 120000);
        
        // Registrar listeners para eventos personalizados
        this.registerCustomEvents();
    }
    
    /**
     * Registra listeners para eventos personalizados
     */
    private registerCustomEvents(): void {
        // Evento para enfocar en una entidad específica
        document.addEventListener('task-navigator-focus-entity', this.handleFocusEntity);
        
        // Evento para mostrar tareas vencidas
        document.addEventListener('task-navigator-show-overdue', this.handleShowOverdue);
        
        // Evento para actualizar la vista
        this.contentEl.addEventListener('task-navigator-refresh', () => {
            this.refreshView();
        });
        
        // Evento para cambiar el modo de vista
        this.contentEl.addEventListener('task-navigator-view-change', (event: CustomEvent) => {
            if (event.detail?.viewMode && this.currentModel) {
                this.currentModel.viewMode = event.detail.viewMode;
                this.renderCurrentView();
            }
        });
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
        
        // Limpiar listeners personalizados
        document.removeEventListener('task-navigator-focus-entity', this.handleFocusEntity);
        document.removeEventListener('task-navigator-show-overdue', this.handleShowOverdue);
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
            
            // Detectar el tipo de entidad del archivo de contexto
            let entityContext = null;
            if (this.contextFile) {
                entityContext = await this.entityDetector.detectEntityFromFile(this.contextFile);
            }
            
            // Construir el modelo de jerarquía
            this.currentModel = await this.hierarchyBuilder.buildHierarchy(entityContext);
            
            // Clasificar las tareas según reglas GTD
            if (this.currentModel) {
                await this.taskClassifier.classifyTasks(this.currentModel);
                
                // Restaurar filtros del estado si existen
                const state = this.leaf.getViewState().state;
                if (state?.currentFilters) {
                    this.currentModel.filters = state.currentFilters;
                }
                
                // Restaurar modo de vista
                if (state?.viewMode) {
                    this.currentModel.viewMode = state.viewMode;
                }
            }
            
            // Limpiar la vista actual
            this.contentEl.empty();
            
            // Renderizar la nueva vista
            this.renderCurrentView();
            
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
     * Renderiza la vista con el modelo actual
     */
    private renderCurrentView(): void {
        if (!this.currentModel) return;
        
        // Limpiar la vista actual
        this.contentEl.empty();
        
        // Renderizar la nueva vista
        this.viewRenderer.render(this.contentEl, this.currentModel, this.filterPanel);
    }
    
    /**
     * Aplica los filtros seleccionados por el usuario
     */
    private applyFilters(filters: any): void {
        if (!this.currentModel) return;
        
        // Aplicar filtros al modelo actual
        this.currentModel.applyFilters(filters);
        
        // Re-renderizar la vista con los filtros aplicados
        this.renderCurrentView();
    }
    
    // Handlers para eventos personalizados (definidos como propiedades de clase para poder eliminarlos)
    private handleFocusEntity = (event: CustomEvent) => {
        if (event.detail?.filePath) {
            const file = this.app.vault.getAbstractFileByPath(event.detail.filePath);
            if (file instanceof TFile) {
                this.contextFile = file;
                this.refreshView();
            }
        }
    };
    
    private handleShowOverdue = async () => {
        // Implementar lógica para mostrar tareas vencidas
        try {
            // Aquí podría integrarse con el TaskManagerIntegration para cargar tareas vencidas
            // por ejemplo:
            // const taskManagerIntegration = this.plugin.taskNavigatorModule.getTaskManagerIntegration();
            // const overdueTasks = await taskManagerIntegration.loadOverdueTasks();
            
            // Por ahora, simplemente actualizamos la vista y aplicamos un filtro
            await this.refreshView();
            
            if (this.currentModel) {
                // Filtrar para mostrar solo tareas vencidas
                this.currentModel.applyFilters({
                    searchText: "vencida", // Esto es un ejemplo simple
                    // Otros filtros necesarios...
                });
                
                this.renderCurrentView();
            }
        } catch (error) {
            console.error("Error al mostrar tareas vencidas:", error);
        }
    };
}