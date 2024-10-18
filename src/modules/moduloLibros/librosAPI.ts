import { TFile, Notice, TFolder } from 'obsidian';
import {DateTime , Duration} from 'luxon';

export class librosAPI {
    //private utilsApi: utilsAPI;
    private plugin: Plugin;
      private tp: object;
    private nota: object;
  
    constructor(plugin: Plugin) {
        this.plugin = plugin;
        // Inicializa folder e indice getcon valores predeterminados o lógica específica.
        this.tp = this.plugin.tp;
    }

      async kindle(dv) {
    let folderPrincipal = this.plugin.settings["folder_KindleNotes"];
    const libraryFolder = this.plugin.app.vault.getAbstractFileByPath(folderPrincipal);

    if (!(libraryFolder instanceof TFolder)) {
      new Notice(`La carpeta ${folderPrincipal} no existe.`);
      return;
    }

    let archivoActivo = this.plugin.app.workspace.getActiveFile();
    if (!archivoActivo) {
      new Notice("No hay una nota activa.");
      return;
    }

    const metadata = this.plugin.app.metadataCache.getFileCache(archivoActivo);
    const yamlData = metadata?.frontmatter || {};

    if (yamlData.kindleNote) {
      const linkElement = document.createElement("a");
      linkElement.href = yamlData.kindleNote;
      linkElement.textContent = "Ver en Kindle";
      dv.container.innerHTML = ""; // Limpiar el contenedor
      dv.container.appendChild(linkElement);
    } else {
      // Mostrar suggester para elegir la nota Kindle correspondiente
      const notesList = await this.getNotesFromFolder(folderPrincipal);

      if (notesList.length === 0) {
        new Notice("No hay notas en el folder de Kindle.");
        return;
      }

      const suggestorConfig: SuggesterConfig<TFile> = {
        onChooseItem: async (selectedNote, evt): Promise<void> => {
          yamlData.kindleNote = selectedNote.path;
          await this.plugin.app.vault.modify(archivoActivo, `---\n${yamlData}\n...`);
          new Notice("Se ha guardado el link de la nota Kindle en el archivo actual.");
        },
        getItems: () => notesList,
        renderSuggestion: (item: TFile, el: HTMLElement) => {
          el.textContent = item.basename;
        }
      };

      new Suggester(this.plugin, suggestorConfig).start();
    }
  }

async getNotesFromFolder(folderPath: string): Promise<TFile[]> {
  const folderFiles = await this.plugin.app.vault.getAllLoadedFiles();
  return folderFiles.filter(file => file instanceof TFile && file.path.startsWith(folderPath));
}



      // Función para crear y mostrar el botón inicial "Menú hoy"
      async mostrarBotonCrearLibro(dv) {
        let folderPrincipal = this.plugin.settings["folder_Biblioteca"];
        const libraryFolder = this.plugin.app.vault.getAbstractFileByPath(folderPrincipal);
    
        if (!(libraryFolder instanceof TFolder)) {
          new Notice(`La carpeta ${folderPrincipal} no existe.`);
          return;
        }
    
        let archivoActivo = this.plugin.app.workspace.getActiveFile();
        if (!archivoActivo) {
          new Notice("No hay una nota activa.");
          return;
        }
    
        const bookExists = await this.bookExistsInLibrary(folderPrincipal, archivoActivo);
    
        if (bookExists) {
          const alias = await this.getAlias(bookExists);
          const texto = document.createElement("p");
          const link = document.createElement("a");
          link.href = bookExists.path;
          link.textContent = alias;
          link.dataset.href = bookExists.path;
          link.className = "internal-link";
          
          texto.textContent = `El libro ya está en la biblioteca: `;
          texto.appendChild(link);
          dv.container.appendChild(texto);
        } else {
          dv.container.innerHTML = ""; // Limpiar el contenedor
    
          const botonCrearLibro = document.createElement("button");
          botonCrearLibro.textContent = "Ingresar a mi Biblioteca";
          dv.container.appendChild(botonCrearLibro);
    
          botonCrearLibro.onclick = async () => {
            await this.ingresarLibroBiblioteca(); // Mostrar los botones adicionales al hacer clic
          };
        }
      }
    
      async bookExistsInLibrary(folderPrincipal, archivoActivo) {
        const files = this.plugin.app.vault.getFiles();
        const activeFileName = archivoActivo.basename;
    
        for (let file of files) {
          if (file.path.startsWith(folderPrincipal)) {
            const cache = this.plugin.app.metadataCache.getFileCache(file);
            const frontmatter = cache?.frontmatter;
            
            if (frontmatter && frontmatter.asunto) {
              const asunto = frontmatter.asunto;
              if (Array.isArray(asunto)) {
                for (let entry of asunto) {
                  if (entry.includes(`[[${activeFileName}]]`)) {
                    return file;
                  }
                }
              } else if (typeof asunto === 'string' && asunto.includes(`[[${activeFileName}]]`)) {
                return file;
              }
            }
          }
        }
        return false;
      }

      async getAlias(file) {
        const cache = this.plugin.app.metadataCache.getFileCache(file);
        const frontmatter = cache?.frontmatter;
        return frontmatter && frontmatter.aliases && frontmatter.aliases[0] ? frontmatter.aliases[0] : file.basename;
      }




  async ingresarLibroBiblioteca(){
    debugger;
    const template = app.vault.getAbstractFileByPath("Plantillas/Subsistemas/Libros/Biblioteca/Plt - Libro a Biblioteca.md");  //Obtener el TFile del template
    const filename = "Nuevo Libro"
    const folder = app.vault.getAbstractFileByPath("Inbox")
    if (template instanceof TFile) {
      // Ahora 'file' es tu archivo deseado, y puedes trabajar con él como necesites
      console.log("Archivo encontrado:", template);
     } else {
      // Si el archivo no se encontró, 'file' será null
      console.log("Archivo no encontrado.");
     }
    let crearNota = this.tp.file.static_functions.get("create_new");
    await crearNota (template, filename, false, folder).basename;
}




 

}