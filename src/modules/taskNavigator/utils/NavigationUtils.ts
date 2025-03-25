// src/modules/taskNavigator/utils/NavigationUtils.ts

import { TFile } from 'obsidian';

/**
 * Utilidades para navegar entre entidades y tareas
 */
export class NavigationUtils {
    /**
     * Abre una entidad en una nueva hoja (pestaña)
     */
    openEntityInNewLeaf(file: TFile): void {
        try {
            app.workspace.getLeaf(true).openFile(file);
        } catch (error) {
            console.error("Error al abrir entidad:", error);
            new Notice(`Error al abrir archivo: ${error.message}`);
        }
    }
    
    /**
     * Abre una entidad y navega a una tarea específica
     */
    openTaskInEntity(file: TFile, lineNumber: number): void {
        try {
            // Usamos eState para posicionar el cursor en la línea de la tarea
            app.workspace.getLeaf(true).openFile(file, {
                eState: { line: lineNumber - 1 }
            }).then(() => {
                // Resaltamos la línea para mejor visibilidad
                this.highlightLine(lineNumber - 1);
            });
        } catch (error) {
            console.error("Error al abrir tarea:", error);
            
            // Intento alternativo sin eState
            app.workspace.getLeaf(true).openFile(file).then(() => {
                const view = app.workspace.getActiveViewOfType('markdown');
                if (view && view.editor) {
                    view.editor.setCursor({ line: lineNumber - 1, ch: 0 });
                    view.editor.scrollIntoView({ from: { line: lineNumber - 1, ch: 0 }, to: { line: lineNumber - 1, ch: 0 } }, true);
                    this.highlightLine(lineNumber - 1);
                }
            });
        }
    }
    
    /**
     * Resalta visualmente una línea en el editor
     */
    private highlightLine(lineNumber: number): void {
        setTimeout(() => {
            const view = app.workspace.getActiveViewOfType('markdown');
            if (!view || !view.editor) return;
            
            // En CodeMirror 6 (Obsidian moderno)
            if (view.editor.cm && view.editor.cm.dom) {
                const lines = view.editor.cm.dom.querySelectorAll('.cm-line');
                if (lines && lines.length > lineNumber) {
                    const line = lines[lineNumber];
                    line.classList.add('task-highlighted-line');
                    
                    // Eliminar la clase después de un tiempo
                    setTimeout(() => {
                        line.classList.remove('task-highlighted-line');
                    }, 2000);
                }
            } 
            // En CodeMirror 5 (Obsidian antiguo)
            else if (view.editor.lineDiv) {
                const lines = view.editor.lineDiv.querySelectorAll('.CodeMirror-line');
                if (lines && lines.length > lineNumber) {
                    const line = lines[lineNumber];
                    line.classList.add('task-highlighted-line');
                    
                    // Eliminar la clase después de un tiempo
                    setTimeout(() => {
                        line.classList.remove('task-highlighted-line');
                    }, 2000);
                }
            }
        }, 100); // Pequeño retraso para asegurar que el editor esté listo
    }
}

// DEVELOPMENT_CHECKPOINT: "navigation_utils"
// Descripción: Utilidades para navegar entre entidades y tareas
// Estado: Completo