  import { Plugin } from 'obsidian';
  import { PluginMainSettingsTab } from './settingsTab';
  import { ModuloBase } from "./modules/moduloBase/index";
  import {activateModuloBusquedaAvanzada} from "./modules/M_busquedaAvanzada/activadores"
  import { StatusBarExtension } from "./modules/moduloAliasStatusBar/statusBar";
  import { ModuloRegistroTiempo } from "./modules/moduloRegistroTiempo/index";
  import type { PluginMainSettings } from './interfaces/pluginMainSettings';
  import { DEFAULT_SETTINGS } from './defaults/defaultSettings';
  import {registroTiempoAPI} from './modules/moduloRegistroTiempo/API/registroTiempoAPI'
  import { starterAPI} from './modules/noteLifecycleManager/API/starterAPI';
  import { addOnsAPI } from './modules/noteLifecycleManager/API/addOnsAPI';
  import { YAMLUpdaterAPI } from './modules/noteLifecycleManager/API/YAMLUpdaterAPI';
  import { menuHoyAPI} from './modules/noteLifecycleManager/API/menuDiarioAPI'
  import { VistaRegistroActivo } from './modules/moduloRegistroTiempo/views/vistaRTActivo';
  import { ModuloGTD } from './modules/moduloGTD';
  import { ingresarBandejaEntrada } from './modules/moduloGTD/inbox';
  import { subsistemasAPI } from './modules/noteLifecycleManager/API/subsistemasAPI';

export default class ManagementPlugin extends Plugin {
  settings: PluginMainSettings | undefined;
  // Declara una propiedad `settings` para almacenar la configuración del plugin.
  statusBarExtension: StatusBarExtension | null = null;
  moduloRegistroTiempo: ModuloRegistroTiempo | null = null;
  moduloBase: ModuloBase | null = null;
  moduloGTD : ModuloGTD | null = null;
  registeredCommandIdsRT: string[] = [];
  registeredCommandIdsMB: string[] = [];
  registeredCommandIdsGTD: string[] = [];
  ribbonButtonRT: ReturnType<Plugin['addRibbonIcon']> | null = null;
  app: any;
  registroTiempoAPI: registroTiempoAPI | undefined;
  starterAPI: starterAPI | undefined;
  addOnsAPI: addOnsAPI | undefined;
  menuHoyAPI: menuHoyAPI | undefined;
  subsistemasAPI: subsistemasAPI | undefined;
  newInbox : any;
  tp: any;
  // Declara una propiedad para mantener una instancia de `StatusBarExtension`.
  

    async onload() { 
        
        await this.loadSettings();
        this.tp = this.getTp();
        this.registerView(
          "vista-registro-activo", 
          (leaf) => new VistaRegistroActivo(leaf, this)
        );

        // cargar API registro Tiempo
        this.registroTiempoAPI = new registroTiempoAPI(this);
        this.starterAPI = new starterAPI(this);
        this.addOnsAPI = new addOnsAPI(this);
        this.YAMLUpdaterAPI = new YAMLUpdaterAPI(this);
        this.menuHoyAPI = new menuHoyAPI(this);
        this.subsistemasAPI = new subsistemasAPI(this);
        this.newInbox = ingresarBandejaEntrada.bind(this);

        // Añade la pestaña de configuración - 
        this.addSettingTab(new PluginMainSettingsTab(this));
        // Inicializa las instancias de los módulos
        this.statusBarExtension = new StatusBarExtension(this);
        this.moduloRegistroTiempo = new ModuloRegistroTiempo(this);
        this.moduloBase = new ModuloBase(this);
        this.moduloGTD = new ModuloGTD(this);
        this.applyConfiguration();
        // Aplica la configuración inicial basada en los ajustes cargados o predeterminados.
        console.log('Iniciando carga de plugin de Gestión Personal');
      
      }

      applyConfiguration() {
        // Modulo Base es el módulo sobre el que estoy haciendo pruebas de desarrollo.
        if (this.settings.moduloBase) {
          this.moduloBase?.activate(this);
      } else {
          this.moduloBase?.deactivate(this);
      }
        if (this.settings.moduloRegistroTiempo) {
            this.moduloRegistroTiempo?.activate(this);
        } else {
            this.moduloRegistroTiempo?.deactivate(this);
        }
         if (this.settings.moduloAliasStatusBar) {
          this.statusBarExtension?.activate();
          // Si la configuración para `moduloAliasStatusBar` es verdadera, activa el módulo.
        } else {
          this.statusBarExtension?.deactivate();
          // Si es falsa, desactiva el módulo.
        }
        if (this.settings.moduloGTD) {
          this.moduloGTD?.activate(this);
      } else {
          this.moduloGTD?.deactivate(this);
      }

    }
    
      async onunload() {
          // Código de limpieza aquí
          console.log('Descargando plugin Gestión Personal');
          return Promise.resolve();
      }

      async loadSettings() {
        // Método para cargar la configuración desde el almacenamiento de Obsidian.
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
        // Intenta cargar la configuración y mezcla los valores cargados con los predeterminados.
      }

      async saveSettings() {
        // Método para guardar la configuración actual en el almacenamiento de Obsidian.
        await this.saveData(this.settings);
        // Guarda la configuración actual.
        
        this.applyConfiguration();
        // Vuelve a aplicar la configuración para asegurarse de que los cambios recientes se reflejen inmediatamente.
      }

      getTp(){
          debugger;
          if (!this.app || !this.app.plugins.enabledPlugins.has('templater-obsidian')) {
              console.error('El plugin Templater no está habilitado.');
              return;
          }
          //  Forma de acceder al objeto tp normal que he usado desde DVJS cuando current Functions esta cargado.
          //const templaterPlugin = this.app.plugins.plugins['templater-obsidian'];
          //const tp = templaterPlugin.templater.current_functions_object;
          // -> version que falla si no esta arriba el plugin porque hace get del plugin directo. const templaterPlugin = this.app.plugins.getPlugin('templater-obsidian');    
          let tpGen = this.app.plugins.plugins["templater-obsidian"].templater;
          tpGen = tpGen.functions_generator.internal_functions.modules_array;
          let tp = {}
          // get an instance of modules
          tp.file = tpGen.find(m => m.name == "file");
          tp.system = tpGen.find(m => m.name == "system");

          if (!tp.system) {
            console.error("No se pudo acceder al objeto de funciones actuales de Templater.");
            return;
        }
          console.log('Instancia de tp cargada satisfactoriamente en Plugin');
          return tp;
        }
  }
