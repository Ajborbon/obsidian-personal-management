  import { Plugin, MarkdownView, Editor, Menu, Notice, PluginSettingTab, Setting, App, setIcon, addIcon, Modal, SuggestModal, FuzzySuggestModal, ItemView, WorkspaceLeaf } from 'obsidian';
  import { ExampleModal } from "./modal";


 // Ejemplo Settings 1/5
      
      interface ExamplePluginSettings {
        dateFormat: string;
        nombre: string;
      }

      const DEFAULT_SETTINGS: Partial<ExamplePluginSettings> = {
        dateFormat: "YYYY-MM-DD",
        nombre: "Andrés Julián"
      };


  export default class SamplePlugin extends Plugin {
     // Ejemplo Settings 2/5
      settings: ExamplePluginSettings;  
      
      async onload() {
        // Código de inicialización aquí
	    console.log('Cargando mi plugin de ejemplo.');
      
     

      // Ejemplo de agregar un comando a la Paleta de Comandos.
      this.addCommand({
        id: "Saludo a la consola",
        name: "Imprimir saludo en la consola",
        callback: () => {
          console.log("¡Hey, tú!");
        },
      });

      // Ejemplo de uso de un comando condicional

      this.addCommand({
        id: 'insert-current-date-time',
        name: 'Insertar Fecha y Hora Actual',
        checkCallback: (checking: boolean) => {
          const editor = getActiveEditor();
          if (editor) {
            // Si estamos en modo de verificación, simplemente retorna true para habilitar el comando.
            if (checking) return true;
   
            // Si no estamos verificando, inserta la fecha y hora actual.
            const dateTime = new Date().toLocaleString();
            editor.replaceRange(dateTime, editor.getCursor());
          } else {
            // Retorna false si no hay un editor activo para deshabilitar el comando.
            return false;
          }
        },
      });


      // Ejemplo de uso comando Editor Callback.
      this.addCommand({
        id: 'example-command',
        name: 'Comando de ejemplo',
        editorCallback: (editor: Editor, view: MarkdownView) => {
          const sel = editor.getSelection()
      
          console.log(`Has seleccionado: ${sel}`);
        },
      })


      this.addCommand({
        id: 'highlight-selected-text',
        name: 'Resaltar Texto Seleccionado',
        editorCheckCallback: (checking: boolean, editor: Editor, view: MarkdownView) => {
          const value = getRequiredValue(editor);
   
          if (value) {
            if (!checking) {
              doCommand(editor, value);
            }
   
            return true; // Habilita el comando porque hay texto seleccionado.
          }
   
          return false; // Deshabilita el comando porque no hay texto seleccionado.
        },
      });


      this.addCommand({
        id: 'example-command',
        name: 'Comando de ejemplo',
        hotkeys: [{ modifiers: ["Mod", "Shift"], key: "a" }],
        callback: () => {
          console.log('¡Hey, tú!');
        },
      });

      // EJEMPLO DE MENU 1
      this.addRibbonIcon("brain", "Abrir menú", (evento) => {
        const menu = new Menu();
  
        menu.addItem((item) =>
          item
            .setTitle("Copiar")
            .setIcon("documents")
            .onClick(() => {
              new Notice("Copiado");
            })
        );
  
        menu.addItem((item) =>
          item
            .setTitle("Pegar")
            .setIcon("paste")
            .onClick(() => {
              new Notice("Pegado");
            })
        );
  
        menu.showAtMouseEvent(evento);
      });

      // EJEMPLO DE MENU 2
      this.registerEvent(
        this.app.workspace.on("file-menu", (menu, archivo) => {
          menu.addItem((item) => {
            item
              .setTitle("Imprimir ruta del archivo 🥰")
              .setIcon("document")
              .onClick(async () => {
                new Notice(archivo.path);
              });
          });
        })
      );
  
      this.registerEvent(
        this.app.workspace.on("editor-menu", (menu, editor, vista) => {
          menu.addItem((item) => {
            item
              .setTitle("Imprimir ruta del archivo 👈")
              .setIcon("document")
              .onClick(async () => {
                new Notice(vista.file.path);
              });
          });
        })
      );
	    
     // Añadir un ícono a la barra de herramientas (ribbon)
     this.addRibbonIcon('aperture', 'Plantillas rápidas', (event) => {
      // Crear y mostrar el menú contextual al hacer clic en el ícono
      const menu = new Menu();
      menu.addItem((item) =>
        item
          .setTitle('Encabezado')
          .setIcon('header')
          .onClick(() => {
            this.insertText('# Encabezado\n');
          })
      );
      menu.addItem((item) =>
        item
          .setTitle('Pie de página')
          .setIcon('footer')
          .onClick(() => {
            this.insertText('\n\n---\nPie de página');
          })
      );
      menu.showAtMouseEvent(event);
    });
      
      
    // Añade la pestaña de configuración
    this.addSettingTab(new ExampleSettingTab_1(this.app, this));
     
    // Añade un icono a la barra de estado.
    const item = this.addStatusBarItem();
    setIcon(item, "fingerprint");

    addIcon("circle", `<circle cx="50" cy="50" r="50" fill="currentColor" />`);

    this.addRibbonIcon("circle", "Haz clic en mí", () => {
      console.log("¡Hola, tú!");
    });


    // Creación del modal
    this.addCommand({
      id: "display-modal",
      name: "Mostrar modal",
      callback: () => {
        new ExampleModal(this.app).open();
      },
    });

    // Creación modal2
    this.addCommand({
      id: "display-modal2",
      name: "Mostrar modal Nombre",
      callback: () => {
        new ExampleModal2(this.app, (result) => {
          new Notice(`Hola, ${result}!`);
        }).open();
        },
      });


      // Creación modal3
    this.addCommand({
      id: "display-modal3",
      name: "Mostrar modal Listado",
      callback: () => {
        new ExampleModal3(this.app, (result) => {
          new Notice(`Has elegido, ${result}!`);
        }).open();
        },
      });

      // Creación modal4 Fuzzy 
      this.addCommand({
        id: "open-book-fuzzy-modal",
        name: "Fuzzy modal",
        callback: () => {
          new ExampleModal4(this.app).open();
        },
      });

      // Creación modal5 Fuzzy escrito por la IA
      this.addCommand({
        id: "open-book-suggest-modal",
        name: "Abrir modal de sugerencia de libros Fuzzy",
        callback: () => {
          new BookSuggestModal(this.app).open();
        },
      });


      // Ejemplo Settings 3/5
      await this.loadSettings();
      this.addSettingTab(new ExampleSettingTab(this.app, this));
    

      // Del ejemplo de VIEWS
      this.registerView(
        VIEW_TYPE_EXAMPLE,
        (leaf) => new ExampleView(leaf)
      );
  
      this.addRibbonIcon("dice", "Activar vista", () => {
        this.activateView();
      });

       // del ejemplo de Workspace
       this.addRibbonIcon("croissant", "Imprimir tipos de hoja", () => {
        this.app.workspace.iterateAllLeaves((leaf) => {
          console.log(leaf.getViewState().type);
        });
      }); 
    //return Promise.resolve();
    
    
    // Ejemplo de acceso a la Boveda
    this.addRibbonIcon("info", "Calcular longitud promedio de archivo", async () => {
      const longitudArchivo = await this.longitudPromedioArchivo();
      new Notice(`La longitud promedio del archivo es de ${longitudArchivo} caracteres.`);
    });
    }

      async onunload() {
          // Código de limpieza aquí
          console.log('Descargando mi plugin de ejemplo.');
          return Promise.resolve();
      }

      // Función para insertar texto en la nota activa
      insertText(text: string) {
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (activeView) {
          const editor = activeView.editor;
          editor.replaceSelection(text);
        }
      }


      // Ejemplo Settings 4/5
      async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
      }

      async saveSettings() {
        await this.saveData(this.settings);
      }


      // Del ejemplo de VIEWS
      async activateView() {
        const { workspace } = this.app;
    
        let leaf: WorkspaceLeaf | null = null;
        const leaves = workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE);
    
        if (leaves.length > 0) {
          // Una hoja con nuestra vista ya existe, usar esa
          leaf = leaves[0];
        } else {
          // Nuestra vista no se pudo encontrar en el espacio de trabajo, crear un nuevo panel
          // en la barra lateral derecha para ella
          leaf = workspace.getRightLeaf(false);
          await leaf.setViewState({ type: VIEW_TYPE_EXAMPLE, active: true });
        }
    
        // "Revelar" el panel en caso de que esté en una barra lateral colapsada
        workspace.revealLeaf(leaf);
      }

      // Función del ejemplo de acceso a la boveda
      async longitudPromedioArchivo(): Promise<number> {
        const { vault } = this.app;
    
        const contenidosArchivo: string[] = await Promise.all(
          vault.getMarkdownFiles().map((archivo) => vault.cachedRead(archivo))
        );
    
        let longitudTotal = 0;
        contenidosArchivo.forEach((contenido) => {
          longitudTotal += contenido.length;
        });
    
        return longitudTotal / contenidosArchivo.length;
      }

  }

  // Las funciones que se declaren, van afuera de la clase.
  
  // Para el ejemplo de implementación de comando condicional.
      function getActiveEditor() {
        // Obtiene la vista activa desde el workspace de Obsidian.
        const activeLeaf = app.workspace.activeLeaf;
        if (!activeLeaf) {
          return null;
        }
      
        // Retorna el editor si la vista activa es un editor de Markdown.
        return activeLeaf.view instanceof MarkdownView ? activeLeaf.view.editor : null;
      }

   // Funciones para la prueba de comando condicional de editor 
      function getRequiredValue(editor) {
        // Retorna el texto seleccionado en el editor, o null si no hay selección.
        const selectedText = editor.getSelection();
        return selectedText ? selectedText : null;
      }

      function doCommand(editor, value) {
        // Reemplaza el texto seleccionado por el mismo texto rodeado de `==`.
        const highlightedText = `==${value}==`;
        editor.replaceSelection(highlightedText);
      }

  // Para el ejemplo de HTML Elementos
  
  // Definición de la clase para la pestaña de configuraciones
  class ExampleSettingTab_1 extends PluginSettingTab {
    plugin: SamplePlugin;
  
    constructor(app: App, plugin: SamplePlugin) {
      super(app, plugin);
      this.plugin = plugin;
    }
  
    display(): void {
      const { containerEl } = this;
  
      // Limpia el contenedor de configuraciones
      containerEl.empty();
  
      // Añade un título a la pestaña de configuraciones
      containerEl.createEl("h2", { text: "Settings Tab!" });
  
      // Añade información del libro usando elementos HTML
      const book = containerEl.createEl("div", { cls: "libro" });
      book.createEl("h3", { text: "Cómo tomar notas inteligentes", cls: "libro__titulo" });
      book.createEl("p", { text: "Autor: Sönke Ahrens", cls: "libro__autor" });
    }
  }


  // Definición de la clase para el ejemplo de Modales.
  export class ExampleModal extends Modal {
    constructor(app: App) {
      super(app);
    }
  
    onOpen() {
      let { contentEl } = this;
      contentEl.setText("¡Mírame, soy un modal! 👀");
    }
  
    onClose() {
      let { contentEl } = this;
      contentEl.empty();
    }
  }

  // Ejemplo 2 de Modales.
  export class ExampleModal2 extends Modal {
    result: string;
    onSubmit: (result: string) => void;
  
    constructor(app: App, onSubmit: (result: string) => void) {
      super(app);
      this.onSubmit = onSubmit;
    }
  
    onOpen() {
      const { contentEl } = this;
  
      contentEl.createEl("h1", { text: "¿Cuál es tu nombre?" });
  
      new Setting(contentEl)
        .setName("Nombre")
        .addText((text) =>
          text.onChange((value) => {
            this.result = value;
          }));
  
      new Setting(contentEl)
        .addButton((btn) =>
          btn
            .setButtonText("Enviar")
            .setCta()
            .onClick(() => {
              this.close();
              this.onSubmit(this.result);
            }));
    }
  
    onClose() {
      let { contentEl } = this;
      contentEl.empty();
    }
  }
  


  // Ejemplo 3 de Modales

  interface Book {
    title: string;
    author: string;
  }
  
  const ALL_BOOKS = [
    {
      title: "Cómo tomar notas inteligentes",
      author: "Sönke Ahrens",
    },
    {
      title: "Pensar rápido, pensar despacio",
      author: "Daniel Kahneman",
    },
    {
      title: "Trabajo profundo",
      author: "Cal Newport",
    },
  ];
  
  export class ExampleModal3 extends SuggestModal<Book> {
    // Devuelve todas las sugerencias disponibles.
    getSuggestions(query: string): Book[] {
      return ALL_BOOKS.filter((book) =>
        book.title.toLowerCase().includes(query.toLowerCase())
      );
    }
  
    // Renderiza cada ítem de sugerencia.
    renderSuggestion(book: Book, el: HTMLElement) {
      el.createEl("div", { text: book.title });
      el.createEl("small", { text: book.author });
    }
  
    // Realiza una acción con la sugerencia seleccionada.
    onChooseSuggestion(book: Book, evt: MouseEvent | KeyboardEvent) {
      new Notice(`Seleccionado ${book.title}`);
    }
  }
   
  // Ejemplo 4 Modales Fuzzy (el del texto.)
  export class ExampleModal4 extends FuzzySuggestModal<Book> {
    getItems(): Book[] {
      return ALL_BOOKS;
    }
  
    getItemText(book: Book): string {
      return book.title;
    }
  
    onChooseItem(book: Book, evt: MouseEvent | KeyboardEvent) {
      new Notice(`Selected ${book.title}`);
    }
  }

   // Ejemplo 5 de Modales - Fuzzy Escrito por IA
   class BookSuggestModal extends FuzzySuggestModal {
    constructor(app: App) {
      super(app);
    }
  
    getItems(): Book[] {
      return ALL_BOOKS;
    }
  
    getItemText(book: Book): string {
      return `${book.title} por ${book.author}`;
    }
  
    onChooseItem(book: Book, evt: MouseEvent | KeyboardEvent): void {
      new Notice(`Seleccionado: ${book.title} por ${book.author}`);
    }
  }  

  // Ejemplo Settings 5/5
    export class ExampleSettingTab extends PluginSettingTab {
      plugin: SamplePlugin;

      constructor(app: App, plugin: SamplePlugin) {
        super(app, plugin);
        this.plugin = plugin;
      }

      display(): void {
        let { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
          .setName("Formato de fecha")
          .setDesc("Formato de fecha predeterminado")
          .addText((text) =>
            text
              .setPlaceholder("MMMM dd, yyyy")
              .setValue(this.plugin.settings.dateFormat)
              .onChange(async (value) => {
                this.plugin.settings.dateFormat = value;
                await this.plugin.saveSettings();
              })
          );

          new Setting(containerEl)
          .setName("Nombre del Usuario")
          .setDesc("Nombre del suscriptor")
          .addText((text) =>
            text
              .setPlaceholder("Apellidos, Nombre")
              .setValue(this.plugin.settings.nombre)
              .onChange(async (value) => {
                this.plugin.settings.nombre = value;
                await this.plugin.saveSettings();
              })
          );
      }
    }



// Del ejemplo de VIEWS
export const VIEW_TYPE_EXAMPLE = "example-view";

export class ExampleView extends ItemView {
  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType() {
    return VIEW_TYPE_EXAMPLE;
  }

  getDisplayText() {
    return "Vista de ejemplo";
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    container.createEl("h4", { text: "Vista de ejemplo" });
  }

  async onClose() {
    // Nada que limpiar.
  }
}
 
    