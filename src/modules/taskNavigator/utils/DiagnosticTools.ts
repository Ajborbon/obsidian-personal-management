// src/modules/taskNavigator/utils/DiagnosticTools.ts

import { HierarchyViewModel } from '../models/HierarchyViewModel';
import { IEntity } from '../models/Entity';
import { Task } from '../models/Task';
import { LogHelper } from './LogHelper';

/**
 * Herramientas de diagnóstico específicas para TaskNavigator
 */
export class DiagnosticTools {
    /**
     * Analiza el modelo de jerarquía e identifica posibles problemas
     */
    static analyzeModel(model: HierarchyViewModel): { status: string, issues: string[] } {
        const issues: string[] = [];
        
        LogHelper.group("Diagnostic", "Análisis de modelo de jerarquía", false);
        
        // Verificar entidades raíz
        if (model.rootEntities.length === 0) {
            issues.push("❌ No hay entidades raíz en el modelo");
            LogHelper.warn("Diagnostic", "No hay entidades raíz en el modelo");
        } else {
            LogHelper.info("Diagnostic", `✓ Modelo contiene ${model.rootEntities.length} entidades raíz`);
        }
        
        // Verificar tareas totales
        if (model.allTasks.length === 0) {
            issues.push("❌ No se encontraron tareas en el sistema");
            LogHelper.warn("Diagnostic", "No se encontraron tareas en el sistema");
        } else {
            LogHelper.info("Diagnostic", `✓ Se encontraron ${model.allTasks.length} tareas en total`);
        }
        
        // Verificar relaciones entre entidades
        const entitiesWithChildren = model.allEntities.filter(e => e.children.length > 0).length;
        const entitiesWithParent = model.allEntities.filter(e => e.parent !== undefined).length;
        
        if (entitiesWithChildren === 0 && model.allEntities.length > 1) {
            issues.push("⚠️ No se detectaron relaciones jerárquicas entre entidades");
            LogHelper.warn("Diagnostic", "No se detectaron relaciones jerárquicas entre entidades");
        }
        
        LogHelper.info("Diagnostic", `Entidades con hijos: ${entitiesWithChildren}`);
        LogHelper.info("Diagnostic", `Entidades con padre: ${entitiesWithParent}`);
        
        // Verificar entidad focal
        if (model.focusEntity) {
            LogHelper.info("Diagnostic", `Entidad focal: ${model.focusEntity.title} (${model.focusEntity.type})`);
            
            // Verificar si la entidad focal tiene tareas
            if (model.focusEntity.tasks.length === 0) {
                issues.push("⚠️ La entidad focal no tiene tareas");
                LogHelper.warn("Diagnostic", "La entidad focal no tiene tareas");
            } else {
                LogHelper.info("Diagnostic", `✓ La entidad focal tiene ${model.focusEntity.tasks.length} tareas`);
            }
        } else {
            LogHelper.info("Diagnostic", "No hay entidad focal definida");
        }
        
        // Verificar filtros activos que podrían estar ocultando elementos
        this.checkActiveFilters(model, issues);
        
        // Revisar integridad de las listas GTD
        this.checkGTDLists(model, issues);
        
        // Determinar estado general
        let status = "OK";
        if (issues.length > 0) {
            if (issues.some(issue => issue.startsWith("❌"))) {
                status = "ERROR";
            } else if (issues.some(issue => issue.startsWith("⚠️"))) {
                status = "WARNING";
            }
        }
        
        LogHelper.info("Diagnostic", `Análisis completado: ${status}, ${issues.length} problemas encontrados`);
        LogHelper.groupEnd();
        
        return { status, issues };
    }
    
    /**
     * Revisa si hay filtros activos que podrían estar ocultando elementos
     */
    private static checkActiveFilters(model: HierarchyViewModel, issues: string[]): void {
        LogHelper.group("Diagnostic", "Análisis de filtros", true);
        
        const filters = model.filters;
        
        // Comprobar filtros por estado
        if (!filters.showActive && !filters.showPaused && !filters.showStopped && !filters.showArchived) {
            issues.push("❌ Todos los filtros de estado están desactivados");
            LogHelper.warn("Diagnostic", "Todos los filtros de estado están desactivados");
        }
        
        // Comprobar filtros por tipo
        if (!filters.showAreasVida && !filters.showAreasInteres && 
            !filters.showProyectosQ && !filters.showProyectosGTD && !filters.showOtherEntities) {
            issues.push("❌ Todos los filtros de tipo de entidad están desactivados");
            LogHelper.warn("Diagnostic", "Todos los filtros de tipo de entidad están desactivados");
        }
        
        // Comprobar filtros de listas GTD
        if (filters.enabledLists.length === 0) {
            issues.push("❌ Todas las listas GTD están deshabilitadas");
            LogHelper.warn("Diagnostic", "Todas las listas GTD están deshabilitadas");
        }
        
        // Comprobar filtro de texto
        if (filters.searchText && model.filteredEntities.length === 0) {
            issues.push(`⚠️ El filtro de texto "${filters.searchText}" puede estar eliminando todas las entidades`);
            LogHelper.warn("Diagnostic", `El filtro de texto "${filters.searchText}" puede estar eliminando todas las entidades`);
        }
        
        // Comprobar filtros de contexto y personas
        if (filters.contexts.length > 0 && model.filteredTasks.size === 0) {
            issues.push(`⚠️ Los filtros de contexto ${filters.contexts.join(', ')} pueden estar eliminando todas las tareas`);
            LogHelper.warn("Diagnostic", `Los filtros de contexto pueden estar eliminando todas las tareas`);
        }
        
        if (filters.people.length > 0 && model.filteredTasks.size === 0) {
            issues.push(`⚠️ Los filtros de personas ${filters.people.join(', ')} pueden estar eliminando todas las tareas`);
            LogHelper.warn("Diagnostic", `Los filtros de personas pueden estar eliminando todas las tareas`);
        }
        
        LogHelper.groupEnd();
    }
    
