/*
 * Filename: /src/modules/taskNavigator/commands.ts
 * Created Date: 2025-02-26
 * Author: Module Creator
 * -----
 * Copyright (c) 2025
 */

import { Plugin, Notice, Editor, MarkdownView } from "obsidian";
import { TaskNavigator } from "./taskNavigator";

/**
 * Registra los comandos relacionados con la navegación de tareas
 * @param plugin Instancia del plugin
 */
export function registerCommands(plugin: Plugin): void {
    const taskNavigator = new TaskNavigator(plugin);
    
    // Comando principal para navegar a tareas
    const navigatorCommand = plugin.addCommand({
        id: "navigate-to-tasks",
        name: "Navegar a tareas en ejecución",
        callback: async () => {
            try {
                await taskNavigator.navigateToTask();
            } catch (error) {
                console.error("Error al navegar a la tarea:", error);
                new Notice("No se pudo navegar a la tarea seleccionada.");
            }
        }
    });

    // Almacenar el ID del comando en el plugin para poder desactivarlo después
    if (!plugin.registeredTaskNavigatorIDs) {
        plugin.registeredTaskNavigatorIDs = [];
    }
    plugin.registeredTaskNavigatorIDs.push(navigatorCommand.id);
}

/**
 * Desactiva los comandos registrados
 * @param plugin Instancia del plugin
 */
export function deactivateCommands(plugin: Plugin): void {
    if (!plugin.registeredTaskNavigatorIDs) return;
    
    plugin.registeredTaskNavigatorIDs.forEach(commandId => {
        const command = plugin.app.commands.commands[commandId];
        
        if (command) {
            // Sobrescribe el callback del comando para que no haga nada
            command.callback = () => new Notice("Este comando ha sido desactivado.");
        }
    });
    
    // Limpia el array de IDs registrados
    plugin.registeredTaskNavigatorIDs = [];
}