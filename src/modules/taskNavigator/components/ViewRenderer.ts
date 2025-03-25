// src/modules/taskNavigator/components/ViewRenderer.ts

import { HierarchyViewModel, ViewMode, FilterOptions } from '../models/HierarchyViewModel';
import { FilterPanel } from './FilterPanel';
import { IEntity, EntityType, EntityState } from '../models/Entity';
import { Task, TaskListType, TaskPriority, LineInfo } from '../models/Task';
import { NavigationUtils } from '../utils/NavigationUtils';

/**
 * Componente para renderizar la vista de navegación de tareas
 */
export class ViewRenderer {
    private navigationUtils: NavigationUtils;
    
    constructor() {
        this.navigationUtils = new NavigationUtils();
    }
    
    /**
     * Renderiza la vista completa del navegador de tareas
     */
    render(containerEl: HTMLElement, model: HierarchyViewModel, filterPanel: FilterPanel): void {
        // Limpiar el contenedor
        containerEl.empty();
        containerEl.addClass('task-navigator-container');
        
        // Crear la estructura principal
        const header = this.createHeader(containerEl, model);
        const viewOptions = this.createViewOptions(containerEl, model);
        const contentContainer = containerEl.createDiv({ cls: 'task-navigator-content' });
        
        // Renderizar el panel de filtros
        const filterContainer = containerEl.createDiv({ cls: 'task-navigator-filter-container' });
        filterPanel.render(filterContainer);
        
        // Renderizar el contenido según el modo de visualización
        switch (model.viewMode) {
            case ViewMode.HIERARCHY:
                this.renderHierarchyView(contentContainer, model);
                break;
            case ViewMode.GTD_LISTS:
                this.renderGTDListsView(contentContainer, model);
                break;
            case ViewMode.COMBINED:
                this.renderCombinedView(contentContainer, model);
                break;
        }
    }
    
    /**
     * Crea el encabezado de la vista
     */
    private createHeader(containerEl: HTMLElement, model: HierarchyViewModel): HTMLElement {
        const header = containerEl.createDiv({ cls: 'task-navigator-header' });
        
        // Título principal
        header.createEl('h1', { 
            text: 'Navegador de Tareas GTD',
            cls: 'task-navigator-title'
        });
        
        // Subtítulo con contexto actual
        const subtitle = header.createEl('div', { cls: 'task-navigator-subtitle' });
        
        if (model.focusEntity) {
            const entityName = model.focusEntity.title;
            const entityType = this.getEntityTypeLabel(model.focusEntity.type);
            subtitle.createSpan({ text: `Contexto: ${entityType} - ${entityName}` });
            
            // Botón para abrir la entidad en foco
            const openButton = subtitle.createEl('button', {
                cls: 'task-navigator-open-button',
                text: 'Abrir'
            });
            openButton.addEventListener('click', () => {
                this.navigationUtils.openEntityInNewLeaf(model.focusEntity.file);
            });
        } else {
            subtitle.createSpan({ text: 'Mostrando vista global' });
        }
        
        // Estadísticas
        const stats = header.createDiv({ cls: 'task-navigator-stats' });
        
        const totalEntities = model.allEntities.length;
        const totalTasks = model.allTasks.length;
        const completedTasks = model.allTasks.filter(task => task.completed).length;
        const pendingTasks = totalTasks - completedTasks;
        
        stats.createEl('span', { 
            text: `${totalEntities} entidades | ${pendingTasks}/${totalTasks} tareas pendientes`,
            cls: 'task-navigator-stats-text'
        });
        
        // Botón de actualización
        const refreshButton = header.createEl('button', {
            cls: 'task-navigator-refresh-button',
            text: 'Actualizar'
        });
        refreshButton.addEventListener('click', () => {
            // Evento personalizado para solicitar actualización
            containerEl.dispatchEvent(new CustomEvent('task-navigator-refresh'));
        });
        
        return header;
    }
    
