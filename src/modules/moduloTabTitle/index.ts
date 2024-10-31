// src/modules/moduloTabTitle/index.ts
import { Plugin, TFile } from 'obsidian';
import { registerCommands } from './commands';
import { TabTitleManager } from './TabTitleManager';
import { TabTitleSettings } from './interfaces/TabTitleSettings';
import { DEFAULT_TAB_SETTINGS } from './defaults/defaultSettings';

export class ModuloTabTitle {
    private plugin: Plugin;
    private settings: TabTitleSettings;
    private tabManager: TabTitleManager;
    
    constructor(plugin: Plugin) {
        this.plugin = plugin;
        this.settings = DEFAULT_TAB_SETTINGS;
    }

    async activate() {
        try {
            // Cargar configuración
            await this.loadSettings();
            
            // Asegurarse de que titleDisplayMode está configurado como 'alias'
            if (!this.settings.titleDisplayMode) {
                this.settings.titleDisplayMode = 'alias';
                await this.plugin.saveData(this.settings);
            }

            // Inicializar el manejador de títulos
            this.tabManager = new TabTitleManager(this.plugin, this.settings);

            // Forzar una actualización inicial
            setTimeout(() => {
                this.tabManager.updateAllTabs();
            }, 1000); // Esperar 1 segundo después de la activación

            
            // Registrar los comandos
            registerCommands(this.plugin, this.settings);
            
            // Registrar eventos para las pestañas con manejo de errores
            this.plugin.registerEvent(
                this.plugin.app.workspace.on('layout-change', () => {
                    try {
                        this.tabManager.updateAllTabs();
                    } catch (error) {
                        console.error('Error updating tabs on layout change:', error);
                    }
                })
            );

            // Registrar evento para cuando se abra un archivo
            this.plugin.registerEvent(
                this.plugin.app.workspace.on('file-open', (file: TFile | null) => {
                    try {
                        if (file) {
                            this.tabManager.updateTabForFile(file);
                        }
                    } catch (error) {
                        console.error('Error updating tab on file open:', error);
                    }
                })
            );

        } catch (error) {
            console.error('Error activating TabTitle module:', error);
        }
    }

    deactivate() {
        try {
            if (this.tabManager) {
                this.tabManager.restoreDefaultTitles();
            }
        } catch (error) {
            console.error('Error deactivating TabTitle module:', error);
        }
    }

    private async loadSettings() {
        try {
            this.settings = Object.assign(
                {},
                DEFAULT_TAB_SETTINGS,
                await this.plugin.loadData()
            );
        } catch (error) {
            console.error('Error loading TabTitle settings:', error);
            this.settings = DEFAULT_TAB_SETTINGS;
        }
    }
}