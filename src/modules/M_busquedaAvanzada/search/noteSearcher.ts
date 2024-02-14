// src/modules/M_busquedaAvanzada/search/noteSearcher.ts

// Asegúrate de importar FuzzyNoteSuggester en la parte superior de tu archivo
import { FuzzyNoteSuggester } from "./FuzzyNoteSuggester";
import { Plugin, TFile } from "obsidian";

export async function buscarNotasPorEstado(plugin: Plugin, folder: string, estado: string): Promise<void> {
    const files = plugin.app.vault.getMarkdownFiles();
    let notasFiltradas = files.filter(file => {
        const path = file.path;
        const cache = plugin.app.metadataCache.getFileCache(file);
        if (!path.startsWith(folder)) return false; // Filtra por carpeta
        if (estado !== "todos" && cache.frontmatter && cache.frontmatter.estado !== estado) return false; // Filtra por estado
        return true;
    });

    // Ordena las notas por fecha de modificación, de más reciente a más antiguo
    notasFiltradas.sort((a, b) => b.stat.mtime - a.stat.mtime);

    // Aquí deberías implementar la lógica para mostrar estas notas al usuario, posiblemente utilizando un fuzzy finder o una lista
    // Inicializa y muestra el FuzzyNoteSuggester con las notas filtradas
    new FuzzyNoteSuggester(plugin.app, notasFiltradas).open();
}
