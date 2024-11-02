// src/modules/moduloGTD/commands.ts

import { Plugin } from 'obsidian';
import { ingresarBandejaEntrada } from "./inbox";

export function registerCommands(plugin: Plugin): void {
    // Comando para ingresar a la bandeja de entrada
    const inboxCommand = plugin.addCommand({
        id: "ingresar-inbox",
        name: "Ingresar Bandeja de Entrada -> Inbox",
        callback: async () => {
            await ingresarBandejaEntrada(plugin);
        }
    });

    // Registrar los IDs de los comandos para poder desactivarlos después
    plugin.registeredCommandIdsGTD = plugin.registeredCommandIdsGTD || [];
    plugin.registeredCommandIdsGTD.push(inboxCommand.id);
}

export function deactivateCommands(plugin: Plugin): void {
    if (!plugin.registeredCommandIdsGTD) return;
    
    plugin.registeredCommandIdsGTD.forEach(commandId => {
        const command = plugin.app.commands.commands[commandId];
        if (command) {
            command.callback = () => new Notice("Este comando ha sido desactivado.");
        }
    });
    
    // Limpiar el array de comandos registrados
    plugin.registeredCommandIdsGTD = [];
}