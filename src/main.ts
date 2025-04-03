/* fileLocation: src/main.ts */
import { Plugin } from "obsidian";
import { PluginMainSettingsTab } from "./settingsTab";
import { ModuloBase } from "./modules/moduloBase/index";
import { activateModuloBusquedaAvanzada } from "./modules/M_busquedaAvanzada/activadores";
import { StatusBarExtension } from "./modules/moduloAliasStatusBar/statusBar";
import { ModuloRegistroTiempo } from "./modules/moduloRegistroTiempo/index";
import type { PluginMainSettings } from "./interfaces/pluginMainSettings";
import { DEFAULT_SETTINGS } from "./defaults/defaultSettings";
import { registroTiempoAPI } from "./modules/moduloRegistroTiempo/API/registroTiempoAPI";
import { starterAPI } from "./modules/noteLifecycleManager/API/starterAPI";
import { addOnsAPI } from "./modules/noteLifecycleManager/API/addOnsAPI";
import { YAMLUpdaterAPI } from "./modules/noteLifecycleManager/API/YAMLUpdaterAPI";
import { menuHoyAPI } from "./modules/noteLifecycleManager/API/menuDiarioAPI";
import { menuSemanalAPI } from "./modules/noteLifecycleManager/API/menuSemanalAPI";
import { VistaRegistroActivo } from "./modules/moduloRegistroTiempo/views/vistaRTActivo";
import { ModuloGTD } from "./modules/moduloGTD";
//import { ModuloTerceros } from './modules/modulo_Terceros';
import { ingresarBandejaEntrada } from "./modules/moduloGTD/inbox";
import { subsistemasAPI } from "./modules/noteLifecycleManager/API/subsistemasAPI";
import { VistaResumenSemanal } from "./modules/noteLifecycleManager/views/vistaResumenSemanal";
import { VistaRegistroDiario } from "./modules/noteLifecycleManager/views/vistaRegistroDiario";
import GPThora from "./modules/GPThora/GPThora";
import { librosAPI } from "./modules/moduloLibros/librosAPI";
import { updateSesionLectura } from "./modules/moduloRegistroTiempo/API/updateSesionLectura";
import { TareasAPI } from "./modules/taskManager/api/tareasAPI";
import { ModuloTabTitle } from './modules/moduloTabTitle';
import { ModuloTaskManager } from './modules/taskManager';
import { ModuloDataviewQueries } from './modules/dataviewQueries';
import { TaskExecutionNavigatorModule } from './modules/taskExecutionNavigator';
import { EntregableFieldHandler } from "./modules/noteLifecycleManager/fieldHandlers/FH Subsistemas/EntregableFieldHandler";
import { SeleccionMultipleModal } from "./modules/modales/seleccionMultipleModal";
import { DatePickerModal } from "./modules/modales/datePickerModal";
import { SpinnerModal } from "./modules/modales/spinnerModal";
import { PedidosClienteModal } from "./modules/modales/pedidosClienteModal";
import { Notice } from "obsidian"; // Import Notice for feedback
// Imports for ModuloGTDv2
import { parseVault } from "./modules/moduloGTDv2/parser";
import { buildHierarchy } from "./modules/moduloGTDv2/hierarchyBuilder";
import { classifyTasks } from "./modules/moduloGTDv2/gtdProcessor";
import { generateGtdViewHtml } from "./modules/moduloGTDv2/htmlGenerator";
import type { Task } from './modules/moduloGTDv2/model'; // Import type
import { GtdV2View, GTD_V2_VIEW_TYPE } from "./modules/moduloGTDv2/view"; // Import the new view

export default class ManagementPlugin extends Plugin {
  settings: PluginMainSettings | undefined; // Reverted to allow undefined initially
  // Declara una propiedad `settings` para almacenar la configuración del plugin.
  statusBarExtension: StatusBarExtension | null = null;
  moduloRegistroTiempo: ModuloRegistroTiempo | null = null;
  moduloBase: ModuloBase | null = null;
  moduloGTD: ModuloGTD | null = null;
  //moduloTerceros: ModuloTerceros | null = null;
  registeredCommandIdsRT: string[] = [];
  registeredCommandIdsMB: string[] = [];
  registeredCommandIdsGTD: string[] = [];
  registeredCommandIds_Terceros: string[] = [];
  ribbonButtonRT: ReturnType<Plugin["addRibbonIcon"]> | null = null;
  app: any;
  registroTiempoAPI: registroTiempoAPI | undefined;
  starterAPI: starterAPI | undefined;
  addOnsAPI: addOnsAPI | undefined;
  YAMLUpdaterAPI: YAMLUpdaterAPI | undefined; // Declare missing property
  updateSesionLectura: updateSesionLectura | undefined; // Declare missing property
  menuHoyAPI: menuHoyAPI | undefined;
  menuSemanalAPI: menuSemanalAPI | undefined;
  subsistemasAPI: subsistemasAPI | undefined;
  librosAPI: librosAPI | undefined;
  newInbox: any;
  tp: any;
  tareasAPI: TareasAPI | undefined;
  moduloTabTitle: ModuloTabTitle | null = null;
  moduloTaskManager: ModuloTaskManager | null = null;
  moduloDataviewQueries: ModuloDataviewQueries | null = null;
  taskExecutionNavigatorModule: TaskExecutionNavigatorModule | null = null;
  // Declara una propiedad para mantener una instancia de `StatusBarExtension`.

