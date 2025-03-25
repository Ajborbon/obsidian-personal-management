// src/modules/taskNavigator/services/TaskManagerIntegration.ts

import { TareasAPI } from '../../taskManager/api/tareasAPI';
import { Task, TaskListType } from '../models/Task';
import { Plugin } from 'obsidian';

/**
 * Servicio para integrar el TaskNavigator con el TaskManager existente
 */
export class TaskManagerIntegration {
    private plugin: Plugin;
    private tareasAPI: TareasAPI;
    
    constructor(plugin: Plugin) {
        this.plugin = plugin;
        this.tareasAPI = plugin.tareasAPI;
    }
    
    /**
     * Carga tareas vencidas desde el TaskManager
     */
    async loadOverdueTasks(): Promise<Task[]> {
        try {
            if (!this.tareasAPI) {
                console.warn('TareasAPI no está disponible');
                return [];
            }
            
            // Obtener tareas vencidas abiertas
            const overdueTasks = await this.tareasAPI.getTareasVencidasAbiertas();
            
            // Convertir al formato Task del NavigatorTask
            return this.convertTareasToNavigatorTasks(overdueTasks);
        } catch (error) {
            console.error('Error al cargar tareas vencidas:', error);
            return [];
        }
    }
    
    /**
     * Convierte tareas del formato de TareasAPI al formato de TaskNavigator
     */
    private convertTareasToNavigatorTasks(tareas: any[]): Task[] {
        const tasks: Task[] = [];
        
        for (const tarea of tareas) {
            try {
                // Crear un objeto LineInfo básico
                const lineInfo = {
                    number: tarea.line || 0,
                    text: tarea.rawText || '',
                    indentation: 0
                };
                
                // Crear una instancia de Task
                const task = new Task(
                    tarea.id || '',
                    tarea.text || '',
                    tarea.rawText || '',
                    false, // Asumimos que no está completada ya que son tareas vencidas abiertas
                    tarea.file, // TFile
                    lineInfo
                );
                
                // Establecer propiedades adicionales
                task.timing.dueDate = tarea.dueDate || '';
                task.timing.scheduledDate = tarea.scheduledDate || '';
                task.timing.startDate = tarea.startDate || '';
                
                // Clasificar según criterios GTD
                if (tarea.contexts && tarea.contexts.length > 0) {
                    task.tags.contexts = tarea.contexts;
                    task.listType = TaskListType.NEXT_ACTIONS;
                } else if (tarea.people && tarea.people.length > 0) {
                    task.tags.people = tarea.people;
                    task.listType = TaskListType.ASSIGNED;
                } else {
                    task.listType = TaskListType.INBOX;
                }
                
                // Marcar como vencida
                if (tarea.dueDate || tarea.scheduledDate) {
                    task.isOverdue = () => true;
                }
                
                tasks.push(task);
            } catch (error) {
                console.error('Error al convertir tarea:', error);
                // Continuar con la siguiente tarea
            }
        }
        
        return tasks;
    }
    
    /**
     * Actualiza el estado de una tarea en el sistema
     */
    async updateTaskStatus(task: Task, completed: boolean): Promise<boolean> {
        try {
            if (!this.tareasAPI) {
                console.warn('TareasAPI no está disponible');
                return false;
            }
            
            // Usar el API de tareas para actualizar el estado
            // Este es un ejemplo, la implementación real dependerá de la API disponible
            // await this.tareasAPI.updateTaskStatus(task.file.path, task.lineInfo.number, completed);
            
            // Por ahora, devolver true indicando éxito
            return true;
        } catch (error) {
            console.error('Error al actualizar estado de tarea:', error);
            return false;
        }
    }
    
    /**
     * Obtiene estadísticas de tareas desde el TaskManager
     */
    async getTaskStats(): Promise<any> {
        try {
            if (!this.tareasAPI) {
                console.warn('TareasAPI no está disponible');
                return {};
            }
            
            // Esto es un placeholder, TareasAPI debería proporcionar un método para esto
            // const stats = await this.tareasAPI.getTaskStats();
            
            // Por ahora, devolver un objeto vacío
            return {};
        } catch (error) {
            console.error('Error al obtener estadísticas de tareas:', error);
            return {};
        }
    }
}