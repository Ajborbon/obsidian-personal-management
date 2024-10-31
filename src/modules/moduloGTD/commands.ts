// src/modules/moduloGTD/commands.ts

import { Plugin, Notice } from 'obsidian';
import { ingresarBandejaEntrada } from "./inbox";
import MyPlugin from '../../main';

export function registerCommands(plugin: Plugin): void {
    // Verificar que el plugin es del tipo correcto
    const managementPlugin = plugin as MyPlugin;

    // Comando para ingresar a la bandeja de entrada
    const inboxCommand = plugin.addCommand({
        id: "ingresar-inbox",
        name: "Ingresar Bandeja de Entrada -> Inbox",
        callback: async () => {
            await ingresarBandejaEntrada(plugin);
        }
    });

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

    // Comando para mostrar tareas próximas con días personalizados
    const tareasProximasCustomCommand = plugin.addCommand({
        id: "mostrar-tareas-proximas-custom",
        name: "Mostrar Tareas Próximas (Especificar días)",
        callback: async () => {
            if (managementPlugin.tareasAPI) {
                // Utilizamos un modal simple de Obsidian para pedir el número de días
                const modal = new TaskDaysModal(managementPlugin);
                modal.open();
            } else {
                new Notice("El módulo de tareas no está disponible.");
            }
        }
    });

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

     // Comando para mostrar tareas por iniciar (vencidas y próximas)
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


    // Registrar los IDs de los comandos para poder desactivarlos después
    plugin.registeredCommandIdsGTD = plugin.registeredCommandIdsGTD || [];
    plugin.registeredCommandIdsGTD.push(
        inboxCommand.id,
        tareasVencidasCommand.id,
        tareasProximasCommand.id,
        tareasProximasCustomCommand.id,
        tareasHoyCommand.id,
        tareasStartVencidasCommand.id,
        tareasStartProximasCommand.id
    );
}

// Modal para especificar número de días
import { Modal, Setting } from 'obsidian';

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