  async onload() {
    // Ensure settings are loaded before proceeding
    await this.loadSettings();
    // Ensure settings is not undefined after loading
    if (!this.settings) {
        console.error("Failed to load plugin settings.");
        // Optionally, load default settings again or handle the error appropriately
        this.settings = DEFAULT_SETTINGS;
    }

    this.tp = this.getTp();

    this.registerView(
      "vista-registro-activo",
      (leaf) => new VistaRegistroActivo(leaf, this) as any // Cast to any
    );
    this.registerView(
      "vista-resumen-semanal",
      (leaf) => new VistaResumenSemanal(leaf, this) as any // Cast to any
    );
    this.registerView(
      "vista-registro-diario",
      (leaf) => new VistaRegistroDiario(leaf, this) as any // Cast to any
    );
    // Register GTD v2 View
    this.registerView(
        GTD_V2_VIEW_TYPE,
        (leaf) => new GtdV2View(leaf, this)
    );


    // cargar API registro Tiempo
    this.registroTiempoAPI = new registroTiempoAPI(this as any);
    this.starterAPI = new starterAPI(this as any);
    this.addOnsAPI = new addOnsAPI(this as any);
    this.YAMLUpdaterAPI = new YAMLUpdaterAPI(this as any);
    this.updateSesionLectura = new updateSesionLectura(this as any);
    this.menuHoyAPI = new menuHoyAPI(this as any);
    this.menuSemanalAPI = new menuSemanalAPI(this as any);
    this.subsistemasAPI = new subsistemasAPI(this as any);
    this.librosAPI = new librosAPI(this as any);
    this.newInbox = ingresarBandejaEntrada.bind(this as any);
    this.taskExecutionNavigatorModule = new TaskExecutionNavigatorModule(this as any);
    // Añade la pestaña de configuración -
    this.addSettingTab(new PluginMainSettingsTab(this as any));
    // Inicializa las instancias de los módulos
    this.statusBarExtension = new StatusBarExtension(this as any);
    this.moduloRegistroTiempo = new ModuloRegistroTiempo(this as any);
    this.moduloBase = new ModuloBase(this as any);
    //this.moduloTerceros = new ModuloTerceros(this);
    this.moduloGTD = new ModuloGTD(this as any);
    //this.getTareasVencidasAbiertas = () => getTareasVencidasAbiertas(this);
    //this.mostrarTareasVencidas = () => mostrarTareasVencidas(this);
    this.tareasAPI = new TareasAPI(this as any);
    this.moduloTabTitle = new ModuloTabTitle(this as any);
    this.moduloTaskManager = new ModuloTaskManager(this as any);
    this.moduloDataviewQueries = new ModuloDataviewQueries(this as any);
    /*
    (this.app as any).gpManagement = {
      getTareasVencidasAbiertas: () => this.tareasAPI.getTareasVencidasAbiertas(),
      mostrarTareasVencidas: () => this.tareasAPI.mostrarTareasVencidas()
    };
    */
    this.applyConfiguration();
    // Aplica la configuración inicial basada en los ajustes cargados o predeterminados.
    console.log("Iniciando carga de plugin de Gestión Personal");

    this.registerGPThora();
    // Activación de moduloTagTitle
    if (this.settings!.moduloTabTitle) { // Added non-null assertion
      this.moduloTabTitle?.activate();
      } else {
          this.moduloTabTitle?.deactivate();
      }
      if (this.settings!.moduloTaskManager) { // Added non-null assertion
        this.moduloTaskManager.activate();
    }
    if (this.settings!.moduloDataviewQueries) { // Added non-null assertion
      console.log('ManagementPlugin: Aplicando configuración DataviewQueries...');
      try {
          if (!this.moduloDataviewQueries!.isActive()) { // Added non-null assertion
              this.moduloDataviewQueries!.activate(); // Added non-null assertion
          }
      } catch (error) {
          console.error('Error en applyConfiguration:', error);
      }
    } else {
      this.moduloDataviewQueries?.deactivate();
    }
        // Activar el módulo si está configurado en settings (opcional)
        if (this.settings!.taskExecutionNavigatorModule) { // Added non-null assertion
          this.taskExecutionNavigatorModule?.activate();
      }

    // --- Add Command for ModuloGTDv2 ---
    this.addCommand({
        id: 'gtd-v2-show-hierarchical-view',
        name: 'GTD v2: Mostrar Vista Jerárquica',
        checkCallback: (checking: boolean) => {
            // Check if settings are loaded first
            if (!this.settings) {
                return false; // Settings not loaded yet
            }
            // Then check if the module is enabled
            if (!this.settings.moduloGTDv2) {
                return false; // Module disabled
            }

            // If we reach here, settings are loaded and the module is enabled
            if (!checking) {
                // Execute the command logic
                this.showGtdHierarchicalView();
            }
            return true; // Command is available
        },
    });
    // --- End ModuloGTDv2 Command ---


  }

