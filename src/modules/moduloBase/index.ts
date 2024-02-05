import { Plugin } from "obsidian";
import { ejemploCommand } from "./commands";
import { ejemploView } from "./views";

export function activateModuloBase(plugin: Plugin): void {
    // Registra comandos del módulo
    plugin.addCommand(ejemploCommand);

    // Registra vistas o elementos de UI específicos del módulo
    plugin.addRibbonIcon("dice", "Ejemplo View", () => {
        new ejemploView().show();
    });

    // Aquí podrías inicializar otras funcionalidades del módulo
}

