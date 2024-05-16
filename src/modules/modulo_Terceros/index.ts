import { Plugin, TFile } from 'obsidian';
import { registerCommands, deactivateCommands } from "./commands";

export class ModuloTerceros {
    plugin: Plugin;
    moduloTerceros: ModuloTerceros | null = null;

    constructor(plugin: Plugin) {
        this.plugin = plugin;
    }

    activate() {
        if (this.moduloTerceros) return; // Si ya está activo, no hacer nada

        registerCommands(this.plugin);
    }

    deactivate() {
        if (!this.moduloTerceros) return; // Si ya está desactivado, no hacer nada
        deactivateCommands(this.plugin);
       
    }


}