  // --- Method to execute GTD v2 view logic ---
  async showGtdHierarchicalView() {
    // Add check for settings at the beginning of the method
    if (!this.settings || !this.settings.moduloGTDv2) {
        new Notice("Modulo GTD v2 no está habilitado en la configuración.");
        return;
    }

    new Notice("Generando vista GTD v2...", 5000); // Show loading notice

    try {
        const activeFile = this.app.workspace.getActiveFile();
        const activeNotePath = activeFile?.path ?? null;
        const vaultName = this.app.vault.getName();

        console.log("[GTDv2 Main] Starting process...");

        // 1. Parse Vault
        const parsedNotes = await parseVault(this.app);
        if (!parsedNotes || parsedNotes.length === 0) {
            new Notice("No se encontraron notas para procesar.");
            console.log("[GTDv2 Main] No notes found or parsed.");
            return;
        }

        // 2. Build Hierarchy
        const model = buildHierarchy(parsedNotes);
        if (!model || model.items.size === 0) {
            new Notice("Error al construir la jerarquía.");
            console.log("[GTDv2 Main] Hierarchy model is empty.");
            return;
        }

        // 3. Create Task Map for Dependency Checking
        const taskMap = new Map<string, Task>();
        model.allTasks.forEach(task => {
            if (task.id) {
                taskMap.set(task.id, task);
            }
        });

        // 4. Collect Tasks Relevant to Active Context
        let relevantTasks: Task[] = [];
        if (activeNotePath && model.items.has(activeNotePath)) {
            const activeItem = model.items.get(activeNotePath)!;
            const taskCollector = (item: import("./modules/moduloGTDv2/model").HierarchicalItem) => {
                relevantTasks.push(...item.tasks);
                item.children.forEach(taskCollector);
            };
            taskCollector(activeItem);
            console.log(`[GTDv2 Main] Found ${relevantTasks.length} tasks relevant to active context: ${activeNotePath}`);
        } else {
            // If no active context or note not found, maybe show all tasks? Or show empty lists?
            // For now, let's default to showing all tasks in the list view if context is unclear.
            console.log("[GTDv2 Main] Active context not found or invalid, showing all tasks in list view.");
            relevantTasks = model.allTasks;
        }


        // 5. Classify ONLY the Relevant Tasks
        const classifiedTasks = classifyTasks(relevantTasks, taskMap); // Pass only relevant tasks

        // 6. Generate HTML (Generator already receives classified tasks)
        const htmlContent = generateGtdViewHtml(model, classifiedTasks, activeNotePath, vaultName);

        // 7. Open HTML in a new Obsidian Leaf (Tab)
        await this.activateGtdView(htmlContent);

        console.log("[GTDv2 Main] View activated in Obsidian leaf.");
        new Notice("Vista GTD v2 generada!");

    } catch (error) {
        console.error("[GTDv2 Main] Error generating or activating view:", error);
        new Notice("Error al generar la vista GTD v2. Revisa la consola (Ctrl+Shift+I).");
    }
  }