    /**
     * Revisa la integridad de las listas GTD
     */
    private static checkGTDLists(model: HierarchyViewModel, issues: string[]): void {
        LogHelper.group("Diagnostic", "Análisis de listas GTD", true);
        
        // Comprobar si hay tareas clasificadas
        if (model.gtdLists.size === 0) {
            issues.push("❌ No se han generado listas GTD");
            LogHelper.warn("Diagnostic", "No se han generado listas GTD");
            LogHelper.groupEnd();
            return;
        }
        
        // Revisar cada lista GTD
        let totalClassifiedTasks = 0;
        
        model.gtdLists.forEach((tasks, listType) => {
            totalClassifiedTasks += tasks.length;
            LogHelper.debug("Diagnostic", `Lista GTD ${listType}: ${tasks.length} tareas`);
        });
        
        // Comprobar si hay discrepancia entre tareas totales y clasificadas
        if (totalClassifiedTasks === 0 && model.allTasks.length > 0) {
            issues.push("❌ Hay tareas en el sistema pero ninguna ha sido clasificada en listas GTD");
            LogHelper.warn("Diagnostic", "Hay tareas en el sistema pero ninguna ha sido clasificada en listas GTD");
        } else if (totalClassifiedTasks !== model.allTasks.length) {
            issues.push(`⚠️ Discrepancia en tareas: ${model.allTasks.length} totales vs ${totalClassifiedTasks} clasificadas`);
            LogHelper.warn("Diagnostic", `Discrepancia en tareas: ${model.allTasks.length} totales vs ${totalClassifiedTasks} clasificadas`);
        } else {
            LogHelper.info("Diagnostic", `✓ Todas las tareas (${totalClassifiedTasks}) están correctamente clasificadas`);
        }
        
        LogHelper.groupEnd();
    }
    
    /**
     * Busca tareas en una entidad que no hayan sido añadidas al modelo
     */
    static async findMissingTasks(entity: IEntity, taskParser: any): Promise<Task[]> {
        try {
            // Extraer todas las tareas del archivo
            const allFileTasks = await taskParser.extractTasksFromFile(entity.file);
            
            // Obtener los IDs de las tareas ya registradas
            const registeredTaskIds = new Set(entity.tasks.map(task => task.id));
            
            // Filtrar tareas que no están registradas
            const missingTasks = allFileTasks.filter(task => !registeredTaskIds.has(task.id));
            
            if (missingTasks.length > 0) {
                LogHelper.warn("Diagnostic", `Se encontraron ${missingTasks.length} tareas no registradas en ${entity.file.path}`);
            }
            
            return missingTasks;
        } catch (error) {
            LogHelper.error("Diagnostic", `Error al buscar tareas perdidas: ${error.message}`);
            return [];
        }
    }
    
    /**
     * Verifica el formato de las tareas en un archivo
     */
    static async validateTaskFormat(file: any, app: any): Promise<{ valid: boolean, issues: string[] }> {
        try {
            const content = await app.vault.read(file);
            const lines = content.split('\n');
            const issues: string[] = [];
            
            // Buscar líneas que parecen tareas pero pueden tener formato incorrecto
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                
                // Verificar tareas con formato incorrecto
                if (line.startsWith('- [') && !line.match(/^-\s*\[([ xX\/])\]/)) {
                    issues.push(`Línea ${i+1}: Formato de checkbox incorrecto - "${line}"`);
                }
                
                // Verificar tareas sin espacio después del guión
                if (line.startsWith('-[')) {
                    issues.push(`Línea ${i+1}: Falta espacio después del guión - "${line}"`);
                }
                
                // Verificar tareas con espacios dentro de los corchetes
                if (line.match(/^-\s*\[\s+\]/)) {
                    issues.push(`Línea ${i+1}: Espacios adicionales dentro de los corchetes - "${line}"`);
                }
            }
            
            return {
                valid: issues.length === 0,
                issues
            };
        } catch (error) {
            LogHelper.error("Diagnostic", `Error al validar formato de tareas: ${error.message}`);
            return {
                valid: false,
                issues: [`Error al leer el archivo: ${error.message}`]
            };
        }
    }
}