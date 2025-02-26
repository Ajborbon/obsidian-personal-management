/*
 * Filename: /src/modules/taskNavigator/taskNavigator.ts
 * Created Date: 2025-02-26
 * Author: Module Creator
 * -----
 * Copyright (c) 2025
 */

import { App, Plugin, TFile, Notice, Editor, MarkdownView } from "obsidian";
import { SeleccionModalTareas } from "../modales/seleccionModalTareas";

/**
 * Interfaz para representar una tarea con su información de ubicación
 */
interface TaskInfo {
    text: string;           // Texto de la tarea
    file: TFile;            // Archivo donde se encuentra la tarea
    lineNumber: number;     // Número de línea donde se encuentra la tarea
    displayText: string;    // Texto formateado para mostrar (alias + texto de la tarea)
}

export class TaskNavigator {
    private app: App;
    private plugin: Plugin;

    constructor(plugin: Plugin) {
        this.plugin = plugin;
        this.app = plugin.app;
    }

    /**
     * Navega a la tarea seleccionada por el usuario
     */
    async navigateToTask(): Promise<void> {
        try {
            // 1. Encuentra todas las tareas en ejecución
            const tasks = await this.findPendingTasks();
            
            if (tasks.length === 0) {
                new Notice("No se encontraron tareas en ejecución.");
                return;
            }

            // 2. Prepara las opciones para el modal
            const displayOptions = tasks.map(task => task.displayText);
            
            // 3. Muestra el modal para seleccionar una tarea
            const placeholder = "Selecciona una tarea para navegar";
            const modalMenu = new SeleccionModalTareas(
                this.app, 
                displayOptions, 
                tasks.map((_, index) => index.toString()),
                placeholder
            );
            
            try {
                const selectedIndex = parseInt(await modalMenu.openAndAwaitSelection());
                const selectedTask = tasks[selectedIndex];
                
                // 4. Navega al archivo y línea seleccionada
                await this.openFileAtLine(selectedTask.file, selectedTask.lineNumber);
                
                new Notice(`Navegando a la tarea en ${selectedTask.file.basename}`);
            } catch (error) {
                // Usuario cerró el modal sin seleccionar
                console.log("Selección de tarea cancelada por el usuario");
            }
        } catch (error) {
            console.error("Error en navegación de tareas:", error);
            throw error;
        }
    }

    /**
     * Encuentra todas las tareas pendientes (con estado [/]) en los archivos
     */
    private async findPendingTasks(): Promise<TaskInfo[]> {
        const tasks: TaskInfo[] = [];
        const archivos = this.app.vault.getMarkdownFiles();
        
        // Excluir archivos en carpetas específicas
        const archivosRelevantes = archivos.filter(archivo => {
            return !archivo.path.includes("Plantillas") && 
                   !archivo.path.includes("Estructura/GTD/Sistema GTD/Sistema") && 
                   !archivo.path.includes("Archivo");
        });

        for (const archivo of archivosRelevantes) {
            try {
                const contenido = await this.app.vault.read(archivo);
                const lineas = contenido.split("\n");
                
                // Obtiene los alias del archivo para mostrarlos junto con la tarea
                const metadata = this.app.metadataCache.getFileCache(archivo);
                let aliasDisplay = "";
                
                if (metadata?.frontmatter?.aliases) {
                    let aliases = metadata.frontmatter.aliases;
                    if (!Array.isArray(aliases)) aliases = [aliases];
                    if (aliases.length >= 2) {
                        aliasDisplay = aliases[1];
                    } else if (aliases.length >= 1) {
                        aliasDisplay = aliases[0];
                    }
                }
                
                // Si no se encontró alias, usar el nombre del archivo
                if (!aliasDisplay) {
                    aliasDisplay = archivo.basename;
                }

                // Buscar tareas pendientes [/] en cada línea
                for (let i = 0; i < lineas.length; i++) {
                    const linea = lineas[i];
                    if (linea.match(/^ *- \[\/\] .*/)) {
                        // Limpiar el texto de la tarea
                        const textoTarea = await this.limpiarTextoTarea(linea);
                        
                        // Crear el texto de visualización combinando el alias y la tarea
                        const displayText = `${aliasDisplay} / ${textoTarea}`;
                        
                        tasks.push({
                            text: textoTarea,
                            file: archivo,
                            lineNumber: i,
                            displayText: displayText
                        });
                    }
                }
            } catch (error) {
                console.error(`Error al procesar el archivo ${archivo.path}:`, error);
            }
        }

        return tasks;
    }

