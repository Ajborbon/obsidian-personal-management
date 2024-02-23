import { Plugin, TFile } from 'obsidian';
import { registerCommands, deactivateCommands } from "./commands";

export class ModuloBase {
    plugin: Plugin;
    moduloBase: ModuloBase | null = null;

    constructor(plugin: Plugin) {
        this.plugin = plugin;
    }

    activate() {
        if (this.moduloBase) return; // Si ya está activo, no hacer nada

        registerCommands(this.plugin);
    }

    deactivate() {
        if (!this.statusBar) return; // Si ya está desactivado, no hacer nada
        deactivateCommands(this.plugin);
       
    }


}