// src/modules/taskNavigator/module.ts

import { Plugin } from 'obsidian';
import { TaskNavigatorView } from './views/TaskNavigatorView';
import { TaskHierarchyBuilder } from './services/TaskHierarchyBuilder';
import { TaskClassifier } from './services/TaskClassifier';
import { TaskParser } from './services/TaskParser';
import { EntityDetector } from './services/EntityDetector';
import { NavigationUtils } from './utils/NavigationUtils';
import { TaskManagerIntegration } from './services/TaskManagerIntegration';
import { LogHelper } from './utils/LogHelper'; // Importar el nuevo sistema de logs


/**
 * Clase principal para el módulo de navegación de tareas GTD
 */
export class TaskNavigatorModule {
    private plugin: Plugin;
    private readonly VIEW_TYPE = 'task-navigator-view';
    private isActivated = false;
    
    // Servicios
    private hierarchyBuilder: TaskHierarchyBuilder;
    private taskClassifier: TaskClassifier;
    private taskParser: TaskParser;
    private entityDetector: EntityDetector;
    private navigationUtils: NavigationUtils;
    private taskManagerIntegration: TaskManagerIntegration;
    
    constructor(plugin: Plugin) {
        this.plugin = plugin;
        
        // Inicializar servicios
        LogHelper.info("Module", "Inicializando servicios");
        this.taskParser = new TaskParser();
        this.entityDetector = new EntityDetector(plugin);
        this.hierarchyBuilder = new TaskHierarchyBuilder(plugin);
        this.taskClassifier = new TaskClassifier();
        this.navigationUtils = new NavigationUtils();
        this.taskManagerIntegration = new TaskManagerIntegration(plugin);
    }
    
    /**
     * Activa el módulo TaskNavigator
     */
    activate(): void {
        if (this.isActivated) return;
        
        LogHelper.info("Module", "Activando módulo TaskNavigator");
        
        // Registrar la vista
        this.plugin.registerView(
            this.VIEW_TYPE,
            (leaf) => new TaskNavigatorView(leaf, this.plugin)
        );
        
        // Registrar comandos
        this.registerCommands();
        
        this.isActivated = true;
    }
    
    /**
     * Desactiva el módulo TaskNavigator
     */
    deactivate(): void {
        if (!this.isActivated) return;
        
        console.log('Desactivando módulo TaskNavigator');
        
        // Eliminar la vista registrada
        this.plugin.app.workspace.detachLeavesOfType(this.VIEW_TYPE);
        
        this.isActivated = false;
    }
    
    /**
     * Comprueba si el módulo está activo
     */
    isActive(): boolean {
        return this.isActivated;
    }
    
    /**
     * Registra los comandos para el módulo
     */
    private registerCommands(): void {
        // Comando para abrir el navegador de tareas
        this.plugin.addCommand({
            id: 'open-task-navigator',
            name: 'Abrir Navegador de Tareas GTD',
            callback: () => this.openTaskNavigatorView()
        });
        
        // Comando para mostrar tareas de la nota actual
        this.plugin.addCommand({
            id: 'show-current-note-tasks',
            name: 'Mostrar Tareas de la Nota Actual',
            callback: () => this.openTaskNavigatorWithCurrentNote()
        });
        
        // Comando para mostrar tareas vencidas
        this.plugin.addCommand({
            id: 'show-overdue-tasks',
            name: 'Mostrar Tareas Vencidas',
            callback: async () => {
                await this.openTaskNavigatorView();
                document.dispatchEvent(new CustomEvent('task-navigator-show-overdue'));
            }
        });

        
        // Comando para habilitar modo de depuración
        this.plugin.addCommand({
            id: 'task-navigator-debug-mode',
            name: '🔍 TaskNavigator: Activar Modo Debug',
            callback: () => {
                this.enableDebugMode();
                new Notice("TaskNavigator: Modo Debug activado");
            }
        });
        
        // Comando para habilitar modo de depuración profunda
        this.plugin.addCommand({
            id: 'task-navigator-trace-mode',
            name: '🔬 TaskNavigator: Activar Modo Trace (Detallado)',
            callback: () => {
                this.enableTraceMode();
                new Notice("TaskNavigator: Modo Trace activado");
            }
        });
        
        // Comando para analizar una sola nota activa
        this.plugin.addCommand({
            id: 'task-navigator-analyze-active-note',
            name: '🔍 TaskNavigator: Analizar Nota Activa',
            callback: () => this.analyzeActiveNote()
        });
        
        // Comando para generar informe de diagnóstico
        this.plugin.addCommand({
            id: 'task-navigator-diagnostic-report',
            name: '📊 TaskNavigator: Generar Informe de Diagnóstico',
            callback: () => this.generateDiagnosticReport()
        });
    }

    
    
