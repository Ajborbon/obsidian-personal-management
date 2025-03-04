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



    async getPreferredTitleWithSource(file: TFile): Promise<{ displayTitle: string | null; source: string }> {
        try {
            const metadata = await this.waitForMetadata(file);
            
            // Verificar si tiene aliases
            if (metadata?.aliases) {
                // Caso especial: 3 o más aliases - mostrar aliases[2] / aliases[0]
                if (Array.isArray(metadata.aliases) && metadata.aliases.length >= 3) {
                    return { 
                        displayTitle: `${metadata.aliases[2]} / ${metadata.aliases[0]}`,
                        source: 'aliases-special'
                    };
                }
                // Comportamiento normal para menos de 3 aliases
                else if (Array.isArray(metadata.aliases) && metadata.aliases.length > 0) {
                    return { 
                        displayTitle: metadata.aliases[0],
                        source: 'aliases'
                    };
                }
                else if (typeof metadata.aliases === 'string') {
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


  // Método para aplicar scroll horizontal a un elemento de título de pestaña
  private applyHorizontalScrollToTab(tabElement: HTMLElement) {
    // Asegurar que solo aplicamos una vez
    if (tabElement.getAttribute('data-scroll-enabled') === 'true') return;
    
    // Almacenar estilos originales para restaurarlos al desactivar
    const originalStyles = {
        overflow: tabElement.style.overflow,
        textOverflow: tabElement.style.textOverflow,
        whiteSpace: tabElement.style.whiteSpace,
        maxWidth: tabElement.style.maxWidth,
        transition: tabElement.style.transition
    };
    
    // Establecer estilos base
    tabElement.style.overflow = "hidden";
    tabElement.style.textOverflow = "ellipsis";
    tabElement.style.whiteSpace = "nowrap";
    tabElement.style.maxWidth = "150px"; // Ajustable según necesidades
    tabElement.style.transition = "max-width 0.3s ease-in-out";
    
    // Crear handler para mouseenter
    const mouseEnterHandler = () => {
        const fullWidth = tabElement.scrollWidth;
        tabElement.style.overflow = "auto";
        tabElement.style.textOverflow = "clip";
        tabElement.style.maxWidth = Math.min(fullWidth, 300) + "px"; // Limitar expansión
    };
    
    // Crear handler para mouseleave
    const mouseLeaveHandler = () => {
        tabElement.style.overflow = "hidden";
        tabElement.style.textOverflow = "ellipsis";
        tabElement.style.maxWidth = "150px";
        setTimeout(() => { tabElement.scrollLeft = 0; }, 300); // Retrasar para animación
    };
    
    // Asignar event listeners
    tabElement.addEventListener("mouseenter", mouseEnterHandler);
    tabElement.addEventListener("mouseleave", mouseLeaveHandler);
    
    // Marcar elemento como configurado
    tabElement.setAttribute('data-scroll-enabled', 'true');
    
    // Almacenar referencias para limpieza
    if (!this.scrollEnabledElements) this.scrollEnabledElements = new Map();
    this.scrollEnabledElements.set(tabElement, {
        mouseEnterHandler,
        mouseLeaveHandler,
        originalStyles
    });
}

// Método para limpiar el scroll de un elemento
private removeHorizontalScrollFromTab(tabElement: HTMLElement) {
    if (!tabElement || !this.scrollEnabledElements) return;
    
    const handlers = this.scrollEnabledElements.get(tabElement);
    if (!handlers) return;
    
    // Eliminar event listeners
    tabElement.removeEventListener("mouseenter", handlers.mouseEnterHandler);
    tabElement.removeEventListener("mouseleave", handlers.mouseLeaveHandler);
    
    // Restaurar estilos originales
    Object.assign(tabElement.style, handlers.originalStyles);
    
    // Limpiar marca
    tabElement.removeAttribute('data-scroll-enabled');
    
    // Eliminar de la colección
    this.scrollEnabledElements.delete(tabElement);
}

// Sobrescritura del método updateTab
async updateTab(leaf: WorkspaceLeaf) {
    if (!(leaf.view instanceof MarkdownView) || !leaf.view.file) return;

    const { displayTitle, source } = await this.getPreferredTitleWithSource(leaf.view.file);
    if (displayTitle) {
        // Determinar el formato del título según la lógica existente
        let formattedTitle;
        if (source === 'aliases-special' || source === 'aliases-two') {
            formattedTitle = displayTitle;
        } else {
            formattedTitle = `${leaf.view.file.basename} / ${displayTitle}`;
        }
        
        // Establecer el título
        leaf.view.titleEl.innerText = formattedTitle;
        
        if (leaf.tabHeaderInnerTitleEl) {
            leaf.tabHeaderInnerTitleEl.innerText = formattedTitle;
            // Aplicar comportamiento de scroll horizontal
            this.applyHorizontalScrollToTab(leaf.tabHeaderInnerTitleEl);
        }
    }
}

// Método para limpiar recursos al desactivar
cleanupScrollHandlers() {
    if (!this.scrollEnabledElements) return;
    
    this.scrollEnabledElements.forEach((handlers, element) => {
        this.removeHorizontalScrollFromTab(element);
    });
    
    this.scrollEnabledElements.clear();
}

// Sobrescribir restoreDefaultTitles para incluir la limpieza
restoreDefaultTitles() {
    // Limpiar manejadores de scroll
    this.cleanupScrollHandlers();
    
    // Restaurar títulos como antes
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