import { TFolder } from 'obsidian';
import { DateTime } from 'luxon';

export class FieldHandlerUtils {
  static async crearCarpeta(folderPath: string) {
    try {
      // Verifica si la carpeta ya existe
      const carpetaExistente = app.vault.getAbstractFileByPath(folderPath);
      if (carpetaExistente instanceof TFolder) {
        console.log(`La carpeta '${folderPath}' ya existe.`);
        return;
      }
      // Crea la carpeta
      await app.vault.createFolder(folderPath);
      console.log(`Carpeta '${folderPath}' creada exitosamente.`);
    } catch (error) {
      console.error(`Error al crear la carpeta '${folderPath}':`, error);
    }
  }

  // Esta función encuentra los archivos de subsistemas y cuyo estado es 🟢
  // Esta función sale de menuOtro, de registro Tiempo. Revisar si debo sincronizarlas.
  static async findMainFilesWithState(tipo: string, parametro: any, plugin: any) {
    const propertiesTipo = {
      AV: {
        folder: plugin.settings.folder_AreasVida,
      },
      AI: {
        folder: plugin.settings.folder_AreasInteres,
      },
      PQ: {
        folder: plugin.settings.folder_ProyectosQ,
      },
      PGTD: {
        folder: plugin.settings.folder_ProyectosGTD,
      },
      TI: {
        folder: plugin.settings.folder_TemasInteres,
      },
      RR: {
        folder: plugin.settings.folder_RecursosRecurrentes,
      },
      TQ: {
        folder: plugin.settings.folder_Trimestral,
      },
      AY: {
        folder: plugin.settings.folder_Anual,
      },
      // Puedes continuar añadiendo más casos aquí
    };

    // Asegúrate de que tipo es una propiedad válida antes de desestructurar
    if (!propertiesTipo[tipo]) {
      throw new Error(`Tipo ${tipo} no es válido.`);
    }

    const activeFilesWithFrontmatter = [];
    let files, trimestre: string;
    const folder = propertiesTipo[tipo].folder;
    switch (tipo) {
      case "AV":
        if (!parametro) { // parametro en este caso es el trimestre. Sin parametro se busca el nodoAreaVida
          trimestre = DateTime.now().toFormat("yyyy-Qq");
        }
        // Cuando el trimestre si se ingresa en la función, entonces busca las AreasVida del trimestre.
        else {
          trimestre = parametro;
        }

        files = app.vault.getMarkdownFiles().filter(file =>
          file.path.includes(folder) && !file.path.includes("Plantillas") && !file.path.includes("Archivo") && file.name.startsWith(trimestre));

        for (let file of files) {
          let metadata = app.metadataCache.getFileCache(file)?.frontmatter;

          if (metadata?.estado === "🟢") {
            let activeFile = Object.assign({}, metadata);
            activeFile.file = file;
            activeFilesWithFrontmatter.push(activeFile);
          }
        }

        break;
      case "AI":
      case "TQ":
      case "AY":
        files = app.vault.getMarkdownFiles().filter(file =>
          file.path.includes(folder) && !file.path.includes("Plantillas") && !file.path.includes("Archivo"));
        for (let file of files) {
          let metadata = app.metadataCache.getFileCache(file)?.frontmatter;
          if (metadata?.estado === "🟢") {
            let activeFile = Object.assign({}, metadata);
            activeFile.file = file;
            activeFilesWithFrontmatter.push(activeFile);
          }
        }
        break;
      default:
        files = app.vault.getMarkdownFiles().filter(file =>
          file.path.includes(folder) && !file.path.includes("Plantillas") && !file.path.includes("Archivo"));
        for (let file of files) {
          let metadata = app.metadataCache.getFileCache(file)?.frontmatter;
          if (metadata?.estado === "🟢") {
            let activeFile = Object.assign({}, metadata);
            activeFile.file = file;
            activeFilesWithFrontmatter.push(activeFile);
          }
        }
        break;
    }
    return activeFilesWithFrontmatter;
  }
}