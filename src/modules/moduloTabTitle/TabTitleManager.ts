// src/modules/moduloTabTitle/TabTitleManager.ts
import { TFile, WorkspaceLeaf, MarkdownView } from 'obsidian';
import { CustomMarkdownView } from './views/CustomMarkdownView';
import { TabTitleSettings } from './interfaces/TabTitleSettings';
import { Logger } from './utils/logger';

export class TabTitleManager {
    private plugin: Plugin;
    private settings: TabTitleSettings;
    private customViews: Map<string, CustomMarkdownView>;

    constructor(plugin: Plugin, settings: TabTitleSettings) {
        this.plugin = plugin;
        this.settings = settings;
        this.customViews = new Map();
        Logger.info('TabTitleManager initialized');
    }

    updateAllTabs() {
        const leaves = this.plugin.app.workspace.getLeavesOfType('markdown');
        for (const leaf of leaves) {
            if (leaf.view instanceof MarkdownView) {
                this.updateTab(leaf);
            }
        }
    }

    async updateTabForFile(file: TFile) {
        const leaves = this.plugin.app.workspace.getLeavesOfType('markdown');
        for (const leaf of leaves) {
            if (leaf.view instanceof MarkdownView && leaf.view.file?.path === file.path) {
                await this.updateTab(leaf);
            }
        }
    }

    private async updateTab(leaf: WorkspaceLeaf) {
        if (!(leaf.view instanceof MarkdownView) || !leaf.view.file) return;

        const { displayTitle, source } = await this.getPreferredTitleWithSource(leaf.view.file);
        if (displayTitle) {
            const formattedTitle = `${leaf.view.file.basename} / ${displayTitle}`;
            leaf.view.titleEl.innerText = formattedTitle;
            if (leaf.tabHeaderInnerTitleEl) {
                leaf.tabHeaderInnerTitleEl.innerText = formattedTitle;
            }
            Logger.debug(`Updated tab title to: ${formattedTitle} (source: ${source})`);
        }
    }

    async getPreferredTitleWithSource(file: TFile): Promise<{ displayTitle: string | null; source: string }> {
        try {
            const metadata = await this.waitForMetadata(file);
            
            // Primero intenta obtener el primer alias
            if (metadata?.aliases) {
                if (Array.isArray(metadata.aliases) && metadata.aliases.length > 0) {
                    return { 
                        displayTitle: metadata.aliases[0],
                        source: 'aliases'
                    };
                }
                if (typeof metadata.aliases === 'string') {
                    return { 
                        displayTitle: metadata.aliases,
                        source: 'aliases'
                    };
                }
            }
            
            // Si no hay alias, intenta obtener el título
            if (metadata?.titulo) {
                return { 
                    displayTitle: metadata.titulo,
                    source: 'titulo'
                };
            }
            
            // Si no hay alias ni título, usa solo el nombre del archivo
            return { 
                displayTitle: null,
                source: 'basename'
            };
        } catch (error) {
            Logger.error(`Error getting title for ${file.path}:`, error);
            return { 
                displayTitle: null,
                source: 'error'
            };
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
        const leaves = this.plugin.app.workspace.getLeavesOfType('markdown');
        for (const leaf of leaves) {
            if (leaf.view instanceof MarkdownView && leaf.view.file) {
                leaf.view.titleEl.innerText = leaf.view.file.basename;
                if (leaf.tabHeaderInnerTitleEl) {
                    leaf.tabHeaderInnerTitleEl.innerText = leaf.view.file.basename;
                }
            }
        }
    }
}