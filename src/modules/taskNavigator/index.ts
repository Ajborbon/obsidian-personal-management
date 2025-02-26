/*
 * Filename: /src/modules/taskNavigator/index.ts
 * Created Date: 2025-02-26
 * Author: Module Creator
 * -----
 * Copyright (c) 2025
 */

import { Plugin } from "obsidian";
import { registerCommands, deactivateCommands } from "./commands";

export class TaskNavigatorModule {
    plugin: Plugin;

    constructor(plugin: Plugin) {
        this.plugin = plugin;
    }

    /**
     * Activa el módulo registrando los comandos
     */
    activate() {
        registerCommands(this.plugin);
    }

    /**
     * Desactiva el módulo, asegurándose de limpiar todos los comandos registrados
     */
    deactivate() {
        deactivateCommands(this.plugin);
    }
}