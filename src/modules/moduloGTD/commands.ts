import { Plugin, Notice } from 'obsidian';
import { ingresarBandejaEntrada } from "./inbox";
import { mostrarTareasVencidas } from "./tareasAPI";

export function registerCommands(plugin: Plugin): void {
    const id1 = plugin.addCommand({
        id: "ingresar-inbox",
        name: "Ingresar Bandeja de Entrada -> Inbox",
        callback: async () => {
            await ingresarBandejaEntrada(plugin);
        }
    });

    const id2 = plugin.addCommand({
        id: "mostrar-tareas-vencidas",
        name: "Mostrar Tareas Vencidas",
        callback: async () => {
            await mostrarTareasVencidas(plugin);
        }
    });

    plugin.registeredCommandIdsGTD.push(id1.id, id2.id);
}

export function deactivateCommands(plugin: Plugin): void {
    if (!plugin.registeredCommandIdsGTD) return;
    plugin.registeredCommandIdsGTD.forEach(commandId => {
        const command = plugin.app.commands.commands[commandId];
        if (command) {
            command.callback = () => new Notice("Este comando ha sido desactivado.");
        }
    });
}