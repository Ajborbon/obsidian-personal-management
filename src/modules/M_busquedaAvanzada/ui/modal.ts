import { App, Modal, Setting, TFile } from "obsidian";
import { FuzzyNoteSuggester } from "../search/FuzzyNoteSuggester"; // Asegúrate de que la ruta de importación sea correcta

export class SearchAreasDeVidaModal extends Modal {
    onSelectEstado: (estado: string) => void;
    estadoSeleccionado: string = "🟢"; // Estado por defecto como emoji directamente

    constructor(app: App, onSelectEstado: (estado: string) => void) {
        super(app);
        this.onSelectEstado = onSelectEstado;
    }

    onOpen() {
        let { contentEl } = this;
        contentEl.empty();

        contentEl.createEl("h3", { text: "Buscar Áreas de Vida" });

        // Usando Setting para crear el Dropdown
        new Setting(contentEl)
            .setName("Estado")
            .setDesc("Elige el estado:")
            .addDropdown(dropdown => {
                dropdown.addOptions({ "🟢": "Verde", "🔵": "Azul", "🟡": "Amarillo", "🔴": "Rojo" });
                dropdown.setValue(this.estadoSeleccionado); // Establece el valor por defecto
                dropdown.onChange(value => {
                    this.estadoSeleccionado = value;
                });
            });

        // Botón de búsqueda
        new Setting(contentEl)
            .addButton(button => {
                button.setButtonText("Buscar")
                    .onClick(async () => {
                        const notasFiltradas = await this.filtrarNotasPorEstadoYDirectorio("Estructura/Areas de Vida", this.estadoSeleccionado);
                        console.log("Notas filtradas:", notasFiltradas.length, notasFiltradas);
                        new FuzzyNoteSuggester(this.app, notasFiltradas).open();
                        this.close();
                    });
            });
    }

    // Método para filtrar notas por estado y directorio
    async filtrarNotasPorEstadoYDirectorio(directorio: string, estado: string): Promise<TFile[]> {
        const archivos = this.app.vault.getMarkdownFiles();
        let notasFiltradas = archivos.filter(archivo => {
            const path = archivo.path;
            if (!path.startsWith(directorio)) return false; // Filtra por directorio
            
            const datos = this.app.metadataCache.getFileCache(archivo);
            console.log("Archivo procesado:", archivo.path);
            // Asegúrate de que el estado del frontmatter coincide con el estado proporcionado
            if (datos.frontmatter && datos.frontmatter.estado === estado) {
                console.log("Archivo incluido:", archivo.path);
                return true;
            }
            return false;
        });
    
        // Ordena las notas filtradas por fecha de modificación, de la más reciente a la más antigua
        notasFiltradas.sort((a, b) => {
            return b.stat.mtime - a.stat.mtime; // Descendente
        });
    
        return notasFiltradas;
    }
    
}
