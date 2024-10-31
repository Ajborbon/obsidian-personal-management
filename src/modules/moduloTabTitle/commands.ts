// src/modules/moduloTabTitle/commands.ts
import { Plugin } from 'obsidian';
import { TabTitleSettings } from './interfaces/TabTitleSettings';

export function registerCommands(plugin: Plugin, settings: TabTitleSettings) {
    plugin.addCommand({
        id: 'set-tab-title-alias',
        name: 'Mostrar alias en pestañas',
        callback: () => {
            settings.titleDisplayMode = 'alias';
            plugin.saveData(settings);
        }
    });

    plugin.addCommand({
        id: 'set-tab-title-title',
        name: 'Mostrar título en pestañas',
        callback: () => {
            settings.titleDisplayMode = 'title';
            plugin.saveData(settings);
        }
    });

    plugin.addCommand({
        id: 'set-tab-title-filename',
        name: 'Mostrar nombre de archivo en pestañas',
        callback: () => {
            settings.titleDisplayMode = 'filename';
            plugin.saveData(settings);
        }
    });
}