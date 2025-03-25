// src/modules/taskNavigator/services/TaskHierarchyBuilder.ts

import { Plugin, TFile } from 'obsidian';
import { EntityDetector } from './EntityDetector';
import { TaskParser } from './TaskParser';
import { IEntity, EntityType, Entity } from '../models/Entity';
import { HierarchyViewModel } from '../models/HierarchyViewModel';
import { Task } from '../models/Task';

/**
 * Servicios para construir la jerarquía de entidades y tareas
 */
export class TaskHierarchyBuilder {
    private plugin: Plugin;
    private entityDetector: EntityDetector;
    private taskParser: TaskParser;
    
    constructor(plugin: Plugin) {
        this.plugin = plugin;
        this.entityDetector = new EntityDetector(plugin);
        this.taskParser = new TaskParser();
    }
    

    // Modificar TaskHierarchyBuilder.ts para añadir mensajes de depuración

/**
 * Construye la jerarquía completa de entidades y tareas
 * @param focusEntity Entidad en la que centrar la jerarquía (opcional)
 */
async buildHierarchy(focusEntity: IEntity | null = null): Promise<HierarchyViewModel> {
    const model = new HierarchyViewModel();
    console.log("[TaskNavigator] Iniciando construcción de jerarquía", focusEntity ? `con foco en ${focusEntity.title}` : "sin entidad focal");
    
    try {
        // Si se proporciona una entidad de enfoque, establecerla
        model.focusEntity = focusEntity;
        
        // Paso 1: Recopilar todas las entidades relevantes
        console.log("[TaskNavigator] Recopilando entidades");
        const entities = await this.collectAllEntities();
        console.log(`[TaskNavigator] Recopiladas ${entities.length} entidades`);
        model.allEntities = entities;
        
        // Registrar los tipos de entidades encontradas para depuración
        const entityTypeCount = {};
        entities.forEach(entity => {
            entityTypeCount[entity.type] = (entityTypeCount[entity.type] || 0) + 1;
        });
        console.log("[TaskNavigator] Distribución de tipos de entidades:", entityTypeCount);
        
        // Paso 2: Construir las relaciones entre entidades
        console.log("[TaskNavigator] Construyendo relaciones entre entidades");
        this.buildEntityRelationships(entities);
        
        // Paso 3: Determinar las entidades raíz según la entidad de enfoque
        console.log("[TaskNavigator] Determinando entidades raíz");
        model.rootEntities = this.determineRootEntities(entities, focusEntity);
        console.log(`[TaskNavigator] Determinadas ${model.rootEntities.length} entidades raíz`);
        
        // Paso 4: Extraer y asignar tareas a cada entidad
        console.log("[TaskNavigator] Extrayendo y asignando tareas");
        await this.extractAndAssignTasks(entities);
        
        // Contar tareas totales para depuración
        let totalTasks = 0;
        entities.forEach(entity => {
            totalTasks += entity.tasks.length;
            console.log(`[TaskNavigator] Entidad ${entity.title} (${entity.type}): ${entity.tasks.length} tareas`);
        });
        console.log(`[TaskNavigator] Total de tareas encontradas: ${totalTasks}`);
        
        return model;
    } catch (error) {
        console.error("[TaskNavigator] Error al construir la jerarquía:", error);
        throw error;
    }
}

/**
 * Recopila todas las entidades del sistema
 */
private async collectAllEntities(): Promise<IEntity[]> {
    const entities: IEntity[] = [];
    
    // Obtener todos los archivos de markdown
    const files = this.plugin.app.vault.getMarkdownFiles();
    console.log(`[TaskNavigator] Analizando ${files.length} archivos markdown`);
    
    // Procesar cada archivo
    let processedCount = 0;
    let entityCount = 0;
    let errorCount = 0;
    
    for (const file of files) {
        try {
            // Detectar entidad del archivo
            const entity = await this.entityDetector.detectEntityFromFile(file);
            processedCount++;
            
            if (entity) {
                entities.push(entity);
                entityCount++;
                
                if (entityCount % 50 === 0 || processedCount === files.length) {
                    console.log(`[TaskNavigator] Progreso: ${processedCount}/${files.length} archivos procesados, ${entityCount} entidades encontradas`);
                }
            }
        } catch (error) {
            errorCount++;
            console.error(`[TaskNavigator] Error al procesar archivo ${file.path}:`, error);
            // Continuar con el siguiente archivo
        }
    }
    
    console.log(`[TaskNavigator] Análisis completado: ${processedCount} archivos procesados, ${entityCount} entidades encontradas, ${errorCount} errores`);
    return entities;
}

/**
 * Extrae y asigna tareas a cada entidad
 */
private async extractAndAssignTasks(entities: IEntity[]): Promise<void> {
    let totalTasksFound = 0;
    let entitiesWithTasks = 0;
    
    for (const entity of entities) {
        try {
            // Extraer tareas del archivo de la entidad
            console.log(`[TaskNavigator] Extrayendo tareas de ${entity.file.path}`);
            const tasks = await this.taskParser.extractTasksFromFile(entity.file);
            
            if (tasks.length > 0) {
                entitiesWithTasks++;
                console.log(`[TaskNavigator] Se encontraron ${tasks.length} tareas en ${entity.file.path}`);
                
                // Log de muestra para las primeras tareas
                if (tasks.length > 0) {
                    console.log(`[TaskNavigator] Ejemplo de tarea: "${tasks[0].text}" (completada: ${tasks[0].completed})`);
                }
            }
            
            totalTasksFound += tasks.length;
            
            // Asignar cada tarea a la entidad
            for (const task of tasks) {
                entity.addTask(task);
            }
        } catch (error) {
            console.error(`[TaskNavigator] Error al extraer tareas para ${entity.file.path}:`, error);
            // Continuar con la siguiente entidad
        }
    }
    
    console.log(`[TaskNavigator] Extracción de tareas completada: ${totalTasksFound} tareas encontradas en ${entitiesWithTasks} entidades`);
}

    
    /**
     * Construye las relaciones entre entidades
     */
    private buildEntityRelationships(entities: IEntity[]): void {
        // Crear un mapa para facilitar la búsqueda
        const entityMap = new Map<string, IEntity>();
        
        // Mapear entidades por ruta de archivo
        for (const entity of entities) {
            entityMap.set(entity.file.path, entity);
        }
        
        // Procesar cada entidad para establecer relaciones
        for (const entity of entities) {
            this.establishEntityRelationships(entity, entityMap);
        }
    }
    
