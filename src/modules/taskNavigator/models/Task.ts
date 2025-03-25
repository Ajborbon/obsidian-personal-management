// src/modules/taskNavigator/models/Task.ts

import { IEntity } from './Entity';
import { TFile } from 'obsidian';

/**
 * Tipos de listas GTD donde puede estar una tarea
 */
export enum TaskListType {
    INBOX = 'inbox',
    NEXT_ACTIONS = 'nextActions',
    CALENDAR = 'calendar',
    HOPEFULLY_TODAY = 'hopefullyToday',
    ASSIGNED = 'assigned',
    PROJECTS = 'projects',
    SOMEDAY_MAYBE = 'somedayMaybe',
    NOT_THIS_WEEK = 'notThisWeek',
    WAITING = 'waiting'
}

/**
 * Prioridad de la tarea
 */
export enum TaskPriority {
    HIGHEST = 'highest', // ⏫
    HIGH = 'high',      // 🔼
    NORMAL = 'normal',   // Normal (sin marcador)
    LOW = 'low',        // 🔽
    LOWEST = 'lowest'   // ⏬
}

/**
 * Información sobre la línea donde se encuentra la tarea
 */
export interface LineInfo {
    number: number;
    text: string;
    indentation: number;
}

/**
 * Interfaz para las etiquetas de la tarea
 */
export interface TaskTags {
    contexts: string[];    // Contextos (#cx-)
    people: string[];      // Personas asignadas (#px-)
    gtdTags: string[];     // Tags relacionados con GTD (#GTD-)
    otherTags: string[];   // Otros tags
    all: string[];         // Todos los tags
}

/**
 * Interfaz para fechas y horas relacionadas con la tarea
 */
export interface TaskTiming {
    startDate?: string;    // Fecha de inicio (🛫)
    dueDate?: string;      // Fecha límite (📅)
    scheduledDate?: string; // Fecha programada (⏳)
    startTime?: string;    // Hora de inicio [hI::]
    endTime?: string;      // Hora de fin [hF::]
    duration?: number;     // Duración en minutos
    week?: string;         // Semana planificada [w::]
}

/**
 * Modelo de tarea
 */
export class Task {
    // Identificadores
    id: string;                      // ID único (🆔)
    taskId: string;                  // ID directo extraído de la tarea

    // Contenido básico
    text: string;                    // Texto principal de la tarea
    rawText: string;                 // Texto completo incluyendo metadatos
    completed: boolean;              // Si está completada o no

    // Ubicación
    file: TFile;                     // Archivo donde se encuentra la tarea
    filePath: string;                // Ruta del archivo
    lineInfo: LineInfo;              // Información de la línea
    
    // Metadatos
    priority: TaskPriority;          // Prioridad de la tarea
    tags: TaskTags;                  // Etiquetas
    timing: TaskTiming;              // Fechas y horas
    dependencies: string[];          // IDs de tareas de las que depende (⛔)
    
    // Relaciones
    parentEntity?: IEntity;          // Entidad padre
    
    // Clasificación GTD
    listType?: TaskListType;         // Tipo de lista GTD donde se encuentra
    isBlocked: boolean = false;      // Si está bloqueada por dependencias
    blockReason?: string;            // Razón por la que está bloqueada

    constructor(
        id: string,
        text: string,
        rawText: string,
        completed: boolean,
        file: TFile,
        lineInfo: LineInfo
    ) {
        this.id = id;
        this.taskId = id; // Por defecto son iguales, pero taskId puede cambiar si se extrae uno de la tarea
        this.text = text;
        this.rawText = rawText;
        this.completed = completed;
        this.file = file;
        this.filePath = file.path;
        this.lineInfo = lineInfo;
        
        // Inicializar valores por defecto
        this.priority = TaskPriority.NORMAL;
        this.tags = {
            contexts: [],
            people: [],
            gtdTags: [],
            otherTags: [],
            all: []
        };
        this.timing = {};
        this.dependencies = [];
    }
    
    /**
     * Comprueba si la tarea tiene un contexto específico
     */
    hasContext(context: string): boolean {
        return this.tags.contexts.some(ctx => 
            ctx.toLowerCase() === context.toLowerCase());
    }
    
    /**
     * Comprueba si la tarea está asignada a una persona específica
     */
    isAssignedTo(person: string): boolean {
        return this.tags.people.some(p => 
            p.toLowerCase() === person.toLowerCase());
    }
    
    /**
     * Comprueba si la tarea tiene una etiqueta GTD específica
     */
    hasGTDTag(tag: string): boolean {
        return this.tags.gtdTags.some(t => 
            t.toLowerCase() === tag.toLowerCase());
    }

    /**
     * Determina si una tarea está vencida
     */
    isOverdue(): boolean {
        if (!this.timing.dueDate && !this.timing.scheduledDate) {
            return false;
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Verificar fecha límite (📅)
        if (this.timing.dueDate) {
            const dueDate = new Date(this.timing.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            if (dueDate < today) {
                return true;
            }
        }
        
        // Verificar fecha programada (⏳)
        if (this.timing.scheduledDate) {
            const scheduledDate = new Date(this.timing.scheduledDate);
            scheduledDate.setHours(0, 0, 0, 0);
            if (scheduledDate < today) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Determina si una tarea está programada para hoy
     */
    isForToday(): boolean {
        if (!this.timing.dueDate && !this.timing.scheduledDate) {
            return false;
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Verificar fecha límite (📅)
        if (this.timing.dueDate) {
            const dueDate = new Date(this.timing.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            if (dueDate.getTime() === today.getTime()) {
                return true;
            }
        }
        
        // Verificar fecha programada (⏳)
        if (this.timing.scheduledDate) {
            const scheduledDate = new Date(this.timing.scheduledDate);
            scheduledDate.setHours(0, 0, 0, 0);
            if (scheduledDate.getTime() === today.getTime()) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Determina si una tarea tiene hora de inicio establecida
     */
    hasStartTime(): boolean {
        return !!this.timing.startTime;
    }
    
    /**
     * Determina los días hasta la fecha límite (positivo si aún hay tiempo, negativo si está vencida)
     */
    getDaysUntilDue(): number | null {
        if (!this.timing.dueDate) {
            return null;
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const dueDate = new Date(this.timing.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        
        const diffTime = dueDate.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
}

// DEVELOPMENT_CHECKPOINT: "task_model"
// Descripción: Implementación del modelo de tareas
// Estado: Completo