    /**
     * Crea los botones de opciones de vista
     */
    private createViewOptions(containerEl: HTMLElement, model: HierarchyViewModel): HTMLElement {
        const viewOptions = containerEl.createDiv({ cls: 'task-navigator-view-options' });
        
        // Botón para vista jerárquica
        const hierarchyButton = viewOptions.createEl('button', {
            cls: `task-navigator-view-button ${model.viewMode === ViewMode.HIERARCHY ? 'active' : ''}`,
            text: 'Vista Jerárquica'
        });
        hierarchyButton.addEventListener('click', () => {
            // Evento personalizado para cambiar el modo de vista
            containerEl.dispatchEvent(new CustomEvent('task-navigator-view-change', {
                detail: { viewMode: ViewMode.HIERARCHY }
            }));
        });
        
        // Botón para vista de listas GTD
        const gtdListsButton = viewOptions.createEl('button', {
            cls: `task-navigator-view-button ${model.viewMode === ViewMode.GTD_LISTS ? 'active' : ''}`,
            text: 'Listas GTD'
        });
        gtdListsButton.addEventListener('click', () => {
            containerEl.dispatchEvent(new CustomEvent('task-navigator-view-change', {
                detail: { viewMode: ViewMode.GTD_LISTS }
            }));
        });
        
        // Botón para vista combinada
        const combinedButton = viewOptions.createEl('button', {
            cls: `task-navigator-view-button ${model.viewMode === ViewMode.COMBINED ? 'active' : ''}`,
            text: 'Vista Combinada'
        });
        combinedButton.addEventListener('click', () => {
            containerEl.dispatchEvent(new CustomEvent('task-navigator-view-change', {
                detail: { viewMode: ViewMode.COMBINED }
            }));
        });
        
        return viewOptions;
    }
    
    /**
     * Renderiza la vista jerárquica
     */
    private renderHierarchyView(containerEl: HTMLElement, model: HierarchyViewModel): void {
        // Contenedor para el árbol jerárquico
        const hierarchyTree = containerEl.createDiv({ cls: 'hierarchy-tree-container' });
        
        // Si no hay entidades filtradas, mostrar mensaje
        if (model.filteredEntities.length === 0) {
            hierarchyTree.createEl('div', {
                cls: 'hierarchy-tree-empty',
                text: 'No hay entidades que coincidan con los filtros aplicados.'
            });
            return;
        }
        
        // Crear el árbol a partir de las entidades filtradas
        this.renderEntityTree(hierarchyTree, model.filteredEntities, 0);
    }
    
    /**
     * Renderiza la vista de listas GTD
     */
    private renderGTDListsView(containerEl: HTMLElement, model: HierarchyViewModel): void {
        // Contenedor para las listas GTD
        const gtdListsContainer = containerEl.createDiv({ cls: 'gtd-lists-container' });
        
        // Si no hay listas habilitadas, mostrar mensaje
        if (model.filters.enabledLists.length === 0) {
            gtdListsContainer.createEl('div', {
                cls: 'gtd-lists-empty',
                text: 'No hay listas GTD habilitadas en los filtros.'
            });
            return;
        }
        
        // Renderizar cada lista GTD habilitada
        for (const listType of model.filters.enabledLists) {
            const tasks = model.filteredTasks.get(listType) || [];
            this.renderGTDList(gtdListsContainer, listType, tasks);
        }
    }
    
    /**
     * Renderiza la vista combinada (jerarquía + listas GTD)
     */
    private renderCombinedView(containerEl: HTMLElement, model: HierarchyViewModel): void {
        // Crear contenedor de dos columnas
        const combinedContainer = containerEl.createDiv({ cls: 'combined-view-container' });
        
        // Columna izquierda: Árbol jerárquico
        const hierarchyColumn = combinedContainer.createDiv({ cls: 'combined-view-column hierarchy-column' });
        hierarchyColumn.createEl('h2', { text: 'Jerarquía', cls: 'combined-view-title' });
        this.renderHierarchyView(hierarchyColumn, model);
        
        // Columna derecha: Listas GTD
        const gtdColumn = combinedContainer.createDiv({ cls: 'combined-view-column gtd-column' });
        gtdColumn.createEl('h2', { text: 'Listas GTD', cls: 'combined-view-title' });
        this.renderGTDListsView(gtdColumn, model);
    }
    
