// ModuloRegistroTiempo.ts

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