  // Helper method to activate the GTD v2 view
  async activateGtdView(htmlContent: string) {
    // Detach existing leaves of this type to ensure only one instance runs
    this.app.workspace.detachLeavesOfType(GTD_V2_VIEW_TYPE);

    // Get a new leaf, splitting vertically if possible
    const newLeaf = this.app.workspace.getLeaf('split', 'vertical');

    // Set the view state, passing the HTML content
    await newLeaf.setViewState({
      type: GTD_V2_VIEW_TYPE,
      active: true,
      state: { htmlContent: htmlContent } // Pass HTML content in state
    });

    // Reveal the leaf to make sure it's visible
    this.app.workspace.revealLeaf(newLeaf);
  }
  // --- End GTD v2 Method ---


  registerGPThora() {
    const gptHora = new GPThora(this.app); // Crear una instancia de GPThora
    gptHora.onload();
  }

  applyConfiguration() {
    // Modulo Base es el módulo sobre el que estoy haciendo pruebas de desarrollo.
    if (this.settings!.moduloBase) { // Added non-null assertion
      this.moduloBase?.activate(); // Removed 'this' argument
    } else {
      this.moduloBase?.deactivate(); // Removed 'this' argument
    }
    if (this.settings!.moduloRegistroTiempo) { // Added non-null assertion
      this.moduloRegistroTiempo?.activate(); // Removed 'this' argument
    } else {
      this.moduloRegistroTiempo?.deactivate(); // Removed 'this' argument
    }
    if (this.settings!.moduloAliasStatusBar) { // Added non-null assertion
      this.statusBarExtension?.activate();
      // Si la configuración para `moduloAliasStatusBar` es verdadera, activa el módulo.
    } else {
      this.statusBarExtension?.deactivate();
      // Si es falsa, desactiva el módulo.
    }
    if (this.settings!.moduloGTD) { // Added non-null assertion
      this.moduloGTD?.activate(); // Removed 'this' argument
    } else {
      this.moduloGTD?.deactivate(); // Removed 'this' argument
    }
    if (this.settings!.moduloTaskManager) { // Added non-null assertion
      this.moduloTaskManager?.activate();
  } else {
      this.moduloTaskManager?.deactivate();
  }
 
  if (this.settings!.moduloDataviewQueries) { // Added non-null assertion
        console.log('Aplicando configuración: Activando DataviewQueries');
        this.moduloDataviewQueries?.activate();
    } else {
        console.log('Aplicando configuración: Desactivando DataviewQueries');
        this.moduloDataviewQueries?.deactivate();
    }

    if (this.settings!.taskExecutionNavigatorModule) { // Added non-null assertion
      this.taskExecutionNavigatorModule?.activate();
  } else {
      this.taskExecutionNavigatorModule?.deactivate();
  }

    //this.moduloTerceros?.activate(this);
  }

  async onunload() {
    // Código de limpieza aquí
    console.log("Descargando plugin Gestión Personal");
    if (this.moduloDataviewQueries) {
      this.moduloDataviewQueries.deactivate();
  }

      if (this.taskExecutionNavigatorModule) {
        this.taskExecutionNavigatorModule.deactivate();
    }
    delete (this.app as any).gpManagement;
    return Promise.resolve();
  }

  async loadSettings() {
    // Load settings and merge with defaults
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }


  async saveSettings() {
    // Método para guardar la configuración actual en el almacenamiento de Obsidian.
    await this.saveData(this.settings);
    // Guarda la configuración actual.

    this.applyConfiguration();
    // Vuelve a aplicar la configuración para asegurarse de que los cambios recientes se reflejen inmediatamente.
  }

  getTp() {
    if (
      !this.app ||
      !this.app.plugins.enabledPlugins.has("templater-obsidian")
    ) {
      console.error("El plugin Templater no está habilitado.");
      return;
    }
    //  Forma de acceder al objeto tp normal que he usado desde DVJS cuando current Functions esta cargado.
    //const templaterPlugin = this.app.plugins.plugins['templater-obsidian'];
    //const tp = templaterPlugin.templater.current_functions_object;
    // -> version que falla si no esta arriba el plugin porque hace get del plugin directo. const templaterPlugin = this.app.plugins.getPlugin('templater-obsidian');
    let tpGen = this.app.plugins.plugins["templater-obsidian"].templater;
    tpGen = tpGen.functions_generator.internal_functions.modules_array;
    let tp: any = {}; // Use 'any' type for tp
    // get an instance of modules
    tp.file = tpGen.find((m: any) => m.name == "file"); // Add type for m
    tp.system = tpGen.find((m: any) => m.name == "system"); // Add type for m

    if (!tp.system) {
      console.error(
        "No se pudo acceder al objeto de funciones actuales de Templater."
      );
      return;
    }
    console.log("Instancia de tp cargada satisfactoriamente en Plugin");
    return tp;
  }
}
