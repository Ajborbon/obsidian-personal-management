import { App } from "obsidian";

export async function cumpleCondicion(app: App): Promise<boolean> {
    const files = app.vault.getMarkdownFiles();
    
    for (let file of files) {
        if (file.path.startsWith("Estructura/Registro Tiempo")) {
            // Obtener los metadatos del archivo desde metadataCache
            const metadata = app.metadataCache.getFileCache(file);
            
            // Verificar si el frontmatter contiene el campo "estado" con el valor "🟢"
            if (metadata?.frontmatter?.estado === "🟢") {
                return true;
            }
        }
    }
    
    return false;
}

