// src/modules/moduloTabTitle/TabTitleManager.ts
import { TFile, WorkspaceLeaf, MarkdownView } from 'obsidian';
import { CustomMarkdownView } from './views/CustomMarkdownView';
import { TabTitleSettings } from './interfaces/TabTitleSettings';
import { Logger } from './utils/logger';

export class TabTitleManager {
    private plugin: Plugin;
    private settings: TabTitleSettings;
    private originalViews: WeakMap<WorkspaceLeaf, typeof MarkdownView>;
    private customViews: Map<string, CustomMarkdownView>;

    constructor(plugin: Plugin, settings: TabTitleSettings) {
        this.plugin = plugin;
        this.settings = settings;
        this.originalViews = new WeakMap();
        this.customViews = new Map();
        Logger.info('TabTitleManager initialized');

        this.registerEvents();
    }

    private registerEvents() {
        // Observar la creación de nuevas vistas
        this.plugin.registerEvent(
            this.plugin.app.workspace.on('layout-change', () => {
                this.replaceAllViews();
            })
        );

        // Observar la apertura de archivos
        this.plugin.registerEvent(
            this.plugin.app.workspace.on('file-open', (file) => {
                if (file) {
                    this.handleFileOpen(file);
                }
            })
        );

        // Observar modificaciones de archivos
        this.plugin.registerEvent(
            this.plugin.app.vault.on('modify', (file) => {
                if (file instanceof TFile) {
                    this.handleFileModify(file);
                }
            })
        );
    }

    private async replaceAllViews() {
        const leaves = this.plugin.app.workspace.getLeavesOfType('markdown');
        for (const leaf of leaves) {
            await this.replaceView(leaf);
        }
    }

    private async replaceView(leaf: WorkspaceLeaf) {
        if (!(leaf.view instanceof MarkdownView)) {
            return;
        }

        // Si ya es una vista personalizada, no hacer nada
        if (leaf.view instanceof CustomMarkdownView) {
            return;
        }

        // Guardar la vista original
        this.originalViews.set(leaf, leaf.view.constructor as typeof MarkdownView);

        // Crear nueva vista personalizada
        const customView = new CustomMarkdownView(leaf);
        // @ts-ignore: Asignar propiedades necesarias
        customView.file = leaf.view.file;
        customView.extension = leaf.view.extension;
        customView.getMode = leaf.view.getMode;
        customView.getState = leaf.view.getState;
        customView.setState = leaf.view.setState;
        customView.getEphemeralState = leaf.view.getEphemeralState;
        customView.setEphemeralState = leaf.view.setEphemeralState;

        // Reemplazar la vista
        leaf.view = customView;
        this.customViews.set(leaf.id, customView);

        // Actualizar el título si hay un archivo
        if (customView.file) {
            await this.updateTitle(customView);
        }
    }

    private async handleFileOpen(file: TFile) {
        const leaf = this.plugin.app.workspace.getLeaf();
        await this.replaceView(leaf);
        await this.updateTitle(leaf.view as CustomMarkdownView);
    }

    private async handleFileModify(file: TFile) {
        const leaves = this.plugin.app.workspace.getLeavesOfType('markdown');
        for (const leaf of leaves) {
            if (leaf.view instanceof CustomMarkdownView && leaf.view.file?.path === file.path) {
                await this.updateTitle(leaf.view);
            }
        }
    }

    private async updateTitle(view: CustomMarkdownView) {
        if (!view.file) return;

        try {
            const title = await this.getPreferredTitle(view.file);
            if (title) {
                view.setCustomTitle(title);
                Logger.info(`Updated title for ${view.file.path} to: ${title}`);
            }
        } catch (error) {
            Logger.error(`Error updating title for ${view.file.path}:`, error);
        }
    }

    async getPreferredTitle(file: TFile): Promise<string | null> {
        try {
            const metadata = await this.waitForMetadata(file);
            Logger.debug(`Getting preferred title for ${file.path}`, { metadata });

            if (metadata?.aliases) {
                if (Array.isArray(metadata.aliases) && metadata.aliases.length > 0) {
                    return metadata.aliases[0];
                }
                if (typeof metadata.aliases === 'string') {
                    return metadata.aliases;
                }
            }

            return metadata?.titulo || file.basename;
        } catch (error) {
            Logger.error(`Error getting title for ${file.path}:`, error);
            return file.basename;
        }
    }

    private async waitForMetadata(file: TFile): Promise<any> {
        return new Promise((resolve) => {
            const maxAttempts = 10;
            let attempts = 0;

            const checkMetadata = () => {
                const cache = this.plugin.app.metadataCache.getFileCache(file);
                if (cache?.frontmatter || attempts >= maxAttempts) {
                    resolve(cache?.frontmatter || {});
                } else {
                    attempts++;
                    setTimeout(checkMetadata, 100);
                }
            };

            checkMetadata();
        });
    }

    restoreDefaultTitles() {
        Logger.info('Restoring default titles');
        try {
            const leaves = this.plugin.app.workspace.getLeavesOfType('markdown');
            for (const leaf of leaves) {
                if (leaf.view instanceof CustomMarkdownView) {
                    const OriginalView = this.originalViews.get(leaf);
                    if (OriginalView) {
                        const originalView = new OriginalView(leaf);
                        leaf.view = originalView;
                    }
                }
            }
            this.customViews.clear();
        } catch (error) {
            Logger.error('Error restoring default titles:', error);
        }
    }
}