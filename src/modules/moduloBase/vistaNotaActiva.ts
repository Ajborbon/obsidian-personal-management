// Imagina que esto es una simplificación de una implementación de una vista
import { ItemView } from "obsidian";

export class VistaNotaActiva extends ItemView {
    constructor(leaf) {
        super(leaf);
    }

    getViewType() {
        return "vista-nota-activa";
    }

    getDisplayText() {
        return "Nota Activa";
    }

    getIcon() {
        // Retorna el nombre del ícono que deseas usar
        return "history"; // Este es un ejemplo, cambia "documento" por el nombre del ícono que desees usar
    }

    async onOpen() {
        const activeFile = this.app.workspace.getActiveFile();
        if (activeFile) {
            // Limpia el contenido existente y muestra el nombre de la nota activa.
            this.containerEl.empty();
            this.containerEl.createEl('h1', { text: 'Nota Activa' });
            this.containerEl.createEl('p', { text: `El archivo activo es: ${activeFile.basename}` });
        }
    }

    // Opcional: Implementa onClose si necesitas limpieza al cerrar la vista.
}