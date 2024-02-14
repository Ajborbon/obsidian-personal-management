import { Plugin } from "obsidian";
import { registerRibbonMenu } from "./ui/ribbonButton";


export function activateModuloBusquedaAvanzada(plugin: Plugin): void {
    registerRibbonMenu(plugin);
}