// src/modules/taskManager/commands.ts

import { Plugin, Notice, Modal, Setting } from 'obsidian';
import MyPlugin from '../../main';

class TaskDaysModal extends Modal {
    private dias: number = 7;

    constructor(private pluginInstance: MyPlugin) {
        super(pluginInstance.app);
    }

    onOpen() {
        const { contentEl } = this;

        contentEl.createEl('h2', { text: 'Mostrar tareas próximas' });

        new Setting(contentEl)
            .setName('Número de días')
            .setDesc('Mostrar tareas para los próximos X días')
            .addText(text => text
                .setValue('7')
                .onChange(value => {
                    this.dias = parseInt(value) || 7;
                }));

        new Setting(contentEl)
            .addButton(btn => btn
                .setButtonText('Mostrar tareas')
                .setCta()
                .onClick(async () => {
                    this.close();
                    if (this.pluginInstance.tareasAPI) {
                        await this.pluginInstance.tareasAPI.mostrarTareasProximas(this.dias);
                    }
                }));
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

export function registerTaskManagerCommands(plugin: Plugin): void {
    const managementPlugin = plugin as MyPlugin;
    const commandIds: string[] = [];

    // Comando para mostrar tareas vencidas
    const tareasVencidasCommand = plugin.addCommand({
        id: "mostrar-tareas-vencidas",
        name: "Mostrar Tareas Vencidas",
        callback: async () => {
            if (managementPlugin.tareasAPI) {
                await managementPlugin.tareasAPI.mostrarTareasVencidas();
            } else {
                new Notice("El módulo de tareas no está disponible.");
            }
        }
    });
    commandIds.push(tareasVencidasCommand.id);

    // Comando para mostrar tareas próximas
    const tareasProximasCommand = plugin.addCommand({
        id: "mostrar-tareas-proximas",
        name: "Mostrar Tareas Próximas y Vencidas",
        callback: async () => {
            if (managementPlugin.tareasAPI) {
                await managementPlugin.tareasAPI.mostrarTareasProximas();
            } else {
                new Notice("El módulo de tareas no está disponible.");
            }
        }
    });
    commandIds.push(tareasProximasCommand.id);

    // Comando para mostrar tareas próximas con días personalizados
    const tareasProximasCustomCommand = plugin.addCommand({
        id: "mostrar-tareas-proximas-custom",
        name: "Mostrar Tareas Próximas (Especificar días)",
        callback: async () => {
            if (managementPlugin.tareasAPI) {
                const modal = new TaskDaysModal(managementPlugin);
                modal.open();
            } else {
                new Notice("El módulo de tareas no está disponible.");
            }
        }
    });
    commandIds.push(tareasProximasCustomCommand.id);

    // Comando para mostrar tareas de hoy
    const tareasHoyCommand = plugin.addCommand({
        id: "mostrar-tareas-hoy",
        name: "Mostrar Tareas para Hoy",
        callback: async () => {
            if (managementPlugin.tareasAPI) {
                await managementPlugin.tareasAPI.mostrarTareasHoy();
            } else {
                new Notice("El módulo de tareas no está disponible.");
            }
        }
    });
    commandIds.push(tareasHoyCommand.id);

    // Comando para mostrar tareas con inicio vencido
    const tareasStartVencidasCommand = plugin.addCommand({
        id: "mostrar-tareas-start-vencidas",
        name: "Mostrar Tareas Pendientes de Iniciar",
        callback: async () => {
            if (managementPlugin.tareasAPI) {
                await managementPlugin.tareasAPI.mostrarTareasStartVencidas();
            } else {
                new Notice("El módulo de tareas no está disponible.");
            }
        }
    });
    commandIds.push(tareasStartVencidasCommand.id);

    // Comando para mostrar tareas por iniciar
    const tareasStartProximasCommand = plugin.addCommand({
        id: "mostrar-tareas-start-proximas",
        name: "Mostrar Tareas por Iniciar (Vencidas y Próximas)",
        callback: async () => {
            if (managementPlugin.tareasAPI) {
                await managementPlugin.tareasAPI.mostrarTareasStartProximas();
            } else {
                new Notice("El módulo de tareas no está disponible.");
            }
        }
    });
    commandIds.push(tareasStartProximasCommand.id);

    // Guardar los IDs de los comandos en el plugin
    (plugin as any).registeredTaskManagerCommandIds = commandIds;
}

export function deactivateTaskManagerCommands(plugin: Plugin): void {
    const commandIds = (plugin as any).registeredTaskManagerCommandIds;
    if (!commandIds) return;
    
    commandIds.forEach(commandId => {
        const command = plugin.app.commands.commands[commandId];
        if (command) {
            command.callback = () => new Notice("Este comando ha sido desactivado.");
        }
    });
    
    // Limpiar el array de comandos registrados
    (plugin as any).registeredTaskManagerCommandIds = [];
}