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
  import { YAMLUpdaterAPI } from './modules/noteLifecycleManager/API/YAMLUpdaterAPI';



export default class ManagementPlugin extends Plugin {
  settings: PluginMainSettings | undefined;
  // Declara una propiedad `settings` para almacenar la configuración del plugin.
  statusBarExtension: StatusBarExtension | null = null;
  moduloRegistroTiempo: ModuloRegistroTiempo | null = null;
  moduloBase: ModuloBase | null = null;
  registeredCommandIdsRT: string[] = [];
  registeredCommandIdsMB: string[] = [];
  ribbonButtonRT: ReturnType<Plugin['addRibbonIcon']> | null = null;
  app: any;
  registroTiempoAPI: registroTiempoAPI | undefined;
  starterAPI: starterAPI | undefined;
  // Declara una propiedad para mantener una instancia de `StatusBarExtension`.
  

    async onload() { 
        
        await this.loadSettings();
        // cargar API registro Tiempo
        this.registroTiempoAPI = new registroTiempoAPI(this);
        this.starterAPI = new starterAPI(this);
        this.YAMLUpdaterAPI = new YAMLUpdaterAPI(this);
        // Añade la pestaña de configuración - 
        this.addSettingTab(new PluginMainSettingsTab(this));
        // Inicializa las instancias de los módulos
        this.statusBarExtension = new StatusBarExtension(this);
        this.moduloRegistroTiempo = new ModuloRegistroTiempo(this);
        this.moduloBase = new ModuloBase(this);
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
  }
