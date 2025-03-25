// src/modules/taskNavigator/views/TaskNavigatorView.ts
import { ItemView, WorkspaceLeaf, Plugin, TFile, Notice } from 'obsidian';
import { TaskHierarchyBuilder } from '../services/TaskHierarchyBuilder';
import { TaskClassifier } from '../services/TaskClassifier';
import { TaskParser } from '../services/TaskParser';
import { EntityDetector } from '../services/EntityDetector';
import { ViewRenderer } from '../components/ViewRenderer';
import { FilterPanel } from '../components/FilterPanel';
import { HierarchyViewModel, ViewMode } from '../models/HierarchyViewModel';
import { DebugUtils } from '../utils/DebugUtils';
import { IEntity, EntityType, EntityState } from '../models/Entity';
import { Task, TaskListType, TaskPriority } from '../models/Task';

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
    private DEBUG = true; // Activar mensajes de depuración
    
    constructor(leaf: WorkspaceLeaf, plugin: Plugin) {
        super(leaf);
        this.plugin = plugin;
        
        // Inicializar servicios
        this.log("Inicializando servicios del navegador de tareas");
        this.taskParser = new TaskParser();
        this.hierarchyBuilder = new TaskHierarchyBuilder(this.plugin);
        this.taskClassifier = new TaskClassifier();
        this.entityDetector = new EntityDetector(this.plugin);
        
        // Inicializar componentes de UI
        this.log("Inicializando componentes de UI");
        this.viewRenderer = new ViewRenderer();
        this.filterPanel = new FilterPanel((filters) => this.applyFilters(filters));
    }
    
    // Método para mostrar mensajes de depuración
    private log(message: string, data?: any): void {
        if (this.DEBUG) {
            console.log(`[TaskNavigator] ${message}`, data || '');
            // Opcionalmente, mostrar una notificación en la interfaz
            // new Notice(`[TaskNavigator] ${message}`);
        }
    }
    
    // Método para mostrar advertencias
    private warn(message: string, data?: any): void {
        if (this.DEBUG) {
            console.warn(`[TaskNavigator] ${message}`, data || '');
        }
    }
    
    // Método para mostrar errores
    private error(message: string, error?: any): void {
        console.error(`[TaskNavigator] ${message}`, error || '');
        if (this.DEBUG) {
            new Notice(`[TaskNavigator] Error: ${message}`);
        }
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
        this.log("Guardando estado de la vista");
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
        this.log("Restaurando estado de la vista", state);
        if (state.contextFile) {
            const file = this.app.vault.getAbstractFileByPath(state.contextFile);
            if (file instanceof TFile) {
                this.contextFile = file;
                this.log("Contexto restaurado", file.path);
            } else {
                this.warn("No se pudo restaurar el archivo de contexto", state.contextFile);
            }
        }
        
        // Restauramos los filtros y el modo de vista si están disponibles
        if (this.currentModel) {
            if (state.currentFilters) {
                this.currentModel.filters = state.currentFilters;
                this.log("Filtros restaurados", state.currentFilters);
            }
            
            if (state.viewMode) {
                this.currentModel.viewMode = state.viewMode;
                this.log("Modo de vista restaurado", state.viewMode);
            }
        }
    }
    
    /**
     * Se ejecuta cuando la vista se recarga (tras cambiar de pestaña y volver)
     */
    onload(): void {
        super.onload();
        this.log("onload() llamado - Vista recargada");
        
        // Actualizar la vista con el contexto guardado
        if (this.contextFile) {
            this.log("Actualizando vista con contexto guardado", this.contextFile.path);
            this.refreshView();
        } else {
            this.warn("No hay archivo de contexto guardado para actualizar la vista");
        }
    }
    
/**
 * Se ejecuta cuando la vista se abre
 */
