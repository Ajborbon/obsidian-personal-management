import { Plugin } from "obsidian";
import { StatusBarExtension } from "./statusBar";

export function activateModuloAliasStatusBar(plugin: Plugin): void {
    const statusBarExtension = new StatusBarExtension(plugin);
    statusBarExtension.addStatusBarItem();
    plugin.registerEvent(
        plugin.app.workspace.on("file-open", (file) => {
            statusBarExtension.updateStatusBar(file);
        })
    );
}