    /**
     * Renderiza recursivamente el árbol de entidades
     */
    private renderEntityTree(container: HTMLElement, entities: IEntity[], level: number): void {
        const treeList = container.createEl('ul', { cls: `hierarchy-tree-list level-${level}` });
        
        for (const entity of entities) {
            // Crear el elemento de lista para la entidad
            const treeItem = treeList.createEl('li', { cls: 'hierarchy-tree-item' });
            
            // Contenedor para el encabezado de la entidad
            const header = treeItem.createDiv({ cls: `hierarchy-tree-entity entity-type-${entity.type.toLowerCase()}` });
            
            // Información básica de la entidad
            const entityInfo = header.createDiv({ cls: 'hierarchy-tree-entity-info' });
            
            // Icono de expansión
            const expandIcon = entityInfo.createSpan({ cls: 'hierarchy-tree-expand-icon', text: '▼' });
            expandIcon.setAttribute('aria-expanded', 'true');
            expandIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                
                const isExpanded = expandIcon.getAttribute('aria-expanded') === 'true';
                expandIcon.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
                expandIcon.textContent = isExpanded ? '▶' : '▼';
                
                // Mostrar/ocultar contenido
                const content = treeItem.querySelector('.hierarchy-tree-content');
                if (content) {
                    content.toggleClass('collapsed', !isExpanded);
                }
            });
            
            // Estado de la entidad
            if (entity.state) {
                entityInfo.createSpan({ 
                    cls: `entity-state state-${this.getEntityStateClass(entity.state)}`,
                    text: entity.state
                });
            }
            
            // Tipo de entidad
            entityInfo.createSpan({ 
                cls: 'entity-type',
                text: this.getEntityTypeLabel(entity.type)
            });
            
            // Título de la entidad (con enlace)
            const titleLink = entityInfo.createEl('a', { 
                cls: 'entity-title',
                text: entity.title
            });
            titleLink.addEventListener('click', () => {
                this.navigationUtils.openEntityInNewLeaf(entity.file);
            });
            
            // Contador de tareas
            const taskCount = entity.tasks.filter(task => !task.completed).length;
            if (taskCount > 0) {
                entityInfo.createSpan({ 
                    cls: 'entity-task-count',
                    text: `${taskCount}`
                });
            }
            
            // Contenedor para las tareas y entidades hijas
            const content = treeItem.createDiv({ cls: 'hierarchy-tree-content' });
            
            // Renderizar tareas de la entidad
            if (entity.tasks.length > 0) {
                this.renderTasksList(content, entity.tasks, entity);
            }
            