async onOpen(): Promise<void> {
    try {
        // Mostrar versión detallada en la consola
        console.log("=====================================================");
        console.log("[TaskNavigator] ABRIENDO VISTA DE NAVEGACIÓN DE TAREAS");
        console.log("=====================================================");
        
        if (this.DEBUG) {
            console.log("[TaskNavigator] Modo de depuración ACTIVADO");
            console.log("[TaskNavigator] Información del entorno:");
            console.log("- Obsidian API version:", this.app.version);
            
            // Usar try/catch para evitar errores en la obtención de la ruta base
            try {
                console.log("- Ruta de la bóveda:", this.app.vault.adapter.basePath);
            } catch (e) {
                console.log("- Ruta de la bóveda: No disponible");
            }
            
            console.log("- Archivos en la bóveda:", this.app.vault.getMarkdownFiles().length);
            
            // Verificar que EntityType está correctamente importado antes de usarlo
            if (typeof EntityType !== 'undefined') {
                // Mostrar información de bibliotecas disponibles
                const entityTypes = Object.values(EntityType);
                console.log("- Tipos de entidad disponibles:", entityTypes);
            } else {
                console.log("- Tipos de entidad disponibles: No se pudo acceder a EntityType");
            }
            
            // Verificar integración de servicios
            console.log("- Servicios inicializados:");
            console.log("  * EntityDetector:", !!this.entityDetector);
            console.log("  * TaskParser:", !!this.taskParser);
            console.log("  * HierarchyBuilder:", !!this.hierarchyBuilder);
            console.log("  * TaskClassifier:", !!this.taskClassifier);
            
            // Mostrar notificación en la UI
            new Notice("TaskNavigator: Modo de depuración activado");
        }
        
        this.log("onOpen() llamado - Abriendo vista");
        // Mostrar mensaje de carga inicial
        this.contentEl.empty();
        this.contentEl.addClass('task-navigator-container');
        this.contentEl.createEl('div', { text: 'Cargando navegador de tareas...', cls: 'task-navigator-loading' });
        
        // Obtener el archivo de contexto desde el estado o usar el archivo activo actual
        if (this.leaf.getViewState().state?.contextFile) {
            const contextPath = this.leaf.getViewState().state.contextFile;
            this.log("Obteniendo archivo de contexto del estado", contextPath);
            const file = this.app.vault.getAbstractFileByPath(contextPath);
            if (file instanceof TFile) {
                this.contextFile = file;
                this.log("Archivo de contexto establecido desde el estado", file.path);
            } else {
                this.warn("No se pudo obtener el archivo de contexto del estado", contextPath);
            }
        } 
        
        // Si no hay archivo de contexto en el estado, usar el archivo activo actual
        if (!this.contextFile) {
            this.log("Intentando usar el archivo activo como contexto");
            this.contextFile = this.app.workspace.getActiveFile();
            if (this.contextFile) {
                this.log("Archivo activo establecido como contexto", this.contextFile.path);
            } else {
                this.warn("No hay archivo activo para usar como contexto");
            }
        }
        
        // Construir la vista inicial basada en el archivo de contexto
        await this.refreshView();
        
        // Configurar actualización periódica (cada 2 minutos)
        this.log("Configurando actualización periódica (2 minutos)");
        this.refreshInterval = window.setInterval(() => {
            this.log("Ejecutando actualización periódica");
            this.refreshView();
        }, 120000);
        
        // Registrar listeners para eventos personalizados
        this.registerCustomEvents();
    } catch (error) {
        console.error("[TaskNavigator] Error crítico en onOpen:", error);
        // Mostrar mensaje amigable al usuario
        this.contentEl.empty();
        const errorContainer = this.contentEl.createEl('div', { cls: 'task-navigator-error' });
        errorContainer.createEl('h3', { text: 'Error al iniciar el Navegador de Tareas' });
        errorContainer.createEl('p', { text: 'Se ha producido un error al iniciar el navegador de tareas.' });
        errorContainer.createEl('p', { text: `Detalles: ${error.message}` });
        errorContainer.createEl('p', { text: 'Consulta la consola de desarrollador para más información (Ctrl+Shift+I).' });
        
        // Sugerencia para resolver el problema
        const helpSection = errorContainer.createEl('div', { cls: 'task-navigator-help-section' });
        helpSection.createEl('h4', { text: 'Posibles soluciones:' });
        const suggestionsList = helpSection.createEl('ul');
        suggestionsList.createEl('li', { text: 'Reinicia Obsidian e intenta nuevamente.' });
        suggestionsList.createEl('li', { text: 'Verifica que tienes las últimas versiones de los módulos.' });
        suggestionsList.createEl('li', { text: 'Comprueba si hay tareas en la nota actual en formato correcto (- [ ] Texto de la tarea).' });
        
        // Botón para recargar
        const reloadButton = errorContainer.createEl('button', { 
            text: 'Intentar nuevamente', 
            cls: 'task-navigator-refresh-button' 
        });
        reloadButton.addEventListener('click', () => {
            this.refreshView();
        });
    }
}
    
    /**
     * Registra listeners para eventos personalizados
     */
    private registerCustomEvents(): void {
        this.log("Registrando eventos personalizados");
        // Evento para enfocar en una entidad específica
        document.addEventListener('task-navigator-focus-entity', this.handleFocusEntity);
        
        // Evento para mostrar tareas vencidas
        document.addEventListener('task-navigator-show-overdue', this.handleShowOverdue);
        
        // Evento para actualizar la vista
        this.contentEl.addEventListener('task-navigator-refresh', () => {
            this.log("Evento task-navigator-refresh recibido");
            this.refreshView();
        });
        
        // Evento para cambiar el modo de vista
        this.contentEl.addEventListener('task-navigator-view-change', (event: CustomEvent) => {
            this.log("Evento task-navigator-view-change recibido", event.detail);
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
        this.log("onClose() llamado - Cerrando vista");
        // Limpiar el intervalo de actualización
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
            this.log("Intervalo de actualización eliminado");
        }
        
        // Limpiar listeners personalizados
        document.removeEventListener('task-navigator-focus-entity', this.handleFocusEntity);
        document.removeEventListener('task-navigator-show-overdue', this.handleShowOverdue);
        this.log("Eventos personalizados eliminados");
    }
    
 /**
 * Actualiza la vista con los datos más recientes
 */
async refreshView(): Promise<void> {
    this.log("refreshView() llamado - Actualizando vista");
    
    // Contenedor para mensajes de carga
    const loadingIndicator = this.contentEl.createEl('div', { 
        cls: 'task-navigator-loading'
    });
    const loadingSpinner = loadingIndicator.createEl('div', {
        cls: 'task-navigator-spinner'
    });
    const loadingText = loadingIndicator.createEl('div', {
        text: 'Actualizando datos...'
    });
    
    try {
        // Mostrar progreso
        const updateLoadingText = (text: string) => {
            loadingText.textContent = text;
        };
        
        // Detectar el tipo de entidad del archivo de contexto
        let entityContext = null;
        if (this.contextFile) {
            updateLoadingText("Detectando tipo de entidad del archivo de contexto...");
            this.log("Detectando tipo de entidad del archivo de contexto", this.contextFile.path);
            
            try {
                entityContext = await this.entityDetector.detectEntityFromFile(this.contextFile);
                if (entityContext) {
                    this.log("Entidad de contexto detectada", {
                        type: entityContext.type,
                        title: entityContext.title,
                        file: entityContext.file.path
                    });
                    updateLoadingText(`Entidad detectada: ${entityContext.title} (${entityContext.type})`);
                } else {
                    this.warn("No se pudo detectar una entidad para el archivo de contexto");
                    updateLoadingText("No se pudo detectar una entidad específica. Mostrando vista global.");
                }
            } catch (e) {
                this.error("Error al detectar entidad", e);
                updateLoadingText("Error al detectar entidad. Continuando con vista global.");
            }
        } else {
            this.warn("No hay archivo de contexto para detectar entidad");
            updateLoadingText("No hay archivo de contexto. Mostrando vista global.");
        }
        
        // Verificación directa de tareas en el archivo de contexto aunque no se detecte como entidad
        if (this.contextFile && !entityContext) {
            this.log("Verificando tareas directamente en el archivo de contexto");
            updateLoadingText("Verificando tareas directamente en el archivo...");
            
            try {
                const tasks = await this.taskParser.extractTasksFromFile(this.contextFile);
                if (tasks.length > 0) {
                    this.log(`Se encontraron ${tasks.length} tareas directamente en el archivo`);
                    
                    // Crear una entidad genérica para contener estas tareas
                    // Esto permitirá mostrar las tareas aunque no se reconozca el tipo de entidad
                    entityContext = {
                        id: this.contextFile.basename,
                        type: EntityType.UNKNOWN,
                        title: this.contextFile.basename,
                        description: "Archivo con tareas",
                        file: this.contextFile,
                        state: EntityState.UNKNOWN,
                        tasks: tasks,
                        children: [],
                        metadata: {},
                        getTotalTaskCount: () => tasks.length,
                        getPendingTaskCount: () => tasks.filter(t => !t.completed).length,
                        addTask: (task) => { /* no-op */ },
                        addChild: (child) => { /* no-op */ }
                    };
                    
                    this.log("Creada entidad genérica con tareas:", {
                        title: entityContext.title,
                        tasks: entityContext.tasks.length
                    });
                } else {
                    this.warn("No se encontraron tareas directamente en el archivo");
                }
            } catch (e) {
                this.error("Error al verificar tareas directamente", e);
            }
        }
        
        // Construir el modelo de jerarquía
        updateLoadingText("Construyendo modelo de jerarquía...");
        this.log("Construyendo modelo de jerarquía");
        this.currentModel = await this.hierarchyBuilder.buildHierarchy(entityContext);
        
        if (this.currentModel) {
            updateLoadingText(`Modelo construido con ${this.currentModel.allEntities.length} entidades.`);
            this.log("Modelo de jerarquía construido", {
                entitiesCount: this.currentModel.allEntities.length,
                rootEntitiesCount: this.currentModel.rootEntities.length,
                focusEntity: this.currentModel.focusEntity ? this.currentModel.focusEntity.title : 'ninguna'
            });
            
            // Clasificar las tareas según reglas GTD
            updateLoadingText("Clasificando tareas según reglas GTD...");
            this.log("Clasificando tareas según reglas GTD");
            await this.taskClassifier.classifyTasks(this.currentModel);
            
            // Comprobar si hay tareas
            const totalTasks = this.currentModel.allTasks.length;
            updateLoadingText(`Clasificación completada: ${totalTasks} tareas encontradas.`);
            this.log("Tareas clasificadas", {
                totalTasks: totalTasks,
                inboxTasks: this.currentModel.gtdLists.get('inbox')?.length || 0,
                nextActionsTasks: this.currentModel.gtdLists.get('nextActions')?.length || 0,
                // Mostrar otras listas GTD...
            });
            
            // Debug: Mostrar una alerta si no se encuentran tareas
            if (totalTasks === 0 && this.DEBUG) {
                console.warn("[TaskNavigator] ALERTA: No se encontraron tareas en el modelo");
                if (entityContext) {
                    console.warn("[TaskNavigator] Archivo de contexto:", entityContext.file.path);
                    console.warn("[TaskNavigator] Contenido de la entidad:", await this.app.vault.read(entityContext.file));
                }
            }
            
            // Volcar información detallada para depuración
            if (this.DEBUG) {
                console.log("=== VOLCADO DETALLADO DEL MODELO DE JERARQUÍA ===");
                DebugUtils.dumpModelInfo(this.currentModel);
                console.log("=== FIN DEL VOLCADO ===");
            }
            
            // Mostrar información de tareas para la entidad focal
            if (this.DEBUG && entityContext) {
                console.log("=== TAREAS EN LA ENTIDAD FOCAL ===");
                entityContext.tasks.forEach(task => {
                    console.log(`Tarea: "${task.text}", Completada: ${task.completed}, Lista: ${task.listType || 'Sin clasificar'}`);
                });
                console.log("=== FIN DE TAREAS EN ENTIDAD FOCAL ===");
            }
            
            // Restaurar filtros del estado si existen
            const state = this.leaf.getViewState().state;
            if (state?.currentFilters) {
                this.log("Restaurando filtros del estado", state.currentFilters);
                this.currentModel.filters = state.currentFilters;
            } else {
                // Si no hay filtros guardados, establecer filtros por defecto
                // que garanticen que se muestren todas las entidades y tareas
                this.log("Estableciendo filtros por defecto para mostrar todo");
                this.currentModel.filters = {
                    showCompleted: true,        // Mostrar tareas completadas
                    showActive: true,           // Mostrar entidades activas
                    showPaused: true,           // Mostrar entidades pausadas
                    showStopped: true,          // Mostrar entidades detenidas
                    showArchived: true,         // Mostrar entidades archivadas
                    
                    showAreasVida: true,        // Mostrar Áreas de Vida
                    showAreasInteres: true,     // Mostrar Áreas de Interés 
                    showProyectosQ: true,       // Mostrar Proyectos Q
                    showProyectosGTD: true,     // Mostrar Proyectos GTD
                    showOtherEntities: true,    // Mostrar otras entidades
                    
                    contexts: [],               // Sin filtro de contextos específicos
                    people: [],                 // Sin filtro de personas específicas
                    
                    enabledLists: Object.values(TaskListType), // Todas las listas GTD
                    
                    searchText: '',             // Sin texto de búsqueda
                    daysRange: 30               // Mayor rango de días
                };
            }
            
            // Restaurar modo de vista
            if (state?.viewMode) {
                this.log("Restaurando modo de vista del estado", state.viewMode);
                this.currentModel.viewMode = state.viewMode;
            }
            
            // Aplicar filtros para actualizar el modelo filtrado
            this.currentModel.applyFilters(this.currentModel.filters);
        } else {
            this.warn("No se pudo construir el modelo de jerarquía");
            updateLoadingText("Error al construir el modelo de jerarquía.");
        }
        
        // Limpiar la vista actual
        this.contentEl.empty();
        
        // Renderizar la nueva vista
        this.renderCurrentView();
        
    } catch (error) {
        this.error('Error al actualizar vista de TaskNavigator', error);
        this.contentEl.empty();
        
        // Crear un mensaje de error detallado
        const errorEl = this.contentEl.createEl('div', {
            cls: 'task-navigator-error'
        });
        
        errorEl.createEl('h3', { text: 'Error al actualizar el Navegador de Tareas' });
        errorEl.createEl('p', { text: `Mensaje: ${error.message}` });
        
        // Mostrar la pila de llamadas si está disponible
        if (error.stack) {
            const stackContainer = errorEl.createEl('details');
            stackContainer.createEl('summary', { text: 'Detalles técnicos (para desarrolladores)' });
            const pre = stackContainer.createEl('pre');
            pre.createEl('code', { text: error.stack });
        }
        
        // Botón para reintentar
        const retryButton = errorEl.createEl('button', {
            text: 'Reintentar',
            cls: 'task-navigator-refresh-button'
        });
        
        retryButton.addEventListener('click', () => {
            this.refreshView();
        });
    }
}
    
    /**
     * Renderiza la vista con el modelo actual
     */
    private renderCurrentView(): void {
        this.log("renderCurrentView() llamado - Renderizando vista");
        if (!this.currentModel) {
            this.warn("No hay modelo para renderizar");
            return;
        }
        
        // Limpiar la vista actual
        this.contentEl.empty();
        
        // Renderizar la nueva vista
        this.log("Renderizando vista con ViewRenderer");
        this.viewRenderer.render(this.contentEl, this.currentModel, this.filterPanel);
    }
    
    /**
     * Aplica los filtros seleccionados por el usuario
     */
    private applyFilters(filters: any): void {
        this.log("applyFilters() llamado - Aplicando filtros", filters);
        if (!this.currentModel) {
            this.warn("No hay modelo para aplicar filtros");
            return;
        }
        
        // Aplicar filtros al modelo actual
        this.currentModel.applyFilters(filters);
        
        // Re-renderizar la vista con los filtros aplicados
        this.renderCurrentView();
    }
    
    // Handlers para eventos personalizados (definidos como propiedades de clase para poder eliminarlos)
    private handleFocusEntity = (event: CustomEvent) => {
        this.log("handleFocusEntity() llamado - Evento recibido", event.detail);
        if (event.detail?.filePath) {
            const file = this.app.vault.getAbstractFileByPath(event.detail.filePath);
            if (file instanceof TFile) {
                this.log("Nuevo archivo de contexto establecido", file.path);
                this.contextFile = file;
                this.refreshView();
            } else {
                this.warn("No se pudo encontrar el archivo para enfocar", event.detail.filePath);
            }
        }
    };
    
    private handleShowOverdue = async () => {
        this.log("handleShowOverdue() llamado - Mostrando tareas vencidas");
        try {
            // Aquí podría integrarse con el TaskManagerIntegration para cargar tareas vencidas
            // por ejemplo:
            // const taskManagerIntegration = this.plugin.taskNavigatorModule.getTaskManagerIntegration();
            // const overdueTasks = await taskManagerIntegration.loadOverdueTasks();
            
            // Por ahora, simplemente actualizamos la vista y aplicamos un filtro
            await this.refreshView();
            
            if (this.currentModel) {
                // Filtrar para mostrar solo tareas vencidas
                this.log("Aplicando filtro para tareas vencidas");
                this.currentModel.applyFilters({
                    searchText: "vencida", // Esto es un ejemplo simple
                    // Otros filtros necesarios...
                });
                
                this.renderCurrentView();
            } else {
                this.warn("No hay modelo para mostrar tareas vencidas");
            }
        } catch (error) {
            this.error("Error al mostrar tareas vencidas", error);
        }
    };
}