 /**
 * Abre la vista del navegador de tareas como una pestaña nueva
 */
async openTaskNavigatorView(): Promise<void> {
    const workspace = this.plugin.app.workspace;
    
    // Verificar si la vista ya está abierta
    const existingLeaves = workspace.getLeavesOfType(this.VIEW_TYPE);
    if (existingLeaves.length > 0) {
        // Si ya está abierta, revelarla
        workspace.revealLeaf(existingLeaves[0]);
        return;
    }
    
    // Guardar la nota activa actual para mantener el contexto
    const activeFile = workspace.getActiveFile();
    
    // Crear una nueva pestaña en el área principal
    // Usamos createLeafInParent para crear una pestaña en el área principal
    const leaf = workspace.getLeaf('tab');
    
    // Configurar la nueva pestaña para mostrar nuestra vista
    await leaf.setViewState({
        type: this.VIEW_TYPE,
        active: true,
        state: {
            contextFile: activeFile ? activeFile.path : null
        }
    });
    
    // Revelar la pestaña recién creada
    workspace.revealLeaf(leaf);
}
    
        /**
         * Abre la vista del navegador centrada en la nota actual
         */
        async openTaskNavigatorWithCurrentNote(): Promise<void> {
            const workspace = this.plugin.app.workspace;
            
            // Obtenemos la nota actual
            const currentFile = workspace.getActiveFile();
            
            if (!currentFile) {
                // Si no hay nota activa, simplemente abrimos la vista normal
                await this.openTaskNavigatorView();
                return;
            }
            
            // Verificar si la vista ya está abierta
            const existingLeaves = workspace.getLeavesOfType(this.VIEW_TYPE);
            if (existingLeaves.length > 0) {
                // Si ya está abierta, actualizamos su contexto
                workspace.revealLeaf(existingLeaves[0]);
                document.dispatchEvent(new CustomEvent('task-navigator-focus-entity', {
                    detail: { filePath: currentFile.path }
                }));
                return;
            }
            
            // Si no está abierta, creamos una pestaña nueva con el contexto de la nota actual
            const leaf = workspace.getLeaf('tab');
            
            // Configurar la nueva pestaña para mostrar nuestra vista
            await leaf.setViewState({
                type: this.VIEW_TYPE,
                active: true,
                state: {
                    contextFile: currentFile.path
                }
            });
            
            // Revelar la pestaña recién creada
            workspace.revealLeaf(leaf);
        }
    

