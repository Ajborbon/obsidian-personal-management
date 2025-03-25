// src/modules/taskNavigator/utils/DebugUtils.ts

import { Task } from '../models/Task';
import { IEntity } from '../models/Entity';
import { HierarchyViewModel } from '../models/HierarchyViewModel';

/**
 * Utilidades para depuración
 */
export class DebugUtils {
    /**
     * Muestra información detallada sobre el modelo de jerarquía en la consola
     */
    static dumpModelInfo(model: HierarchyViewModel): void {
        console.group('[TaskNavigator] Información del modelo de jerarquía');
        
        // Información general
        console.log('Entidades totales:', model.allEntities.length);
        console.log('Entidades raíz:', model.rootEntities.length);
        console.log('Entidad en foco:', model.focusEntity ? model.focusEntity.title : 'Ninguna');
        console.log('Tareas totales:', model.allTasks.length);
        
        // Contador de tipos de entidad
        const entityTypes = {};
        model.allEntities.forEach(entity => {
            entityTypes[entity.type] = (entityTypes[entity.type] || 0) + 1;
        });
        console.log('Distribución de tipos de entidad:', entityTypes);
        
        // Información de listas GTD
        console.group('Distribución de tareas por lista GTD:');
        model.gtdLists.forEach((tasks, listType) => {
            console.log(`${listType}: ${tasks.length} tareas`);
        });
        console.groupEnd();
        
        // Información de entidades raíz
        console.group('Entidades raíz:');
        model.rootEntities.forEach(entity => {
            this.dumpEntityInfo(entity, 0);
        });
        console.groupEnd();
        
        console.groupEnd();
    }
    
    /**
     * Muestra información sobre una entidad y sus descendientes
     */
    static dumpEntityInfo(entity: IEntity, level: number): void {
        const indent = '  '.repeat(level);
        console.group(`${indent}${entity.title} (${entity.type})`);
        
        // Información básica
        console.log(`${indent}ID:`, entity.id);
        console.log(`${indent}Estado:`, entity.state);
        console.log(`${indent}Archivo:`, entity.file.path);
        console.log(`${indent}Tareas:`, entity.tasks.length);
        console.log(`${indent}Hijos:`, entity.children.length);
        
        // Relaciones
        if (entity.areaVida) console.log(`${indent}Área de Vida:`, entity.areaVida);
        if (entity.areaInteres) console.log(`${indent}Área de Interés:`, entity.areaInteres);
        if (entity.proyectoQ) console.log(`${indent}Proyecto Q:`, entity.proyectoQ);
        if (entity.proyectoGTD) console.log(`${indent}Proyecto GTD:`, entity.proyectoGTD);
        
        // Tareas
        if (entity.tasks.length > 0) {
            console.group(`${indent}Tareas:`);
            entity.tasks.forEach(task => {
                this.dumpTaskInfo(task, level + 1);
            });
            console.groupEnd();
        }
        
        // Entidades hijas (recursivo)
        if (entity.children.length > 0) {
            console.group(`${indent}Entidades hijas:`);
            entity.children.forEach(child => {
                this.dumpEntityInfo(child, level + 1);
            });
            console.groupEnd();
        }
        
        console.groupEnd();
    }
    
    /**
     * Muestra información sobre una tarea
     */
    static dumpTaskInfo(task: Task, level: number): void {
        const indent = '  '.repeat(level);
        console.group(`${indent}Tarea: ${task.text}`);
        
        // Información básica
        console.log(`${indent}ID:`, task.id);
        console.log(`${indent}Completada:`, task.completed);
        console.log(`${indent}Texto original:`, task.rawText);
        console.log(`${indent}Archivo:`, task.file.path);
        console.log(`${indent}Línea:`, task.lineInfo.number);
        
        // Clasificación GTD
        if (task.listType) console.log(`${indent}Lista GTD:`, task.listType);
        
        // Tags y metadatos
        if (task.tags.contexts.length > 0) console.log(`${indent}Contextos:`, task.tags.contexts);
        if (task.tags.people.length > 0) console.log(`${indent}Personas:`, task.tags.people);
        if (task.tags.gtdTags.length > 0) console.log(`${indent}Tags GTD:`, task.tags.gtdTags);
        if (task.timing.dueDate) console.log(`${indent}Fecha límite:`, task.timing.dueDate);
        if (task.timing.scheduledDate) console.log(`${indent}Fecha programada:`, task.timing.scheduledDate);
        if (task.timing.startDate) console.log(`${indent}Fecha de inicio:`, task.timing.startDate);
        if (task.timing.startTime) console.log(`${indent}Hora de inicio:`, task.timing.startTime);
        if (task.timing.endTime) console.log(`${indent}Hora final:`, task.timing.endTime);
        if (task.timing.duration) console.log(`${indent}Duración:`, task.timing.duration, 'minutos');
        if (task.timing.week) console.log(`${indent}Semana:`, task.timing.week);
        
        // Dependencias
        if (task.dependencies.length > 0) console.log(`${indent}Dependencias:`, task.dependencies);
        
        // Estado de bloqueo
        if (task.isBlocked) console.log(`${indent}Bloqueada:`, task.blockReason);
        
        console.groupEnd();
    }
}