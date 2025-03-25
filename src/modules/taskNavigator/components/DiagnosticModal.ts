// src/modules/taskNavigator/components/DiagnosticModal.ts

import { App, Modal } from 'obsidian';
import { HierarchyViewModel } from '../models/HierarchyViewModel';
import { LogHelper } from '../utils/LogHelper';
import { DiagnosticTools } from '../utils/DiagnosticTools';

/**
 * Modal para mostrar diagnóstico detallado de TaskNavigator
 */
export class DiagnosticModal extends Modal {
    private model: HierarchyViewModel;
    private taskParser: any;
    private entityDetector: any;
    
    constructor(app: App, model: HierarchyViewModel, taskParser: any, entityDetector: any) {
        super(app);
        this.model = model;
        this.taskParser = taskParser;
        this.entityDetector = entityDetector;
    }
    
    onOpen() {
        // Configurar contenido del modal
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('task-navigator-diagnostic-modal');
        
        // Título
        contentEl.createEl('h2', { text: 'Diagnóstico Detallado de TaskNavigator' });
        
        // Mensaje de espera
        const loadingEl = contentEl.createDiv({ cls: 'diagnostic-loading' });
        loadingEl.createEl('div', { cls: 'diagnostic-spinner' });
        loadingEl.createEl('p', { text: 'Analizando sistema...' });
        
        // Ejecutar diagnóstico en segundo plano
        setTimeout(() => this.runDiagnostic(contentEl, loadingEl), 100);
    }
    
    async runDiagnostic(contentEl: HTMLElement, loadingEl: HTMLElement) {
        try {
            // Ejecutar análisis básico
            const { status, issues } = DiagnosticTools.analyzeModel(this.model);
            
            // Análisis adicionales
            const fileFormatIssues = await this.checkFileFormats();
            const taskClassificationIssues = this.checkTaskClassification();
            
            // Eliminar pantalla de carga
            loadingEl.remove();
            
            // Mostrar resultados
            this.displayResults(contentEl, status, issues, fileFormatIssues, taskClassificationIssues);
            
        } catch (error) {
            LogHelper.error("DiagnosticModal", "Error en diagnóstico:", error);
            
            // Eliminar pantalla de carga
            loadingEl.remove();
            
            // Mostrar error
            contentEl.createEl('h3', { text: '❌ Error en el diagnóstico', cls: 'diagnostic-error-title' });
            contentEl.createEl('p', { text: `Se produjo un error: ${error.message}` });
        }
    }
    
    async checkFileFormats(): Promise<string[]> {
        const issues: string[] = [];
        
        // Analizar hasta 5 archivos para no sobrecargar
        if (this.model.focusEntity) {
            const focusFileIssues = await DiagnosticTools.validateTaskFormat(
                this.model.focusEntity.file, this.app);
            
            if (!focusFileIssues.valid) {
                issues.push(`Problemas de formato en entidad focal (${this.model.focusEntity.title}):`);
                focusFileIssues.issues.forEach(issue => {
                    issues.push(`- ${issue}`);
                });
            }
        }
        
        // Buscar archivos con tareas pero que no se ven
        if (this.model.filteredTasks.size === 0 && this.model.allTasks.length > 0) {
            issues.push("Hay tareas en el modelo pero no se muestran en la vista filtrada");
        }
        
        return issues;
    }
    
    checkTaskClassification(): string[] {
        const issues: string[] = [];
        
        // Verificar si hay tareas sin clasificar
        if (this.model.allTasks.length > 0) {
            const unclassifiedTasks = this.model.allTasks.filter(task => !task.listType);
            
            if (unclassifiedTasks.length > 0) {
                issues.push(`${unclassifiedTasks.length} tareas no están clasificadas en ninguna lista GTD`);
                
                // Mostrar detalles de hasta 3 tareas no clasificadas
                const samplesToShow = Math.min(3, unclassifiedTasks.length);
                for (let i = 0; i < samplesToShow; i++) {
                    const task = unclassifiedTasks[i];
                    issues.push(`- Tarea no clasificada: "${task.text}" en ${task.file.path}`);
                }
            }
        }
        
        return issues;
    }
    
    displayResults(contentEl: HTMLElement, status: string, modelIssues: string[], 
                  fileIssues: string[], classificationIssues: string[]) {
        
        // Crear secciones para cada tipo de problema
        const sectionsContainer = contentEl.createDiv({ cls: 'diagnostic-sections' });
        
        // Sección de modelo
        const modelSection = sectionsContainer.createDiv({ cls: 'diagnostic-section' });
        modelSection.createEl('h3', { text: 'Estructura del Modelo' });
        
        if (modelIssues.length > 0) {
            const issuesList = modelSection.createEl('ul', { cls: 'issues-list' });
            modelIssues.forEach(issue => {
                issuesList.createEl('li', { text: issue });
            });
        } else {
            modelSection.createEl('p', { text: '✅ No se detectaron problemas en la estructura del modelo' });
        }
        
        // Sección de formato de archivos
        const fileSection = sectionsContainer.createDiv({ cls: 'diagnostic-section' });
        fileSection.createEl('h3', { text: 'Formato de Archivos y Tareas' });
        
        if (fileIssues.length > 0) {
            const issuesList = fileSection.createEl('ul', { cls: 'issues-list' });
            fileIssues.forEach(issue => {
                issuesList.createEl('li', { text: issue });
            });
        } else {
            fileSection.createEl('p', { text: '✅ No se detectaron problemas de formato en los archivos analizados' });
        }
        
        // Sección de clasificación de tareas
        const classificationSection = sectionsContainer.createDiv({ cls: 'diagnostic-section' });
        classificationSection.createEl('h3', { text: 'Clasificación de Tareas' });
        
        if (classificationIssues.length > 0) {
            const issuesList = classificationSection.createEl('ul', { cls: 'issues-list' });
            classificationIssues.forEach(issue => {
                issuesList.createEl('li', { text: issue });
            });
        } else {
            classificationSection.createEl('p', { text: '✅ Todas las tareas están correctamente clasificadas' });
        }
        
        // Estadísticas generales
        const statsSection = sectionsContainer.createDiv({ cls: 'diagnostic-section' });
        statsSection.createEl('h3', { text: 'Estadísticas Generales' });
        
        const statsList = statsSection.createEl('ul', { cls: 'stats-list' });
        statsList.createEl('li', { text: `Entidades totales: ${this.model.allEntities.length}` });
        statsList.createEl('li', { text: `Entidades visibles: ${this.model.filteredEntities.length}` });
        statsList.createEl('li', { text: `Tareas totales: ${this.model.allTasks.length}` });
        
        let visibleTasks = 0;
        this.model.filteredTasks.forEach(tasks => visibleTasks += tasks.length);
        statsList.createEl('li', { text: `Tareas visibles: ${visibleTasks}` });
        
        // Botones de acción
        const actionsContainer = contentEl.createDiv({ cls: 'diagnostic-actions' });
        
        // Botón para restablecer filtros
        const resetFiltersButton = actionsContainer.createEl('button', {
            text: 'Restablecer Filtros',
            cls: 'diagnostic-action-button'
        });
        
        resetFiltersButton.addEventListener('click', () => {
            document.dispatchEvent(new CustomEvent('task-navigator-reset-filters'));
            this.close();
        });
        
        // Botón para cerrar
        const closeButton = actionsContainer.createEl('button', {
            text: 'Cerrar',
            cls: 'diagnostic-action-button'
        });
        
        closeButton.addEventListener('click', () => {
            this.close();
        });
    }
    
    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}