        /**
 * Analiza solo la nota activa (útil para depuración)
 */
private async analyzeActiveNote(): void {
    LogHelper.group("Module", "ANÁLISIS DE NOTA ACTIVA", false);
    
    const activeFile = this.plugin.app.workspace.getActiveFile();
    if (!activeFile) {
        LogHelper.warn("Module", "No hay nota activa para analizar");
        new Notice("No hay nota activa para analizar");
        LogHelper.groupEnd();
        return;
    }
    
    LogHelper.info("Module", `Analizando nota activa: ${activeFile.path}`);
    
    try {
        // 1. Detectar entidad
        LogHelper.group("Module", "1. Detección de entidad", true);
        const entity = await this.entityDetector.detectEntityFromFile(activeFile);
        
        if (entity) {
            LogHelper.info("Module", "Entidad detectada:");
            LogHelper.info("Module", `- Tipo: ${entity.type}`);
            LogHelper.info("Module", `- Título: ${entity.title}`);
            LogHelper.info("Module", `- Estado: ${entity.state}`);
            LogHelper.info("Module", `- ID: ${entity.id}`);
            
            // Mostrar metadatos
            LogHelper.debug("Module", "Metadatos:", entity.metadata);
            
            // Mostrar relaciones
            if (entity.areaVida) LogHelper.debug("Module", "Área de Vida:", entity.areaVida);
            if (entity.areaInteres) LogHelper.debug("Module", "Área de Interés:", entity.areaInteres);
            if (entity.proyectoQ) LogHelper.debug("Module", "Proyecto Q:", entity.proyectoQ);
            if (entity.proyectoGTD) LogHelper.debug("Module", "Proyecto GTD:", entity.proyectoGTD);
        } else {
            LogHelper.warn("Module", "No se detectó ninguna entidad en este archivo");
        }
        LogHelper.groupEnd();
        
        // 2. Extraer tareas
        LogHelper.group("Module", "2. Extracción de tareas", true);
        const tasks = await this.taskParser.extractTasksFromFile(activeFile);
        
        if (tasks.length > 0) {
            LogHelper.info("Module", `Se encontraron ${tasks.length} tareas`);
            
            // Mostrar detalle de las primeras 5 tareas como máximo
            const tasksToShow = tasks.slice(0, 5);
            for (let i = 0; i < tasksToShow.length; i++) {
                const task = tasksToShow[i];
                LogHelper.debug("Module", `Tarea ${i+1}:`);
                LogHelper.debug("Module", `- Texto: ${task.text}`);
                LogHelper.debug("Module", `- Completada: ${task.completed}`);
                LogHelper.debug("Module", `- Línea: ${task.lineInfo.number}`);
                
                // Mostrar más detalles si están disponibles
                if (task.timing.dueDate) LogHelper.debug("Module", `- Fecha límite: ${task.timing.dueDate}`);
                if (task.tags.contexts.length > 0) LogHelper.debug("Module", `- Contextos: ${task.tags.contexts.join(', ')}`);
                if (task.tags.people.length > 0) LogHelper.debug("Module", `- Personas: ${task.tags.people.join(', ')}`);
            }
            
            if (tasks.length > 5) {
                LogHelper.info("Module", `... y ${tasks.length - 5} tareas más`);
            }
        } else {
            LogHelper.warn("Module", "No se encontraron tareas en este archivo");
            
            // Mostrar un extracto del contenido para ayudar a identificar el problema
            const content = await this.plugin.app.vault.read(activeFile);
            const contentPreview = content.slice(0, 500) + (content.length > 500 ? '...' : '');
            LogHelper.debug("Module", "Primeros 500 caracteres del archivo:", contentPreview);
        }
        LogHelper.groupEnd();
        
        // Mostrar mensaje de resumen en la interfaz
        new Notice(`Análisis completo: ${entity ? '✓ Entidad detectada' : '✗ Sin entidad'}, ${tasks.length} tareas encontradas`);
        
    } catch (error) {
        LogHelper.error("Module", "Error durante el análisis:", error);
        new Notice("Error durante el análisis. Revisa la consola.");
    }
    
    LogHelper.groupEnd();
}

/**
 * Genera un informe de diagnóstico completo
 */
private async generateDiagnosticReport(): void {
    LogHelper.group("Module", "GENERANDO INFORME DE DIAGNÓSTICO", false);
    
    try {
        // Obtener estadísticas generales
        const markdownFiles = this.plugin.app.vault.getMarkdownFiles();
        LogHelper.info("Module", `Total de archivos Markdown: ${markdownFiles.length}`);
        
        // Analizar un muestreo de archivos (máximo 100 para no sobrecargar)
        const sampleSize = Math.min(100, markdownFiles.length);
        const sampleFiles = markdownFiles.slice(0, sampleSize);
        
        // Contadores para estadísticas
        let entitiesDetected = 0;
        let filesWithTasks = 0;
        let totalTasksFound = 0;
        const entityTypeCount = {};
        const tasksByListType = {};
        
        LogHelper.info("Module", `Analizando muestra de ${sampleSize} archivos...`);
        
        for (const file of sampleFiles) {
            // Detectar entidad
            const entity = await this.entityDetector.detectEntityFromFile(file);
            if (entity) {
                entitiesDetected++;
                entityTypeCount[entity.type] = (entityTypeCount[entity.type] || 0) + 1;
            }
            
            // Extraer tareas
            const tasks = await this.taskParser.extractTasksFromFile(file);
            totalTasksFound += tasks.length;
            
            if (tasks.length > 0) {
                filesWithTasks++;
            }
        }
        
        // Mostrar resultados
        LogHelper.group("Module", "RESUMEN DE DIAGNÓSTICO", false);
        LogHelper.logStats("Module", {
            "Archivos analizados": sampleSize,
            "Entidades detectadas": entitiesDetected,
            "Tasa de detección de entidades": `${(entitiesDetected / sampleSize * 100).toFixed(2)}%`,
            "Archivos con tareas": filesWithTasks,
            "Tasa de archivos con tareas": `${(filesWithTasks / sampleSize * 100).toFixed(2)}%`,
            "Total de tareas encontradas": totalTasksFound,
            "Promedio de tareas por archivo": (totalTasksFound / sampleSize).toFixed(2)
        });
        
        // Mostrar distribución de tipos de entidad
        LogHelper.info("Module", "Distribución de tipos de entidad:");
        console.table(Object.entries(entityTypeCount).map(([type, count]) => ({
            Tipo: type,
            Cantidad: count,
            Porcentaje: `${(Number(count) / entitiesDetected * 100).toFixed(2)}%`
        })));
        
        LogHelper.groupEnd(); // Fin del resumen
        
        // Generar informe en la consola
        LogHelper.info("Module", "Informe de diagnóstico completo");
        
        // Mostrar mensaje en la interfaz
        new Notice("Informe de diagnóstico generado. Revisa la consola (Ctrl+Shift+I)");
        
    } catch (error) {
        LogHelper.error("Module", "Error al generar informe de diagnóstico:", error);
        new Notice("Error al generar informe de diagnóstico");
    }
    
    LogHelper.groupEnd(); // Fin del grupo principal
}