    /**
     * Limpia el texto de una tarea para mostrarla de forma legible
     * @param titulo Texto completo de la línea de la tarea
     */
    private async limpiarTextoTarea(titulo: string): Promise<string> {
        return new Promise(resolve => {
            // Se toma solo la primera línea
            let textoLimpio = titulo.split("\n")[0];

            // Transforma las secciones que empiezan por "#":
            // Por ejemplo: "#cx/GestiónPersonal/PlanSemanal" se transforma en "cx_GestionPersonal_PlanSemanal"
            textoLimpio = textoLimpio.replace(/#([\w-/]+)/g, (match, p1) => {
                let transformado = p1.replace(/\//g, "_");
                // Elimina acentos usando normalización Unicode
                transformado = transformado.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                return transformado;
            });

            // Elimina los campos de estilo Dataview, por ejemplo [campo::valor]
            textoLimpio = textoLimpio.replace(/\[\w+::[^\]]+\]/g, "");

            // Elimina el patrón " - [/]" al inicio de la cadena, con posibles espacios
            textoLimpio = textoLimpio.replace(/^\s*-\s*\[\/\]\s*/, "");

            // Elimina los emojis de Tasks junto con la fecha que viene inmediatamente después.
            // Se asume que la fecha tiene formato YYYY-MM-DD, opcionalmente seguida de hora.
            textoLimpio = textoLimpio.replace(
                /\p{Extended_Pictographic}\s*\d{4}-\d{2}-\d{2}(?:\s*\d{2}:\d{2}(?::\d{2})?)?/gu,
                ""
            );

            // Elimina cualquier otro emoji que quede
            textoLimpio = textoLimpio.replace(/\p{Extended_Pictographic}/gu, "");

            // Elimina cualquier contenido que esté entre corchetes cuadrados (incluyendo los corchetes)
            textoLimpio = textoLimpio.replace(/\[[^\]]*\]/g, "");

            // Reemplaza caracteres no permitidos en nombres de archivo con un guion bajo
            const caracteresNoPermitidos = /[<>:"\/\\|?*\x00-\x1F]/g;
            textoLimpio = textoLimpio.replace(caracteresNoPermitidos, "_");

            // Reemplaza espacios múltiples por un único espacio
            textoLimpio = textoLimpio.replace(/\s+/g, " ");

            resolve(textoLimpio.trim());
        });
    }

    /**
     * Abre un archivo y navega a una línea específica
     * @param file Archivo a abrir
     * @param line Número de línea a la que navegar
     */
    private async openFileAtLine(file: TFile, line: number): Promise<void> {
        // Abre el archivo en una nueva pestaña
        const leaf = this.app.workspace.getLeaf(true);
        await leaf.openFile(file);
        
        // Busca la vista del editor y navega a la línea específica
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (view) {
            const editor = view.editor;
            
            // Posiciona el cursor en la línea deseada
            const position = { line: line, ch: 0 };
            editor.setCursor(position);
            
            // Hace scroll a la línea y la resalta
            editor.scrollIntoView({ from: position, to: position }, true);
            
            // Selecciona toda la línea para destacarla visualmente
            const lineLength = editor.getLine(line).length;
            editor.setSelection(
                { line: line, ch: 0 },
                { line: line, ch: lineLength }
            );
            
            // Asegura que el editor tiene el foco
            editor.focus();
        }
    }
}