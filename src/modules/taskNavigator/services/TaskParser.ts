// src/modules/taskNavigator/services/TaskParser.ts

import { TFile } from 'obsidian';
import { Task, TaskPriority, LineInfo } from '../models/Task';

/**
 * Servicio para analizar y extraer tareas de archivos markdown
 */
export class TaskParser {
    /**
     * Extrae todas las tareas de un archivo
     */
    async extractTasksFromFile(file: TFile): Promise<Task[]> {
        try {
            // Leer el contenido del archivo
            const content = await this.readFile(file);
            
            // Dividir el contenido en líneas
            const lines = content.split('\n');
            
            // Array para almacenar las tareas encontradas
            const tasks: Task[] = [];
            
            // Procesar cada línea
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const lineNumber = i + 1;
                
                // Comprobar si la línea contiene una tarea
                const task = this.parseTaskLine(line, lineNumber, file);
                if (task) {
                    tasks.push(task);
                }
            }
            
            return tasks;
        } catch (error) {
            console.error(`Error al extraer tareas del archivo ${file.path}:`, error);
            return [];
        }
    }
    
    /**
     * Lee el contenido de un archivo
     */
    private async readFile(file: TFile): Promise<string> {
        try {
            return await app.vault.read(file);
        } catch (error) {
            console.error(`Error al leer el archivo ${file.path}:`, error);
            throw error;
        }
    }
    
    /**
     * Analiza una línea para determinar si contiene una tarea
     */
    private parseTaskLine(line: string, lineNumber: number, file: TFile): Task | null {
        // Regex para detectar tareas de Obsidian
        // Captura grupos para: indentación, estado (completado o no), texto de la tarea
        const taskRegex = /^(\s*)-\s*\[([ xX/])\]\s*(.+)$/;
        const match = line.match(taskRegex);
        
        if (!match) {
            return null; // No es una tarea
        }
        
        // Extraer componentes de la tarea
        const indentation = match[1].length;
        const isCompleted = match[2] !== ' '; // Cualquier cosa excepto espacio indica completada
        const taskText = match[3];
        
        // Crear información de línea
        const lineInfo: LineInfo = {
            number: lineNumber,
            text: line,
            indentation: indentation
        };
        
        // Generar un ID único para la tarea (o extraerlo del texto)
        const taskId = this.extractTaskId(taskText) || this.generateTaskId(file.basename, lineNumber);
        
        // Crear la tarea básica
        const task = new Task(
            taskId,
            this.cleanTaskText(taskText),
            taskText,
            isCompleted,
            file,
            lineInfo
        );
        
        // Extraer metadatos adicionales
        this.extractTaskMetadata(task);
        
        return task;
    }
    
    /**
     * Limpia el texto de la tarea eliminando metadatos y tags
     */
    private cleanTaskText(text: string): string {
        // Eliminar ID de tarea
        let cleanText = text.replace(/🆔\s+\w+/g, '').trim();
        
        // Eliminar etiquetas
        cleanText = cleanText.replace(/#[a-zA-Z0-9_-]+/g, '').trim();
        
        // Eliminar fechas
        cleanText = cleanText.replace(/[📅⏳🛫]\s*\d{4}-\d{2}-\d{2}/g, '').trim();
        
        // Eliminar dependencias
        cleanText = cleanText.replace(/⛔\s*\w+/g, '').trim();
        
        // Eliminar metadatos entre corchetes
        cleanText = cleanText.replace(/\[([^\]]+)\]/g, '').trim();
        
        // Eliminar prioridades
        cleanText = cleanText.replace(/[⏫🔼🔽⏬]/g, '').trim();
        
        // Eliminar espacios múltiples
        cleanText = cleanText.replace(/\s+/g, ' ').trim();
        
        return cleanText;
    }
    
    /**
     * Extrae y procesa los metadatos de la tarea
     */
    private extractTaskMetadata(task: Task): void {
        const text = task.rawText;
        
        // Extraer prioridad
        this.extractPriority(task, text);
        
        // Extraer fechas y horarios
        this.extractDates(task, text);
        
        // Extraer etiquetas
        this.extractTags(task, text);
        
        // Extraer dependencias
        this.extractDependencies(task, text);
    }
    
    /**
     * Extrae la prioridad de la tarea
     */
    private extractPriority(task: Task, text: string): void {
        if (text.includes('⏫')) {
            task.priority = TaskPriority.HIGHEST;
        } else if (text.includes('🔼')) {
            task.priority = TaskPriority.HIGH;
        } else if (text.includes('🔽')) {
            task.priority = TaskPriority.LOW;
        } else if (text.includes('⏬')) {
            task.priority = TaskPriority.LOWEST;
        } else {
            task.priority = TaskPriority.NORMAL;
        }
    }
    
    /**
     * Extrae las fechas y horarios de la tarea
     */
    private extractDates(task: Task, text: string): void {
        // Extraer fecha de inicio (🛫)
        const startDateRegex = /🛫\s*(\d{4}-\d{2}-\d{2})/;
        const startDateMatch = text.match(startDateRegex);
        if (startDateMatch) {
            task.timing.startDate = startDateMatch[1];
        }
        
        // Extraer fecha límite (📅)
        const dueDateRegex = /📅\s*(\d{4}-\d{2}-\d{2})/;
        const dueDateMatch = text.match(dueDateRegex);
        if (dueDateMatch) {
            task.timing.dueDate = dueDateMatch[1];
        }
        
        // Extraer fecha programada (⏳)
        const scheduledDateRegex = /⏳\s*(\d{4}-\d{2}-\d{2})/;
        const scheduledDateMatch = text.match(scheduledDateRegex);
        if (scheduledDateMatch) {
            task.timing.scheduledDate = scheduledDateMatch[1];
        }
        
        // Extraer hora de inicio [hI::]
        const startTimeRegex = /\[hI::\s*([^\]]+)\]/;
        const startTimeMatch = text.match(startTimeRegex);
        if (startTimeMatch) {
            task.timing.startTime = startTimeMatch[1];
        }
        
        // Extraer hora de fin [hF::]
        const endTimeRegex = /\[hF::\s*([^\]]+)\]/;
        const endTimeMatch = text.match(endTimeRegex);
        if (endTimeMatch) {
            task.timing.endTime = endTimeMatch[1];
        }
        
        // Extraer duración en minutos [Xmin]
        const durationMinRegex = /\[(\d+)min\]/;
        const durationMinMatch = text.match(durationMinRegex);
        if (durationMinMatch) {
            task.timing.duration = parseInt(durationMinMatch[1]);
        }
        
        // Extraer duración en horas [Xh]
        const durationHourRegex = /\[(\d+(?:\.\d+)?)h\]/;
        const durationHourMatch = text.match(durationHourRegex);
        if (durationHourMatch) {
            // Convertir horas a minutos
            task.timing.duration = Math.round(parseFloat(durationHourMatch[1]) * 60);
        }
        
        // Extraer semana [w:: [[YYYY-WXX]]]
        const weekRegex = /\[w::\s*\[\[([^\]]+)\]\]\]/;
        const weekMatch = text.match(weekRegex);
        if (weekMatch) {
            task.timing.week = weekMatch[1];
        }
    }
    
    /**
     * Extrae todas las etiquetas de la tarea
     */
    /**
     * Extrae todas las etiquetas de la tarea
     */
    private extractTags(task: Task, text: string): void {
        // Inicializar arrays vacíos
        task.tags.contexts = [];
        task.tags.people = [];
        task.tags.gtdTags = [];
        task.tags.otherTags = [];
        task.tags.all = [];
        
        // Regex para detectar etiquetas (#algo)
        const tagRegex = /#([a-zA-Z0-9_-]+)/g;
        let tagMatch;
        
        while ((tagMatch = tagRegex.exec(text)) !== null) {
            const tag = tagMatch[1];
            
            // Añadir al array de todos los tags
            task.tags.all.push(tag);
            
            // Clasificar el tag según su tipo
            if (tag.startsWith('cx-')) {
                // Contexto
                task.tags.contexts.push(tag);
            } else if (tag.startsWith('px-')) {
                // Persona asignada
                task.tags.people.push(tag);
            } else if (tag.startsWith('GTD-')) {
                // Tag relacionado con GTD
                task.tags.gtdTags.push(tag);
            } else {
                // Otro tipo de tag
                task.tags.otherTags.push(tag);
            }
        }
    }
    
    /**
     * Extrae las dependencias de la tarea
     */
    private extractDependencies(task: Task, text: string): void {
        // Regex para detectar dependencias (⛔ seguido de un ID)
        const dependencyRegex = /⛔\s*(\w+)/g;
        let dependencyMatch;
        
        while ((dependencyMatch = dependencyRegex.exec(text)) !== null) {
            const dependencyId = dependencyMatch[1];
            task.dependencies.push(dependencyId);
        }
    }
    
    /**
     * Extrae el ID de la tarea del texto si existe
     */
    private extractTaskId(text: string): string | null {
        // Regex para extraer el ID de la tarea (🆔 seguido de un ID)
        const idRegex = /🆔\s*(\w+)/;
        const idMatch = text.match(idRegex);
        
        if (idMatch) {
            return idMatch[1];
        }
        
        return null;
    }
    
    /**
     * Genera un ID único para la tarea si no tiene uno explícito
     */
    private generateTaskId(filePrefix: string, lineNumber: number): string {
        // Usar un prefijo basado en el archivo y el número de línea
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        
        return `${filePrefix.substring(0, 3)}${lineNumber}${timestamp.substring(timestamp.length-4)}${random}`.toUpperCase();
    }
}

// DEVELOPMENT_CHECKPOINT: "task_parser"
// Descripción: Servicio para analizar y extraer tareas de archivos
// Estado: Completo