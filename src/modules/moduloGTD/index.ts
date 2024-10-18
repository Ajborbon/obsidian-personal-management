/* File Location:  src/modules/moduloGTD/index.ts */
import { Plugin, TFile } from 'obsidian';
import { registerCommands, deactivateCommands } from "./commands";

export class ModuloGTD {
    plugin: Plugin;
    moduloGTD: ModuloGTD | null = null;

    constructor(plugin: Plugin) {
        this.plugin = plugin;
    }

    activate() {
        if (this.moduloGTD) return; // Si ya está activo, no hacer nada

        registerCommands(this.plugin);
    }

    deactivate() {
        if (!this.moduloGTD) return; // Si ya está desactivado, no hacer nada
        deactivateCommands(this.plugin);
       
    }


}