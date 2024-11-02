// src/modules/taskManager/index.ts

import { Plugin } from 'obsidian';
import { registerTaskManagerCommands, deactivateTaskManagerCommands } from './commands';

export class ModuloTaskManager {
    constructor(private plugin: Plugin) {}

    activate() {
        registerTaskManagerCommands(this.plugin);
    }

    deactivate() {
        deactivateTaskManagerCommands(this.plugin);
    }
}