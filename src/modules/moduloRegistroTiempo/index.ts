import { Plugin } from "obsidian";
import { registerRibbonMenu } from "./ribbonMenu";
import { registerCommands } from "./commands";

export function activateModuloRegistroTiempo(plugin: Plugin): void {
    registerRibbonMenu(plugin);
    registerCommands(plugin);
}

