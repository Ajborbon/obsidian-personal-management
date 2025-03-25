// src/modules/taskNavigator/models/HierarchyViewModel.ts

import { IEntity, EntityType } from './Entity';
import { Task, TaskListType } from './Task';

/**
 * Modos de visualización para el navegador de tareas
 */
export enum ViewMode {
    HIERARCHY = 'hierarchy',     // Vista jerárquica (por estructura)
    GTD_LISTS = 'gtdLists',      // Vista de listas GTD
    COMBINED = 'combined'        // Vista combinada
}

/**
 * Opciones de filtrado para la visualización
 */
export interface FilterOptions {
    // Filtros generales
    showCompleted: boolean;      // Mostrar tareas completadas
    showActive: boolean;         // Mostrar entidades activas (🟢)
    showPaused: boolean;         // Mostrar entidades pausadas (🟡)
    showStopped: boolean;        // Mostrar entidades detenidas (🔴)
    showArchived: boolean;       // Mostrar entidades archivadas (🔵)
    
    // Filtros por tipo de entidad
    showAreasVida: boolean;      // Mostrar Áreas de Vida
    showAreasInteres: boolean;   // Mostrar Áreas de Interés
    showProyectosQ: boolean;     // Mostrar Proyectos Q
    showProyectosGTD: boolean;   // Mostrar Proyectos GTD
    showOtherEntities: boolean;  // Mostrar otras entidades
    
    // Filtros por contexto
    contexts: string[];          // Contextos a mostrar (#cx-)
    people: string[];            // Personas a mostrar (#px-)
    
    // Filtros por listas GTD
    enabledLists: TaskListType[]; // Listas GTD habilitadas
    
    // Otros filtros
    searchText: string;          // Texto de búsqueda
    daysRange: number;           // Rango de días para mostrar tareas por fecha
}

/**
 * Modelo para la vista jerárquica
 */
export class HierarchyViewModel {
    // Entidad en foco (la nota activa actual)
    focusEntity: IEntity | null = null;
    
    // Entidades raíz para la jerarquía
    rootEntities: IEntity[] = [];
    
    // Todas las entidades disponibles
    allEntities: IEntity[] = [];
    
    // Todas las tareas clasificadas por tipo de lista GTD
    gtdLists: Map<TaskListType, Task[]> = new Map();
    
    // Todas las tareas sin clasificar
    allTasks: Task[] = [];
    
    // Modo de visualización actual
    viewMode: ViewMode = ViewMode.HIERARCHY;
    
    // Filtros aplicados actualmente
    filters: FilterOptions;
    
    // Resultados filtrados (para mostrar)
    filteredEntities: IEntity[] = [];
    filteredTasks: Map<TaskListType, Task[]> = new Map();
    
    constructor() {
        // Inicializar filtros por defecto
        this.filters = {
            showCompleted: false,
            showActive: true,
            showPaused: true,
            showStopped: false,
            showArchived: false,
            
            showAreasVida: true,
            showAreasInteres: true,
            showProyectosQ: true,
            showProyectosGTD: true,
            showOtherEntities: true,
            
            contexts: [],
            people: [],
            
            enabledLists: Object.values(TaskListType),
            
            searchText: '',
            daysRange: 7
        };
    }
    
    /**
     * Aplica los filtros seleccionados a las entidades y tareas
     */
    applyFilters(filters: Partial<FilterOptions>): void {
        // Actualizar filtros con los nuevos valores
        this.filters = { ...this.filters, ...filters };
        
        // Filtrar entidades según los criterios
        this.filteredEntities = this.filterEntities(this.rootEntities);
        
        // Filtrar tareas según los criterios
        this.filteredTasks = new Map();
        for (const listType of Object.values(TaskListType)) {
            const tasks = this.gtdLists.get(listType) || [];
            const filteredTasks = this.filterTasks(tasks);
            
            if (this.filters.enabledLists.includes(listType)) {
                this.filteredTasks.set(listType, filteredTasks);
            }
        }
    }
    