    /**
     * Establece las relaciones de una entidad con otras
     */
    private establishEntityRelationships(entity: IEntity, entityMap: Map<string, IEntity>): void {
        // Procesar asunto (relación directa padre-hijo)
        if (entity.metadata?.asunto) {
            const asunto = entity.metadata.asunto;
            let parentEntity = null;
            
            if (Array.isArray(asunto)) {
                // Si es un array, tomar el primer elemento como padre principal
                if (asunto.length > 0) {
                    parentEntity = this.findEntityByPathOrName(asunto[0], entityMap);
                }
            } else {
                // Si es un string, buscar la entidad padre
                parentEntity = this.findEntityByPathOrName(asunto, entityMap);
            }
            
            if (parentEntity) {
                // Establecer relación padre-hijo
                parentEntity.addChild(entity);
            }
        } 
        else {
            // Si no hay asunto explícito, intentar establecer relaciones basadas en otros campos
            
            // Relación con Proyecto GTD
            if (entity.proyectoGTD) {
                const parentEntities = this.findEntitiesByPathOrName(entity.proyectoGTD, entityMap, EntityType.PROYECTO_GTD);
                for (const parentEntity of parentEntities) {
                    if (parentEntity && parentEntity !== entity) {
                        parentEntity.addChild(entity);
                    }
                }
            }
            
            // Relación con Proyecto Q
            if (entity.proyectoQ && !entity.parent) {
                const parentEntities = this.findEntitiesByPathOrName(entity.proyectoQ, entityMap, EntityType.PROYECTO_Q);
                for (const parentEntity of parentEntities) {
                    if (parentEntity && parentEntity !== entity && !entity.parent) {
                        parentEntity.addChild(entity);
                    }
                }
            }
            
            // Relación con Área de Interés
            if (entity.areaInteres && !entity.parent) {
                const parentEntities = this.findEntitiesByPathOrName(entity.areaInteres, entityMap, EntityType.AREA_INTERES);
                for (const parentEntity of parentEntities) {
                    if (parentEntity && parentEntity !== entity && !entity.parent) {
                        parentEntity.addChild(entity);
                    }
                }
            }
            
            // Relación con Área de Vida
            if (entity.areaVida && !entity.parent) {
                const parentEntities = this.findEntitiesByPathOrName(entity.areaVida, entityMap, EntityType.AREA_VIDA);
                for (const parentEntity of parentEntities) {
                    if (parentEntity && parentEntity !== entity && !entity.parent) {
                        parentEntity.addChild(entity);
                    }
                }
            }
        }
    }
    
