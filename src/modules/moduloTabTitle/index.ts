// src/modules/moduloTabTitle/index.ts

import { Plugin, TFile } from 'obsidian';
import { registerCommands } from './commands';
import { TabTitleManager } from './TabTitleManager';
import { TabTitleSettings } from './interfaces/TabTitleSettings';
import { DEFAULT_TAB_SETTINGS } from './defaults/defaultSettings';
import { Logger } from './utils/logger';

export class ModuloTabTitle {
    private plugin: Plugin;
    private settings: TabTitleSettings;
    private tabManager: TabTitleManager | null = null;
    
    constructor(plugin: Plugin) {
        this.plugin = plugin;
        this.settings = DEFAULT_TAB_SETTINGS;
    }

    async activate() {
        try {
            // Cargar configuración
            await this.loadSettings();
            
            // Asegurarse de que titleDisplayMode está configurado
            if (!this.settings.titleDisplayMode) {
                this.settings.titleDisplayMode = 'alias';
                await this.saveSettings();
            }

            // Inicializar el manejador de títulos
            this.tabManager = new TabTitleManager(this.plugin, this.settings);
            
            // Registrar los comandos
            registerCommands(this.plugin, this.settings);
            
            // Registrar eventos para cambios de layout
            this.plugin.registerEvent(
                this.plugin.app.workspace.on('layout-change', () => {
                    try {
                        this.tabManager?.updateAllTabs();
                    } catch (error) {
                        Logger.error('Error updating tabs on layout change:', error);
                    }
                })
            );

            // Registrar evento para cuando se abra un archivo
            this.plugin.registerEvent(
                this.plugin.app.workspace.on('file-open', (file: TFile | null) => {
                    try {
                        if (file && this.tabManager) {
                            this.tabManager.updateTabForFile(file);
                        }
                    } catch (error) {
                        Logger.error('Error updating tab on file open:', error);
                    }
                })
            );

            // Actualización inicial después de un breve retraso
            setTimeout(() => {
                this.tabManager?.updateAllTabs();
            }, 1000);

        } catch (error) {
            Logger.error('Error activating TabTitle module:', error);
        }
    }

    deactivate() {
        try {
            if (this.tabManager) {
                this.tabManager.restoreDefaultTitles();
                this.tabManager = null;
            }
        } catch (error) {
            Logger.error('Error deactivating TabTitle module:', error);
        }
    }

    private async loadSettings() {
        try {
            const loadedData = await this.plugin.loadData();
            this.settings = Object.assign({}, DEFAULT_TAB_SETTINGS, loadedData);
        } catch (error) {
            Logger.error('Error loading TabTitle settings:', error);
            this.settings = DEFAULT_TAB_SETTINGS;
        }
    }

    private async saveSettings() {
        try {
            await this.plugin.saveData(this.settings);
        } catch (error) {
            Logger.error('Error saving TabTitle settings:', error);
        }
    }
}