    /**
     * Filtra un conjunto de entidades y sus hijos recursivamente
     */
    private filterEntities(entities: IEntity[]): IEntity[] {
        const result: IEntity[] = [];
        
        for (const entity of entities) {
            // Verificar si el tipo de entidad está habilitado en los filtros
            if (!this.isEntityTypeEnabled(entity.type)) {
                continue;
            }
            
            // Verificar si el estado de la entidad está habilitado en los filtros
            if (!this.isEntityStateEnabled(entity.state)) {
                continue;
            }
            
            // Verificar si la entidad coincide con el texto de búsqueda
            if (this.filters.searchText && !this.matchesSearchText(entity)) {
                continue;
            }
            
            // Clonar la entidad para no modificar la original
            const filteredEntity = { ...entity };
            
            // Filtrar hijos recursivamente
            filteredEntity.children = this.filterEntities(entity.children);
            
            // Filtrar tareas de la entidad
            filteredEntity.tasks = this.filterTasks(entity.tasks);
            
            // Añadir la entidad filtrada al resultado si tiene hijos o tareas
            if (filteredEntity.children.length > 0 || filteredEntity.tasks.length > 0 || entity === this.focusEntity) {
                result.push(filteredEntity);
            }
        }
        
        return result;
    }
    
    /**
     * Filtra un conjunto de tareas según los criterios
     */
    private filterTasks(tasks: Task[]): Task[] {
        return tasks.filter(task => {
            // Verificar si se muestran tareas completadas
            if (task.completed && !this.filters.showCompleted) {
                return false;
            }
            
            // Verificar si la tarea coincide con el texto de búsqueda
            if (this.filters.searchText && !this.taskMatchesSearchText(task)) {
                return false;
            }
            
            // Filtrar por contextos si se han especificado
            if (this.filters.contexts.length > 0) {
                const hasMatchingContext = this.filters.contexts.some(ctx => 
                    task.tags.contexts.includes(ctx));
                if (!hasMatchingContext) {
                    return false;
                }
            }
            
            // Filtrar por personas asignadas si se han especificado
            if (this.filters.people.length > 0) {
                const hasMatchingPerson = this.filters.people.some(person => 
                    task.tags.people.includes(person));
                if (!hasMatchingPerson) {
                    return false;
                }
            }
            
            // Filtrar por rango de días para fechas
            if (task.timing.dueDate || task.timing.scheduledDate) {
                const daysUntilDue = task.getDaysUntilDue();
                if (daysUntilDue !== null && Math.abs(daysUntilDue) > this.filters.daysRange) {
                    return false;
                }
            }
            
            return true;
        });
    }
    
    /**
     * Comprueba si el tipo de entidad está habilitado en los filtros
     */
    private isEntityTypeEnabled(type: EntityType): boolean {
        switch (type) {
            case EntityType.AREA_VIDA:
                return this.filters.showAreasVida;
            case EntityType.AREA_INTERES:
                return this.filters.showAreasInteres;
            case EntityType.PROYECTO_Q:
                return this.filters.showProyectosQ;
            case EntityType.PROYECTO_GTD:
                return this.filters.showProyectosGTD;
            default:
                return this.filters.showOtherEntities;
        }
    }
    
    /**
     * Comprueba si el estado de la entidad está habilitado en los filtros
     */
    private isEntityStateEnabled(state: string): boolean {
        switch (state) {
            case '🟢':
                return this.filters.showActive;
            case '🟡':
                return this.filters.showPaused;
            case '🔴':
                return this.filters.showStopped;
            case '🔵':
                return this.filters.showArchived;
            default:
                return true; // Si no tiene estado, mostrar por defecto
        }
    }
    
    /**
     * Comprueba si la entidad coincide con el texto de búsqueda
     */
    private matchesSearchText(entity: IEntity): boolean {
        const searchText = this.filters.searchText.toLowerCase();
        return entity.title.toLowerCase().includes(searchText) || 
               entity.description.toLowerCase().includes(searchText);
    }
    
    /**
     * Comprueba si la tarea coincide con el texto de búsqueda
     */
    private taskMatchesSearchText(task: Task): boolean {
        const searchText = this.filters.searchText.toLowerCase();
        return task.text.toLowerCase().includes(searchText);
    }
}

// DEVELOPMENT_CHECKPOINT: "hierarchy_view_model"
// Descripción: Implementación del modelo para la vista jerárquica con filtros
// Estado: Completo