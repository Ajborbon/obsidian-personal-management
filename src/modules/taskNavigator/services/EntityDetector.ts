// src/modules/taskNavigator/services/EntityDetector.ts

import { TFile, Plugin } from 'obsidian';
import { EntityType, EntityState, IEntity, createEntity } from '../models/Entity';

/**
 * Servicio para detectar el tipo de entidad de un archivo
 * y extraer sus metadatos relevantes
 */
export class EntityDetector {
    private plugin: Plugin;
    
    constructor(plugin: Plugin) {
        this.plugin = plugin;
    }
    
    /**
     * Detecta el tipo de entidad de un archivo y crea la instancia correspondiente
     */
    async detectEntityFromFile(file: TFile): Promise<IEntity | null> {
        try {
            // Obtener el frontmatter del archivo
            const metadata = this.plugin.app.metadataCache.getFileCache(file)?.frontmatter;
            
            if (!metadata) {
                // Si no hay metadatos, no podemos determinar el tipo
                return this.createGenericEntity(file);
            }
            
            // Determinar el tipo de entidad usando el campo 'type' del frontmatter
            const entityType = this.determineEntityType(metadata.type);
            
            // Extraer el identificador (preferir 'id' del frontmatter o usar el nombre del archivo)
            const id = metadata.id || file.basename;
            
            // Extraer el título (preferir 'titulo' del frontmatter, luego 'aliases[0]', o usar el nombre del archivo)
            const title = metadata.titulo || 
                          (metadata.aliases && metadata.aliases.length > 0 ? metadata.aliases[0] : file.basename);
            
            // Extraer la descripción
            const description = metadata.descripcion || '';
            
            // Determinar el estado
            const state = this.determineEntityState(metadata.estado);
            
            // Extraer otros metadatos específicos según el tipo
            const specificMetadata = this.extractSpecificMetadata(entityType, metadata);
            
            // Crear la entidad con los datos extraídos
            const entity = createEntity(
                entityType,
                id.toString(),
                title,
                description,
                file,
                state,
                specificMetadata
            );
            
            // Extraer relaciones jerárquicas
            this.extractHierarchicalRelations(entity, metadata);
            
            return entity;
        } catch (error) {
            console.error(`Error al detectar entidad del archivo ${file.path}:`, error);
            return null;
        }
    }
    
    /**
     * Determina el tipo de entidad según el campo 'type' del frontmatter
     */
    private determineEntityType(typeStr: string | undefined): EntityType {
        if (!typeStr) {
            return EntityType.UNKNOWN;
        }
        
        // Mapeo directo de los tipos
        switch (typeStr) {
            case 'AV':
                return EntityType.AREA_VIDA;
            case 'AI':
                return EntityType.AREA_INTERES;
            case 'PQ':
                return EntityType.PROYECTO_Q;
            case 'PGTD':
                return EntityType.PROYECTO_GTD;
            case 'Ax':
                return EntityType.ANOTACION;
            case 'Cp':
                return EntityType.CAMPANA;
            case 'EMkt':
                return EntityType.ENTREGABLE;
            case 'RT':
                return EntityType.REGISTRO_TIEMPO;
            case 'Tx':
                return EntityType.TRANSACCION;
            default:
                // Intentar determinar por otras propiedades si es un tipo conocido pero mal etiquetado
                return EntityType.OTHER;
        }
    }
    
    /**
     * Determina el estado de la entidad según el campo 'estado' del frontmatter
     */
    private determineEntityState(stateStr: string | undefined): EntityState {
        if (!stateStr) {
            return EntityState.UNKNOWN;
        }
        
        switch (stateStr) {
            case '🟢':
                return EntityState.ACTIVE;
            case '🟡':
                return EntityState.PAUSED;
            case '🔴':
                return EntityState.STOPPED;
            case '🔵':
                return EntityState.ARCHIVED;
            default:
                return EntityState.UNKNOWN;
        }
    }
    
