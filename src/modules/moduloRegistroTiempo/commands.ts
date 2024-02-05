import { Plugin } from "obsidian";

export function registerCommands(plugin: Plugin): void {
    plugin.addCommand({
        id: "registros-de-tiempo-del-dia",
        name: "Registros de tiempo del día",
        checkCallback: (checking: boolean) => {
            const activeLeaf = plugin.app.workspace.activeLeaf;
            if (activeLeaf) {
                const filePath = activeLeaf.view.file?.path || "";
                if (filePath.startsWith("Estructura/Periodos/Diario/")) {
                    if (!checking) {
                        // Aquí iría la lógica del comando
                        console.log("Registros de tiempo del día");
                    }
                    return true;
                }
            }
            return false;
        }
    });
}

