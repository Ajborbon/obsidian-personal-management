import { Plugin, StatusBar, TFile } from 'obsidian';

export class StatusBarExtension {
    plugin: Plugin;
    statusBar: StatusBar | null = null;

    constructor(plugin: Plugin) {
        this.plugin = plugin;
    }

    activate() {
        if (this.statusBar) return; // Si ya está activo, no hacer nada

        this.statusBar = this.plugin.addStatusBarItem();
        this.updateStatusBar();
        // Registrar evento file-open
        this.plugin.registerEvent(
            this.plugin.app.workspace.on("file-open", (file: TFile) => {
                this.updateStatusBar(file);
            })
        );
    }

    deactivate() {
        if (!this.statusBar) return; // Si ya está desactivado, no hacer nada

        this.statusBar.remove();
        this.statusBar = null;
        // No necesitas desuscribir el evento aquí si usas registerEvent, Obsidian lo maneja automáticamente.
    }

    private updateStatusBar(file?: TFile) {
        const currentFile = file || this.plugin.app.workspace.getActiveFile();
        if (!currentFile || !this.statusBar) {
            this.statusBar?.setText('');
            return;
        }

        const fileCache = this.plugin.app.metadataCache.getFileCache(currentFile);
        const aliases = fileCache.frontmatter?.aliases || [];
        this.statusBar.setText(aliases.length > 0 ? `Alias: ${aliases[0]}` : 'No Alias');
    }
}
