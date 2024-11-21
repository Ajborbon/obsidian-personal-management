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

// Añadir nueva clase modal para configurar días futuros
class FutureTasksModal extends Modal {
    private dias: number = 7;

    constructor(
        private pluginInstance: MyPlugin,
        private defaultDays: number = 7
    ) {
        super(pluginInstance.app);
        this.dias = defaultDays;
    }

    onOpen() {
        const { contentEl } = this;

        contentEl.createEl('h2', { text: 'Mostrar tareas futuras' });

        new Setting(contentEl)
            .setName('Número de días hacia adelante')
            .setDesc('Mostrar tareas programadas para los próximos X días')
            .addText(text => text
                .setValue(this.defaultDays.toString())
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
                        await this.pluginInstance.tareasAPI.mostrarTareasFuturas(this.dias);
                    }
                }));
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

class ScheduledTaskDaysModal extends Modal {
    private dias: number = 7;

    constructor(
        private pluginInstance: MyPlugin, 
        private defaultDays: number = 7
    ) {
        super(pluginInstance.app);
        this.dias = defaultDays;
    }

    onOpen() {
        const { contentEl } = this;

        contentEl.createEl('h2', { text: 'Mostrar tareas programadas próximas' });

        new Setting(contentEl)
            .setName('Número de días')
            .setDesc('Mostrar tareas programadas para los próximos X días')
            .addText(text => text
                .setValue(this.defaultDays.toString())
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
                        await this.pluginInstance.tareasAPI.mostrarTareasScheduledProximas(this.dias);
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
        name: "Mostrar Tareas Próximas",
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

     // Añadir nuevo comando para tareas futuras
     const tareasFuturasCommand = plugin.addCommand({
        id: "mostrar-tareas-futuras",
        name: "Mostrar Tareas Futuras Programadas",
        callback: async () => {
            if (managementPlugin.tareasAPI) {
                const modal = new FutureTasksModal(managementPlugin);
                modal.open();
            } else {
                new Notice("El módulo de tareas no está disponible.");
            }
        }
    });
    commandIds.push(tareasFuturasCommand.id);

        // Añadir nuevo comando para tareas en ejecución
        const tareasEnEjecucionCommand = plugin.addCommand({
            id: "mostrar-tareas-en-ejecucion",
            name: "Mostrar Tareas en Ejecución",
            callback: async () => {
                if (managementPlugin.tareasAPI) {
                    await managementPlugin.tareasAPI.mostrarTareasEnEjecucion();
                } else {
                    new Notice("El módulo de tareas no está disponible.");
                }
            }
        });
        commandIds.push(tareasEnEjecucionCommand.id);

        // Comando para tareas scheduled vencidas
    const tareasScheduledVencidasCommand = plugin.addCommand({
        id: "mostrar-tareas-scheduled-vencidas",
        name: "Mostrar Tareas Scheduled Vencidas",
        callback: async () => {
            if (managementPlugin.tareasAPI) {
                await managementPlugin.tareasAPI.mostrarTareasScheduledVencidas();
            } else {
                new Notice("El módulo de tareas no está disponible.");
            }
        }
    });
    commandIds.push(tareasScheduledVencidasCommand.id);

    // Comando para tareas scheduled próximas
    const tareasScheduledProximasCommand = plugin.addCommand({
        id: "mostrar-tareas-scheduled-proximas",
        name: "Mostrar Tareas Scheduled Próximas",
        callback: async () => {
            if (managementPlugin.tareasAPI) {
                const modal = new ScheduledTaskDaysModal(managementPlugin);
                modal.open();
            } else {
                new Notice("El módulo de tareas no está disponible.");
            }
        }
    });
    commandIds.push(tareasScheduledProximasCommand.id);

      // Comando para todas las tareas vencidas
      const todasTareasVencidasCommand = plugin.addCommand({
        id: "mostrar-todas-tareas-vencidas",
        name: "Mostrar Todas las Tareas Vencidas (Due, Scheduled, Start)",
        callback: async () => {
            if (managementPlugin.tareasAPI) {
                await managementPlugin.tareasAPI.mostrarTodasTareasVencidas();
            } else {
                new Notice("El módulo de tareas no está disponible.");
            }
        }
    });
    commandIds.push(todasTareasVencidasCommand.id);

      // Comando para mostrar tareas con dependencias
      const tareasDependientesCommand = plugin.addCommand({
        id: "mostrar-tareas-dependientes",
        name: "Mostrar Tareas con Dependencias",
        callback: async () => {
            if (managementPlugin.tareasAPI) {
                await managementPlugin.tareasAPI.mostrarTareasDependientes();
            } else {
                new Notice("El módulo de tareas no está disponible.");
            }
        }
    });
    commandIds.push(tareasDependientesCommand.id);

    const tareasPersonasCommand = plugin.addCommand({
        id: "mostrar-tareas-personas",
        name: "Mostrar Tareas por Persona",
        callback: async () => {
            if (managementPlugin.tareasAPI) {
                await managementPlugin.tareasAPI.mostrarTareasPersonas();
            } else {
                new Notice("El módulo de tareas no está disponible.");
            }
        }
    });
    commandIds.push(tareasPersonasCommand.id);

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