/*
 * Filename: /src/modules/taskExecutionNavigator/commands.ts
 * Created Date: 2025-02-26
 * Author: Module Creator
 * -----
 * Copyright (c) 2025
 */

import { Plugin, Notice, Editor, MarkdownView } from "obsidian";
import { TaskExecutionNavigator } from "./taskExecutionNavigator";

/**
 * Registra los comandos relacionados con la navegación de tareas en ejecución
 * @param plugin Instancia del plugin
 */
export function registerCommands(plugin: Plugin): void {
    const taskExecutionNavigator = new TaskExecutionNavigator(plugin);
    
    // Comando principal para navegar a tareas
    const navigatorCommand = plugin.addCommand({
        id: "navigate-to-execution-tasks",
        name: "Navegar a tareas en ejecución",
        callback: async () => {
            try {
                await taskExecutionNavigator.navigateToTask();
            } catch (error) {
                console.error("Error al navegar a la tarea:", error);
                new Notice("No se pudo navegar a la tarea seleccionada.");
            }
        }
    });

    // Almacenar el ID del comando en el plugin para poder desactivarlo después
    if (!plugin.registeredTaskExecutionNavigatorIDs) {
        plugin.registeredTaskExecutionNavigatorIDs = [];
    }
    plugin.registeredTaskExecutionNavigatorIDs.push(navigatorCommand.id);
}

/**
 * Desactiva los comandos registrados
 * @param plugin Instancia del plugin
 */
export function deactivateCommands(plugin: Plugin): void {
    if (!plugin.registeredTaskExecutionNavigatorIDs) return;
    
    plugin.registeredTaskExecutionNavigatorIDs.forEach(commandId => {
        const command = plugin.app.commands.commands[commandId];
        
        if (command) {
            // Sobrescribe el callback del comando para que no haga nada
            command.callback = () => new Notice("Este comando ha sido desactivado.");
        }
    });
    
    // Limpia el array de IDs registrados
    plugin.registeredTaskExecutionNavigatorIDs = [];
}