    /**
     * Activa el modo de depuración (versión mejorada)
     */
    enableDebugMode(): void {
        LogHelper.setLogLevel(LogHelper.LEVEL.DEBUG);
        LogHelper.info("Module", "Modo de depuración activado");
    }
    
    /**
     * Activa el modo de depuración profunda
     */
    enableTraceMode(): void {
        LogHelper.setLogLevel(LogHelper.LEVEL.TRACE);
        LogHelper.info("Module", "Modo de depuración TRACE activado (máximo detalle)");
    }


    /**
     * Proporciona el constructor de jerarquía a otros componentes
     */
    getHierarchyBuilder(): TaskHierarchyBuilder {
        return this.hierarchyBuilder;
    }
    
    /**
     * Proporciona el clasificador de tareas a otros componentes
     */
    getTaskClassifier(): TaskClassifier {
        return this.taskClassifier;
    }
    
    /**
     * Proporciona el analizador de tareas a otros componentes
     */
    getTaskParser(): TaskParser {
        return this.taskParser;
    }
    
    /**
     * Proporciona el detector de entidades a otros componentes
     */
    getEntityDetector(): EntityDetector {
        return this.entityDetector;
    }
    
    /**
     * Proporciona las utilidades de navegación a otros componentes
     */
    getNavigationUtils(): NavigationUtils {
        return this.navigationUtils;
    }
    
    /**
     * Proporciona la integración con el gestor de tareas a otros componentes
     */
    getTaskManagerIntegration(): TaskManagerIntegration {
        return this.taskManagerIntegration;
    }


}