    /**
     * Extrae metadatos específicos según el tipo de entidad
     */
    private extractSpecificMetadata(entityType: EntityType, metadata: any): Record<string, any> {
        const result: Record<string, any> = {};
        
        switch (entityType) {
            case EntityType.AREA_VIDA:
                // Extraer trimestre para AV
                result.trimestre = metadata.trimestre || '';
                break;
                
            case EntityType.AREA_INTERES:
                // Extraer nivel para AI
                result.nivelAI = metadata.nivelAI || 0;
                break;
                
            case EntityType.PROYECTO_Q:
                // Extraer trimestres para PQ
                result.trimestres = this.normalizeArrayField(metadata.trimestre);
                break;
                
            case EntityType.PROYECTO_GTD:
                // Extraer nivel para PGTD
                result.nivelP = metadata.nivelP || 0;
                break;
                
            // Extraer metadatos específicos para otros tipos según sea necesario
            case EntityType.CAMPANA:
                result.indicadores = metadata.indicadores || '';
                break;
                
            case EntityType.ENTREGABLE:
                result.tipo = metadata.tipo || '';
                result.canales = this.normalizeArrayField(metadata.canales);
                result.estadoE = metadata.estadoE || '';
                result.prioridad = metadata.prioridad || '';
                result.publicacion = metadata.publicacion || '';
                result.urlCanva = metadata.urlCanva || '';
                result.hits = metadata.hits || 0;
                break;
        }
        
        return result;
    }
    
    /**
     * Extrae las relaciones jerárquicas de los metadatos
     */
    private extractHierarchicalRelations(entity: IEntity, metadata: any): void {
        // Extraer área de vida
        if (metadata.areaVida) {
            entity.areaVida = this.normalizeField(metadata.areaVida);
        }
        
        // Extraer área de interés
        if (metadata.areaInteres) {
            entity.areaInteres = this.normalizeField(metadata.areaInteres);
        }
        
        // Extraer proyecto Q
        if (metadata.proyectoQ) {
            entity.proyectoQ = this.normalizeField(metadata.proyectoQ);
        }
        
        // Extraer proyecto GTD
        if (metadata.proyectoGTD) {
            entity.proyectoGTD = this.normalizeField(metadata.proyectoGTD);
        }
        
        // Extraer asunto (relación padre-hijo)
        if (metadata.asunto) {
            // El asunto se maneja de forma diferente, ya que establece la relación directa padre-hijo
            // Esto se procesará en el HierarchyBuilder
            entity.metadata.asunto = this.normalizeField(metadata.asunto);
        }
    }
    
    /**
     * Normaliza un campo que puede ser un string o un array
     */
    private normalizeField(field: any): string | string[] {
        if (Array.isArray(field)) {
            // Si ya es un array, normalizamos cada elemento
            return field.map(item => this.normalizeWikiLink(item));
        } else if (field) {
            // Si es un valor simple, lo normalizamos
            return this.normalizeWikiLink(field);
        }
        
        return '';
    }
    
    /**
     * Normaliza un campo que debería ser un array
     */
    private normalizeArrayField(field: any): string[] {
        if (Array.isArray(field)) {
            return field.map(item => this.normalizeWikiLink(item));
        } else if (field) {
            return [this.normalizeWikiLink(field)];
        }
        
        return [];
    }
    
    /**
     * Normaliza un WikiLink ([[texto|alias]]) extrayendo su contenido
     */
    private normalizeWikiLink(text: string): string {
        if (typeof text !== 'string') {
            return String(text);
        }
        
        // Regex para detectar wikilinks [[ruta|alias]]
        const wikiLinkRegex = /\[\[(.*?)(?:\|(.*?))?\]\]/;
        const match = text.match(wikiLinkRegex);
        
        if (match) {
            // Si es un wikilink, extraer la ruta
            return match[1];
        }
        
        return text;
    }
    
    /**
     * Crea una entidad genérica cuando no se puede determinar el tipo
     */
    private createGenericEntity(file: TFile): IEntity {
        return createEntity(
            EntityType.UNKNOWN,
            file.basename,
            file.basename,
            '',
            file,
            EntityState.UNKNOWN
        );
    }
}

// DEVELOPMENT_CHECKPOINT: "entity_detector"
// Descripción: Servicio para la detección y extracción de metadatos de entidades
// Estado: Completo