    /**
     * Busca una entidad por su ruta o nombre
     */
    private findEntityByPathOrName(pathOrName: string, entityMap: Map<string, IEntity>): IEntity | null {
        // Comprobar si es una ruta directa
        if (entityMap.has(pathOrName)) {
            return entityMap.get(pathOrName);
        }
        
        // Comprobar si es una ruta con .md
        if (entityMap.has(pathOrName + '.md')) {
            return entityMap.get(pathOrName + '.md');
        }
        
        // Buscar por nombre o alias
        for (const entity of entityMap.values()) {
            if (entity.file.basename === pathOrName || 
                entity.title === pathOrName) {
                return entity;
            }
            
            // Comprobar si hay un alias que coincida
            if (entity.metadata?.aliases) {
                const aliases = Array.isArray(entity.metadata.aliases) ? 
                    entity.metadata.aliases : [entity.metadata.aliases];
                
                if (aliases.includes(pathOrName)) {
                    return entity;
                }
            }
        }
        
        return null;
    }
    
    /**
     * Busca entidades por su ruta o nombre, compatible con arrays
     */
    private findEntitiesByPathOrName(pathsOrNames: string | string[], entityMap: Map<string, IEntity>, 
                                    requiredType?: EntityType): IEntity[] {
        const result: IEntity[] = [];
        const searchValues = Array.isArray(pathsOrNames) ? pathsOrNames : [pathsOrNames];
        
        for (const value of searchValues) {
            const entity = this.findEntityByPathOrName(value, entityMap);
            if (entity && (!requiredType || entity.type === requiredType)) {
                result.push(entity);
            }
        }
        
        return result;
    }
    
    /**
     * Determina las entidades raíz según la entidad de enfoque
     */
    private determineRootEntities(entities: IEntity[], focusEntity: IEntity | null): IEntity[] {
        if (!focusEntity) {
            // Si no hay entidad de enfoque, devolver todas las entidades sin padre
            return entities.filter(entity => !entity.parent);
        }
        
        // Si hay una entidad de enfoque, determinar el subárbol
        const rootEntities: IEntity[] = [];
        
        // Añadir la entidad de enfoque como raíz
        rootEntities.push(focusEntity);
        
        // Opcionalmente, buscar entidades hermanas (entidades con el mismo padre)
        if (focusEntity.parent) {
            const siblings = entities.filter(entity => 
                entity !== focusEntity && 
                entity.parent === focusEntity.parent);
            
            // Añadir los hermanos (opcional, según los requisitos específicos)
            // rootEntities.push(...siblings);
        }
        
        return rootEntities;
    }
    

}

// DEVELOPMENT_CHECKPOINT: "hierarchy_builder"
// Descripción: Servicio para construir la jerarquía de entidades y tareas
// Estado: Completo