            // Renderizar entidades hijas (recursivamente)
            if (entity.children && entity.children.length > 0) {
                this.renderEntityTree(content, entity.children, level + 1);
            }
        }
    }
    
    /**
     * Renderiza una lista de tareas para una entidad
     */
    private renderTasksList(container: HTMLElement, tasks: Task[], parentEntity: IEntity): void {
        // Contenedor para la lista de tareas
        const tasksContainer = container.createDiv({ cls: 'entity-tasks-container' });
        
        // Título de la sección de tareas
        tasksContainer.createEl('h3', { 
            cls: 'entity-tasks-title',
            text: 'Tareas'
        });
        
        // Filtrar tareas completadas según configuración
        const filteredTasks = tasks.filter(task => !task.completed);
        
        if (filteredTasks.length === 0) {
            tasksContainer.createEl('div', { 
                cls: 'entity-tasks-empty',
                text: 'No hay tareas pendientes'
            });
            return;
        }
        
        // Lista de tareas
        const tasksList = tasksContainer.createEl('ul', { cls: 'entity-tasks-list' });
        
        // Renderizar cada tarea
        for (const task of filteredTasks) {
            this.renderTaskItem(tasksList, task, parentEntity);
        }
    }
    
    /**
     * Renderiza un elemento de tarea
     */
    private renderTaskItem(container: HTMLElement, task: Task, parentEntity: IEntity): void {
        const taskItem = container.createEl('li', { 
            cls: `task-item ${task.completed ? 'task-completed' : ''} ${task.isBlocked ? 'task-blocked' : ''}`
        });
        
        // Contenedor de información de la tarea
        const taskInfo = taskItem.createDiv({ cls: 'task-info' });
        
        // Checkbox de estado (solo visual, no funcional)
        taskInfo.createSpan({ 
            cls: `task-checkbox ${task.completed ? 'checked' : ''}`,
            text: task.completed ? '✓' : ' '
        });
        
        // Indicador de prioridad
        if (task.priority !== TaskPriority.NORMAL) {
            taskInfo.createSpan({ 
                cls: `task-priority priority-${task.priority}`,
                text: this.getPriorityIcon(task.priority)
            });
        }
        
        // Texto de la tarea
        const taskText = taskInfo.createSpan({ 
            cls: 'task-text',
            text: task.text
        });
        
        // Hacer clic en la tarea abre el archivo en la posición
        taskItem.addEventListener('click', () => {
            this.navigationUtils.openTaskInEntity(task.file, task.lineInfo.number);
        });
        
        // Indicadores de fecha
        if (task.timing.dueDate || task.timing.scheduledDate) {
            const dateClass = task.isOverdue() ? 'task-date-overdue' : 
                             (task.isForToday() ? 'task-date-today' : 'task-date-future');
            
            let dateText = '';
            if (task.timing.dueDate) {
                dateText = `📅 ${task.timing.dueDate}`;
            } else if (task.timing.scheduledDate) {
                dateText = `⏳ ${task.timing.scheduledDate}`;
            }
            
            taskInfo.createSpan({ 
                cls: `task-date ${dateClass}`,
                text: dateText
            });
        }
        
        // Contenedor para metadatos adicionales
        const taskMeta = taskItem.createDiv({ cls: 'task-meta' });
        
        // Lista GTD
        if (task.listType) {
            taskMeta.createSpan({ 
                cls: `task-list-type list-${task.listType}`,
                text: this.getListTypeLabel(task.listType)
            });
        }
        
        // Contextos
        if (task.tags.contexts.length > 0) {
            const contextsContainer = taskMeta.createDiv({ cls: 'task-contexts' });
            contextsContainer.createSpan({ cls: 'task-meta-label', text: 'Contextos:' });
            
            for (const context of task.tags.contexts) {
                contextsContainer.createSpan({ 
                    cls: 'task-context-tag',
                    text: context
                });
            }
        }
        
        // Personas asignadas
        if (task.tags.people.length > 0) {
            const peopleContainer = taskMeta.createDiv({ cls: 'task-people' });
            peopleContainer.createSpan({ cls: 'task-meta-label', text: 'Asignada a:' });
            
            for (const person of task.tags.people) {
                peopleContainer.createSpan({ 
                    cls: 'task-person-tag',
                    text: person
                });
            }
        }
        
        // Mensaje de bloqueo si corresponde
        if (task.isBlocked && task.blockReason) {
            taskMeta.createDiv({ 
                cls: 'task-block-reason',
                text: task.blockReason
            });
        }
    }
    
    /**
     * Renderiza una lista GTD
     */
    private renderGTDList(container: HTMLElement, listType: TaskListType, tasks: Task[]): void {
        // Contenedor para la lista GTD
        const listContainer = container.createDiv({ cls: `gtd-list gtd-list-${listType}` });
        
        // Encabezado de la lista
        const listHeader = listContainer.createDiv({ cls: 'gtd-list-header' });
        
        // Título con contador
        listHeader.createEl('h2', { 
            cls: 'gtd-list-title',
            text: `${this.getListTypeLabel(listType)} (${tasks.length})`
        });
        
        // Descripción de la lista
        listHeader.createEl('div', { 
            cls: 'gtd-list-description',
            text: this.getListTypeDescription(listType)
        });
        
        // Si no hay tareas, mostrar mensaje
        if (tasks.length === 0) {
            listContainer.createEl('div', { 
                cls: 'gtd-list-empty',
                text: 'No hay tareas en esta lista'
            });
            return;
        }
        
        // Lista de tareas
        const tasksList = listContainer.createEl('ul', { cls: 'gtd-tasks-list' });
        
        // Organizar tareas según la lista
        const sortedTasks = this.sortTasksForList(tasks, listType);
        
        // Renderizar cada tarea
        for (const task of sortedTasks) {
            this.renderGTDTaskItem(tasksList, task);
        }
    }
    
    /**
     * Renderiza un elemento de tarea para una lista GTD
     */
    private renderGTDTaskItem(container: HTMLElement, task: Task): void {
        const taskItem = container.createEl('li', { 
            cls: `gtd-task-item ${task.completed ? 'task-completed' : ''} ${task.isBlocked ? 'task-blocked' : ''}`
        });
        
        // Información de entidad padre
        if (task.parentEntity) {
            const entityInfo = taskItem.createDiv({ cls: 'gtd-task-entity-info' });
            
            // Estado de la entidad
            if (task.parentEntity.state) {
                entityInfo.createSpan({ 
                    cls: `entity-state state-${this.getEntityStateClass(task.parentEntity.state)}`,
                    text: task.parentEntity.state
                });
            }
            
            // Tipo y título de la entidad
            const entityLink = entityInfo.createEl('a', { 
                cls: 'entity-link',
                text: `${this.getEntityTypeLabel(task.parentEntity.type)}: ${task.parentEntity.title}`
            });
            entityLink.addEventListener('click', () => {
                this.navigationUtils.openEntityInNewLeaf(task.parentEntity.file);
            });
        }
        
        // Contenedor de información de la tarea
        const taskInfo = taskItem.createDiv({ cls: 'gtd-task-info' });
        
        // Checkbox de estado (solo visual, no funcional)
        taskInfo.createSpan({ 
            cls: `task-checkbox ${task.completed ? 'checked' : ''}`,
            text: task.completed ? '✓' : ' '
        });
        
        // Indicador de prioridad
        if (task.priority !== TaskPriority.NORMAL) {
            taskInfo.createSpan({ 
                cls: `task-priority priority-${task.priority}`,
                text: this.getPriorityIcon(task.priority)
            });
        }
        
        // Texto de la tarea
        const taskText = taskInfo.createSpan({ 
            cls: 'task-text',
            text: task.text
        });
        
        // Hacer clic en la tarea abre el archivo en la posición
        taskItem.addEventListener('click', () => {
            this.navigationUtils.openTaskInEntity(task.file, task.lineInfo.number);
        });
        
        // Fechas y tiempos
        const timingInfo = taskItem.createDiv({ cls: 'gtd-task-timing' });
        
        // Fecha límite
        if (task.timing.dueDate) {
            const dateClass = task.isOverdue() ? 'task-date-overdue' : 
                             (task.isForToday() ? 'task-date-today' : 'task-date-future');
            
            timingInfo.createSpan({ 
                cls: `task-date ${dateClass}`,
                text: `📅 ${task.timing.dueDate}`
            });
        }
        
        // Fecha programada
        if (task.timing.scheduledDate && !task.timing.dueDate) {
            const dateClass = task.isOverdue() ? 'task-date-overdue' : 
                             (task.isForToday() ? 'task-date-today' : 'task-date-future');
            
            timingInfo.createSpan({ 
                cls: `task-date ${dateClass}`,
                text: `⏳ ${task.timing.scheduledDate}`
            });
        }
        
        // Hora de inicio
        if (task.timing.startTime) {
            timingInfo.createSpan({ 
                cls: 'task-time',
                text: `${task.timing.startTime}${task.timing.endTime ? ` - ${task.timing.endTime}` : ''}`
            });
        }
        
        // Duración
        if (task.timing.duration) {
            let durationText = '';
            if (task.timing.duration >= 60) {
                const hours = Math.floor(task.timing.duration / 60);
                const minutes = task.timing.duration % 60;
                durationText = `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
            } else {
                durationText = `${task.timing.duration}min`;
            }
            
            timingInfo.createSpan({ 
                cls: 'task-duration',
                text: durationText
            });
        }
        
        // Semana
        if (task.timing.week) {
            timingInfo.createSpan({ 
                cls: 'task-week',
                text: `Semana: ${task.timing.week}`
            });
        }
        
        // Etiquetas y metadatos
        const tagsInfo = taskItem.createDiv({ cls: 'gtd-task-tags' });
        
        // Contextos
        for (const context of task.tags.contexts) {
            tagsInfo.createSpan({ 
                cls: 'task-context-tag',
                text: context
            });
        }
        
        // Personas
        for (const person of task.tags.people) {
            tagsInfo.createSpan({ 
                cls: 'task-person-tag',
                text: person
            });
        }
        
        // Otros tags
        for (const tag of task.tags.gtdTags.concat(task.tags.otherTags)) {
            tagsInfo.createSpan({ 
                cls: 'task-other-tag',
                text: tag
            });
        }
        
        // Razón de bloqueo
        if (task.isBlocked && task.blockReason) {
            taskItem.createDiv({ 
                cls: 'gtd-task-block-reason',
                text: task.blockReason
            });
        }
    }
    
    /**
     * Ordena las tareas según el tipo de lista GTD
     */
    private sortTasksForList(tasks: Task[], listType: TaskListType): Task[] {
        const tasksCopy = [...tasks];
        
        switch (listType) {
            case TaskListType.INBOX:
                // Sin orden específico
                return tasksCopy;
                
            case TaskListType.NEXT_ACTIONS:
                // Ordenar por contexto y prioridad
                return tasksCopy.sort((a, b) => {
                    // Primero por contexto
                    const contextA = a.tags.contexts[0] || '';
                    const contextB = b.tags.contexts[0] || '';
                    const contextComp = contextA.localeCompare(contextB);
                    if (contextComp !== 0) return contextComp;
                    
                    // Luego por prioridad (de mayor a menor)
                    return this.comparePriorities(b.priority, a.priority);
                });
                
            case TaskListType.CALENDAR:
                // Ordenar por fecha y hora
                return tasksCopy.sort((a, b) => {
                    // Primero por fecha
                    const dateA = a.timing.dueDate || '';
                    const dateB = b.timing.dueDate || '';
                    const dateComp = dateA.localeCompare(dateB);
                    if (dateComp !== 0) return dateComp;
                    
                    // Luego por hora
                    const timeA = a.timing.startTime || '';
                    const timeB = b.timing.startTime || '';
                    return timeA.localeCompare(timeB);
                });
                
            case TaskListType.HOPEFULLY_TODAY:
                // Ordenar por tipo de fecha y prioridad
                return tasksCopy.sort((a, b) => {
                    // Primero tareas con fecha límite (📅)
                    const hasLimitA = !!a.timing.dueDate;
                    const hasLimitB = !!b.timing.dueDate;
                    if (hasLimitA !== hasLimitB) return hasLimitB ? 1 : -1;
                    
                    // Luego por prioridad (de mayor a menor)
                    return this.comparePriorities(b.priority, a.priority);
                });
                
            case TaskListType.ASSIGNED:
                // Ordenar por persona asignada y fecha
                return tasksCopy.sort((a, b) => {
                    // Primero por persona
                    const personA = a.tags.people[0] || '';
                    const personB = b.tags.people[0] || '';
                    const personComp = personA.localeCompare(personB);
                    if (personComp !== 0) return personComp;
                    
                    // Luego por fecha límite (si existe)
                    const dateA = a.timing.dueDate || '9999-99-99';
                    const dateB = b.timing.dueDate || '9999-99-99';
                    return dateA.localeCompare(dateB);
                });
                
            case TaskListType.WAITING:
                // Ordenar por razón de bloqueo
                return tasksCopy.sort((a, b) => {
                    // Primero por tipo de bloqueo (dependencia, fecha futura, semana)
                    const blockTypeA = this.getBlockType(a);
                    const blockTypeB = this.getBlockType(b);
                    if (blockTypeA !== blockTypeB) return blockTypeA - blockTypeB;
                    
                    // Luego por fecha (si es por fecha o semana)
                    if (blockTypeA === 1) { // Fecha futura
                        const dateA = a.timing.startDate || '';
                        const dateB = b.timing.startDate || '';
                        return dateA.localeCompare(dateB);
                    } else if (blockTypeA === 3) { // Semana futura
                        const weekA = a.timing.week || '';
                        const weekB = b.timing.week || '';
                        return weekA.localeCompare(weekB);
                    }
                    
                    return 0;
                });
                
            default:
                // Para otras listas, ordenar por prioridad
                return tasksCopy.sort((a, b) => {
                    return this.comparePriorities(b.priority, a.priority);
                });
        }
    }
    
    /**
     * Obtiene el tipo de bloqueo para ordenar tareas en pausa
     * 1: Fecha futura, 2: Dependencia, 3: Semana futura
     */
    private getBlockType(task: Task): number {
        if (task.timing.startDate) return 1;
        if (task.dependencies.length > 0) return 2;
        if (task.timing.week) return 3;
        return 0;
    }
    
    /**
     * Compara dos prioridades para ordenar (del más alto al más bajo)
     */
    private comparePriorities(a: TaskPriority, b: TaskPriority): number {
        const priorityValues = {
            [TaskPriority.HIGHEST]: 4,
            [TaskPriority.HIGH]: 3,
            [TaskPriority.NORMAL]: 2,
            [TaskPriority.LOW]: 1,
            [TaskPriority.LOWEST]: 0
        };
        
        return priorityValues[a] - priorityValues[b];
    }
    
    /**
     * Obtiene la etiqueta para un tipo de entidad
     */
    private getEntityTypeLabel(type: EntityType): string {
        switch (type) {
            case EntityType.AREA_VIDA:
                return 'Área de Vida';
            case EntityType.AREA_INTERES:
                return 'Área de Interés';
            case EntityType.PROYECTO_Q:
                return 'Proyecto Q';
            case EntityType.PROYECTO_GTD:
                return 'Proyecto GTD';
            case EntityType.ANOTACION:
                return 'Anotación';
            case EntityType.CAMPANA:
                return 'Campaña';
            case EntityType.ENTREGABLE:
                return 'Entregable';
            case EntityType.REGISTRO_TIEMPO:
                return 'Registro Tiempo';
            case EntityType.TRANSACCION:
                return 'Transacción';
            case EntityType.OTHER:
                return 'Otra Entidad';
            case EntityType.UNKNOWN:
            default:
                return 'Entidad';
        }
    }
    
    /**
     * Obtiene la clase CSS para un estado de entidad
     */
    private getEntityStateClass(state: EntityState): string {
        switch (state) {
            case EntityState.ACTIVE:
                return 'active';
            case EntityState.PAUSED:
                return 'paused';
            case EntityState.STOPPED:
                return 'stopped';
            case EntityState.ARCHIVED:
                return 'archived';
            default:
                return 'unknown';
        }
    }
    
    /**
     * Obtiene el icono para una prioridad
     */
    private getPriorityIcon(priority: TaskPriority): string {
        switch (priority) {
            case TaskPriority.HIGHEST:
                return '⏫';
            case TaskPriority.HIGH:
                return '🔼';
            case TaskPriority.LOW:
                return '🔽';
            case TaskPriority.LOWEST:
                return '⏬';
            case TaskPriority.NORMAL:
            default:
                return '';
        }
    }
    
    /**
     * Obtiene la etiqueta para un tipo de lista GTD
     */
    private getListTypeLabel(listType: TaskListType): string {
        switch (listType) {
            case TaskListType.INBOX:
                return 'Bandeja de Entrada';
            case TaskListType.NEXT_ACTIONS:
                return 'Próximas Acciones';
            case TaskListType.CALENDAR:
                return 'Calendario';
            case TaskListType.HOPEFULLY_TODAY:
                return 'Ojalá Hoy';
            case TaskListType.ASSIGNED:
                return 'Asignadas';
            case TaskListType.PROJECTS:
                return 'Proyectos';
            case TaskListType.SOMEDAY_MAYBE:
                return 'Algún Día / Tal Vez';
            case TaskListType.NOT_THIS_WEEK:
                return 'Esta Semana No';
            case TaskListType.WAITING:
                return 'En Pausa';
            default:
                return 'Lista Desconocida';
        }
    }
    
    /**
     * Obtiene la descripción para un tipo de lista GTD
     */
    private getListTypeDescription(listType: TaskListType): string {
        switch (listType) {
            case TaskListType.INBOX:
                return 'Tareas que necesitan ser procesadas o clasificadas.';
            case TaskListType.NEXT_ACTIONS:
                return 'Acciones listas para ejecutar en contextos específicos.';
            case TaskListType.CALENDAR:
                return 'Compromisos con fecha y hora específica.';
            case TaskListType.HOPEFULLY_TODAY:
                return 'Tareas que se desean completar hoy, sin hora específica.';
            case TaskListType.ASSIGNED:
                return 'Tareas delegadas a otras personas.';
            case TaskListType.PROJECTS:
                return 'Resultados que requieren múltiples acciones.';
            case TaskListType.SOMEDAY_MAYBE:
                return 'Ideas para considerar en el futuro.';
            case TaskListType.NOT_THIS_WEEK:
                return 'Tareas pospuestas para después de esta semana.';
            case TaskListType.WAITING:
                return 'Tareas bloqueadas por dependencias o fechas futuras.';
            default:
                return '';
        }
    }
}