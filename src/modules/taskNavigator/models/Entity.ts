// src/modules/taskNavigator/models/Entity.ts

import { TFile } from 'obsidian';
import { Task } from './Task';

/**
 * Tipos de entidades en el sistema GTD
 */
export enum EntityType {
    AREA_VIDA = 'AV',
    AREA_INTERES = 'AI',
    PROYECTO_Q = 'PQ',
    PROYECTO_GTD = 'PGTD',
    ANOTACION = 'Ax',
    CAMPANA = 'Cp',
    ENTREGABLE = 'EMkt',
    REGISTRO_TIEMPO = 'RT',
    TRANSACCION = 'Tx',
    OTHER = 'OTHER',
    UNKNOWN = 'UNKNOWN'
}

/**
 * Estados posibles para entidades
 */
export enum EntityState {
    ACTIVE = '🟢',
    PAUSED = '🟡',
    STOPPED = '🔴',
    ARCHIVED = '🔵',
    UNKNOWN = ''
}

/**
 * Interfaz base para todas las entidades del sistema GTD
 */
export interface IEntity {
    id: string;
    type: EntityType;
    title: string;
    description: string;
    file: TFile;
    state: EntityState;
    tasks: Task[];
    parent?: IEntity;
    children: IEntity[];
    
    // Propiedades jerárquicas
    areaVida?: string | string[];
    areaInteres?: string | string[];
    proyectoQ?: string | string[];
    proyectoGTD?: string | string[];
    
    // Niveles para entidades recursivas
    level?: number;
    
    // Metadatos adicionales específicos por tipo
    metadata: Record<string, any>;
}

/**
 * Clase base para todas las entidades
 */
export class Entity implements IEntity {
    id: string;
    type: EntityType;
    title: string;
    description: string;
    file: TFile;
    state: EntityState;
    tasks: Task[] = [];
    parent?: IEntity;
    children: IEntity[] = [];
    areaVida?: string | string[];
    areaInteres?: string | string[];
    proyectoQ?: string | string[];
    proyectoGTD?: string | string[];
    level?: number;
    metadata: Record<string, any> = {};
    
    constructor(
        id: string,
        type: EntityType,
        title: string,
        description: string,
        file: TFile,
        state: EntityState = EntityState.UNKNOWN
    ) {
        this.id = id;
        this.type = type;
        this.title = title;
        this.description = description;
        this.file = file;
        this.state = state;
    }
    
    /**
     * Añade una tarea a esta entidad
     */
    addTask(task: Task): void {
        this.tasks.push(task);
        task.parentEntity = this;
    }
    
    /**
     * Añade una entidad hija
     */
    addChild(child: IEntity): void {
        this.children.push(child);
        child.parent = this;
    }
    
    /**
     * Devuelve el número total de tareas (incluyendo las de entidades hijas)
     */
    getTotalTaskCount(): number {
        let count = this.tasks.length;
        for (const child of this.children) {
            count += child.getTotalTaskCount();
        }
        return count;
    }
    
    /**
     * Devuelve el número total de tareas pendientes (incluyendo las de entidades hijas)
     */
    getPendingTaskCount(): number {
        let count = this.tasks.filter(task => !task.completed).length;
        for (const child of this.children) {
            count += child.getPendingTaskCount();
        }
        return count;
    }
}

/**
 * Clase específica para Áreas de Vida
 */
export class AreaVida extends Entity {
    trimestre: string;
    
    constructor(
        id: string,
        title: string,
        description: string,
        file: TFile, 
        state: EntityState,
        trimestre: string
    ) {
        super(id, EntityType.AREA_VIDA, title, description, file, state);
        this.trimestre = trimestre;
        this.metadata.trimestre = trimestre;
    }
}

/**
 * Clase específica para Áreas de Interés
 */
export class AreaInteres extends Entity {
    nivelAI: number;
    
    constructor(
        id: string,
        title: string,
        description: string,
        file: TFile,
        state: EntityState,
        nivelAI: number = 0
    ) {
        super(id, EntityType.AREA_INTERES, title, description, file, state);
        this.nivelAI = nivelAI;
        this.level = nivelAI;
        this.metadata.nivelAI = nivelAI;
    }
}

/**
 * Clase específica para Proyectos Q
 */
export class ProyectoQ extends Entity {
    trimestres: string[] = [];
    
    constructor(
        id: string,
        title: string,
        description: string,
        file: TFile,
        state: EntityState,
        trimestres: string[] = []
    ) {
        super(id, EntityType.PROYECTO_Q, title, description, file, state);
        this.trimestres = trimestres;
        this.metadata.trimestres = trimestres;
    }
}

/**
 * Clase específica para Proyectos GTD
 */
export class ProyectoGTD extends Entity {
    nivelP: number;
    
    constructor(
        id: string,
        title: string,
        description: string,
        file: TFile,
        state: EntityState,
        nivelP: number = 0
    ) {
        super(id, EntityType.PROYECTO_GTD, title, description, file, state);
        this.nivelP = nivelP;
        this.level = nivelP;
        this.metadata.nivelP = nivelP;
    }
}

/**
 * Función de utilidad para crear la instancia correcta según el tipo
 */
export function createEntity(
    type: EntityType,
    id: string,
    title: string,
    description: string,
    file: TFile,
    state: EntityState,
    metadata: Record<string, any> = {}
): IEntity {
    switch (type) {
        case EntityType.AREA_VIDA:
            return new AreaVida(id, title, description, file, state, metadata.trimestre || '');
        
        case EntityType.AREA_INTERES:
            return new AreaInteres(id, title, description, file, state, metadata.nivelAI || 0);
        
        case EntityType.PROYECTO_Q:
            return new ProyectoQ(id, title, description, file, state, metadata.trimestres || []);
        
        case EntityType.PROYECTO_GTD:
            return new ProyectoGTD(id, title, description, file, state, metadata.nivelP || 0);
        
        default:
            const entity = new Entity(id, type, title, description, file, state);
            entity.metadata = metadata;
            return entity;
    }
}

// DEVELOPMENT_CHECKPOINT: "entity_models"
// Descripción: Implementación de las clases de modelos para representar las entidades del sistema GTD
// Estado: Completo