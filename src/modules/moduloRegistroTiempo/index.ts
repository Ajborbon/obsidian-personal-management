/*
 * Filename: /src/modules/moduloRegistroTiempo/index.ts
 * Path: /src/modules/moduloRegistroTiempo
 * Created Date: 2024-03-04 17:58:30
 * Author: Andrés Julián Borbón
 * -----
 * Last Modified: 2025-02-23 17:41:28
 * Modified By: Andrés Julián Borbón
 * -----
 * Copyright (c) 2025 - Andrés Julián Borbón
 */


import { Plugin } from "obsidian";
import { registerRibbonMenu, deactivateRibbonMenu } from "./ribbonMenu";
import { registerCommands, deactivateCommands } from "./commands";

export class ModuloRegistroTiempo {
    plugin: Plugin;

    constructor(plugin: Plugin) {
        this.plugin = plugin;
    }

    activate() {
        // Asegúrate de que el ribbon solo se registre si aún no ha sido registrado
        if (!this.plugin.ribbonButtonRT) {
            registerRibbonMenu(this.plugin);
        }
        registerCommands(this.plugin);
    }

    deactivate() {
        deactivateRibbonMenu(this.plugin);
        deactivateCommands(this.plugin);
    }
}
