// src/modules/taskNavigator/services/TaskClassifier.ts

import { Task, TaskListType } from '../models/Task';
import { HierarchyViewModel } from '../models/HierarchyViewModel';
import { EntityType } from '../models/Entity';

/**
 * Servicio para clasificar tareas según las reglas del sistema GTD
 */
export class TaskClassifier {
    /**
     * Clasifica todas las tareas en el modelo jerárquico
     */
    async classifyTasks(model: HierarchyViewModel): Promise<void> {
        try {
            // Inicializar las listas GTD
            this.initializeGTDLists(model);
            
            // Obtener todas las tareas del modelo
            const allTasks = this.getAllTasks(model);
            model.allTasks = allTasks;
            
            // Clasificar cada tarea
            for (const task of allTasks) {
                if (task.completed) {
                    // Las tareas completadas se ignoran o se podrían colocar en una lista separada
                    continue;
                }
                
                // Determinar a qué lista GTD pertenece
                const listType = this.determineTaskList(task, allTasks);
                task.listType = listType;
                
                // Añadir la tarea a la lista correspondiente
                const tasksInList = model.gtdLists.get(listType) || [];
                tasksInList.push(task);
                model.gtdLists.set(listType, tasksInList);
            }
            
            // Actualizar los resultados filtrados iniciales (sin filtros aplicados)
            model.filteredTasks = new Map(model.gtdLists);
            
        } catch (error) {
            console.error("Error al clasificar tareas:", error);
            throw error;
        }
    }
    
    /**
     * Inicializa las listas GTD vacías
     */
    private initializeGTDLists(model: HierarchyViewModel): void {
        model.gtdLists.clear();
        
        // Crear una entrada para cada tipo de lista
        for (const listType of Object.values(TaskListType)) {
            model.gtdLists.set(listType, []);
        }
    }
    
    /**
     * Obtiene todas las tareas del modelo jerárquico
     */
    private getAllTasks(model: HierarchyViewModel): Task[] {
        const allTasks: Task[] = [];
        
        const processEntity = (entity) => {
            // Añadir tareas de la entidad actual
            allTasks.push(...entity.tasks);
            
            // Procesar entidades hijas recursivamente
            for (const child of entity.children) {
                processEntity(child);
            }
        };
        
        // Procesar todas las entidades raíz
        for (const rootEntity of model.rootEntities) {
            processEntity(rootEntity);
        }
        
        return allTasks;
    }
    
    /**
     * Determina a qué lista GTD pertenece una tarea
     */
    private determineTaskList(task: Task, allTasks: Task[]): TaskListType {
        // Comprobar si la tarea es para "Algún Día / Tal Vez"
        if (task.hasGTDTag('AlgunDia')) {
            return TaskListType.SOMEDAY_MAYBE;
        }
        
        // Comprobar si la tarea es para "Esta Semana No"
        if (task.hasGTDTag('EstaSemanaNo')) {
            return TaskListType.NOT_THIS_WEEK;
        }
        
        // Comprobar si la tarea es de "Proyectos"
        if (task.hasContext('ProyectoGTD') || task.hasContext('Entregable')) {
            return TaskListType.PROJECTS;
        }
        
        // Comprobar si la tarea es de "Calendario"
        if (task.timing.dueDate && task.timing.startTime) {
            return TaskListType.CALENDAR;
        }
        
        // Comprobar si la tarea está en pausa
        if (this.isTaskWaiting(task, allTasks)) {
            return TaskListType.WAITING;
        }
        
        // Comprobar si la tarea es de "Ojalá Hoy"
        if (this.isTaskForToday(task)) {
            return TaskListType.HOPEFULLY_TODAY;
        }
        
        // Comprobar si la tarea está "Asignada"
        if (task.tags.people.length > 0 && task.tags.contexts.length === 0) {
            return TaskListType.ASSIGNED;
        }
        
        // Comprobar si la tarea es de "Próximas Acciones"
        if (task.tags.contexts.length > 0) {
            return TaskListType.NEXT_ACTIONS;
        }
        
        // Si no cumple ninguno de los criterios anteriores, va a "Bandeja de Entrada"
        return TaskListType.INBOX;
    }
    
    /**
     * Determina si una tarea está en pausa (en espera)
     */
    private isTaskWaiting(task: Task, allTasks: Task[]): boolean {
        // 1. Por fecha futura
        if (task.timing.startDate) {
            const startDate = new Date(task.timing.startDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (startDate > today) {
                task.isBlocked = true;
                task.blockReason = `Esperando hasta ${task.timing.startDate}`;
                return true;
            }
        }
        
        // 2. Por dependencia no completada
        if (task.dependencies.length > 0) {
            const incompleteDependencies = task.dependencies.filter(depId => {
                const dependencyTask = allTasks.find(t => t.taskId === depId || t.id === depId);
                return dependencyTask && !dependencyTask.completed;
            });
            
            if (incompleteDependencies.length > 0) {
                task.isBlocked = true;
                task.blockReason = `Esperando a que se completen ${incompleteDependencies.length} tareas dependientes`;
                return true;
            }
        }
        
        // 3. Por semana futura
        if (task.timing.week) {
            const weekRegex = /(\d{4})-W(\d{2})/;
            const match = task.timing.week.match(weekRegex);
            
            if (match) {
                const year = parseInt(match[1]);
                const week = parseInt(match[2]);
                
                // Obtener la semana actual
                const today = new Date();
                const currentYear = today.getFullYear();
                const currentWeek = this.getWeekNumber(today);
                
                if (year > currentYear || (year === currentYear && week > currentWeek)) {
                    task.isBlocked = true;
                    task.blockReason = `Programado para la semana ${task.timing.week}`;
                    return true;
                }
            }
        }
        
        return false;
    }
    
    /**
     * Determina si una tarea es para "Ojalá Hoy"
     */
    private isTaskForToday(task: Task): boolean {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
        
        // Comprobar si la tarea tiene una fecha límite o programada para hoy
        if ((task.timing.dueDate === todayStr || task.timing.scheduledDate === todayStr) && !task.timing.startTime) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Obtiene el número de semana del año de una fecha
     */
    private getWeekNumber(date: Date): number {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    }
}

// DEVELOPMENT_CHECKPOINT: "task_classifier"
// Descripción: Servicio para clasificar tareas según las reglas GTD
// Estado: Completo