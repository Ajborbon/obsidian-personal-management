import { ItemView, WorkspaceLeaf, Notice } from "obsidian";
import type ManagementPlugin from "../../main"; // Adjust path if needed
import { generateGtdViewHtml } from "./htmlGenerator"; // Import the generator
import type { GtdDataModel, ClassifiedTasks } from './model';

export const GTD_V2_VIEW_TYPE = "gtd-v2-view";

export class GtdV2View extends ItemView {
    plugin: ManagementPlugin;
    htmlContent: string | null = null; // To store the generated HTML

    constructor(leaf: WorkspaceLeaf, plugin: ManagementPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType() {
        return GTD_V2_VIEW_TYPE;
    }

    getDisplayText() {
        return "GTD v2 View";
    }

    // Receives the state containing the HTML content when the view is opened
    async setState(state: any, result: any): Promise<void> {
        this.htmlContent = state?.htmlContent ?? '<p>Error: No content provided.</p>';
        await super.setState(state, result);
        // Debounce display/attach listeners slightly to ensure DOM is ready
        setTimeout(() => this.display(), 50);
        return Promise.resolve();
      }

    async onOpen() {
        console.log("[GTDv2 View] Opening view.");
        // Display might be called via setState, ensure it runs at least once
        if (!this.htmlContent) {
            this.display();
        }
    }

    display() {
        const container = this.containerEl.children[1]; // Get the content container
        if (!container) {
            console.error("[GTDv2 View] Container element not found.");
            return;
        }
        container.empty(); // Clear previous content

        if (this.htmlContent) {
            // Directly set the innerHTML.
            container.innerHTML = this.htmlContent;
            this.attachEventListeners(container); // Re-attach listeners
        } else {
            container.createEl("p", { text: "Loading GTD v2 view or no content available..." });
        }
    }

    attachEventListeners(container: Element) {
        console.log("[GTDv2 View] Attaching event listeners.");

        // Toggle Children Visibility (Attach listener to header, find icon within)
        container.querySelectorAll('.proyectos-area-header').forEach(header => {
            // Check if this header actually has a toggle icon (meaning it has content)
            const toggleIcon = header.querySelector('.toggle-icon') as HTMLElement | null;
            if (toggleIcon) {
                header.addEventListener('click', (event: Event) => {
                    // Prevent toggling if the click was on the link or lineage button
                    const target = event.target as HTMLElement;
                    if (target.tagName === 'A' || target.classList.contains('show-lineage')) return;

                    event.stopPropagation();
                    const toggleId = header.getAttribute('data-toggle-id');
                    if (toggleId) {
                        const contentElement = container.querySelector(`#content-${toggleId}`) as HTMLElement | null;
                        if (contentElement) {
                            const isVisible = contentElement.style.display !== 'none';
                            contentElement.style.display = isVisible ? 'none' : 'block';
                            // Update the toggle icon found earlier
                            toggleIcon.textContent = isVisible ? '▶' : '▼';
                        }
                    }
                });
            }
        });

        // Toggle Lineage Visibility
        container.querySelectorAll('.show-lineage').forEach(button => {
            button.addEventListener('click', (event) => {
                event.stopPropagation();
                const listItem = (event.target as HTMLElement).closest('.proyectos-item');
                const lineageDiv = listItem?.querySelector('.item-lineage') as HTMLElement | null;
                if (lineageDiv) {
                    lineageDiv.style.display = lineageDiv.style.display === 'none' ? 'block' : 'none';
                }
            });
        });

        // View Mode Toggle
        const viewRadios = container.querySelectorAll('input[name="view-mode"]');
        const hierarchyView = container.querySelector('#hierarchy-view') as HTMLElement | null;
        const listView = container.querySelector('#list-view') as HTMLElement | null;
        if (hierarchyView && listView) {
            viewRadios.forEach(radio => {
                radio.addEventListener('change', (event) => {
                    const target = event.target as HTMLInputElement;
                    if (target.value === 'hierarchy') {
                        hierarchyView.style.display = 'block';
                        listView.style.display = 'none';
                    } else {
                        hierarchyView.style.display = 'none';
                        listView.style.display = 'block';
                    }
                });
            });
             // Ensure initial state matches checked radio
             const checkedRadio = container.querySelector('input[name="view-mode"]:checked') as HTMLInputElement | null;
             if (checkedRadio?.value === 'lists') {
                 hierarchyView.style.display = 'none';
                 listView.style.display = 'block';
             } else {
                 hierarchyView.style.display = 'block';
                 listView.style.display = 'none';
             }
        }


        // Refresh Button
        const refreshButton = container.querySelector('#refresh-button');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => {
                new Notice('Refreshing view...');
                this.plugin.showGtdHierarchicalView();
            });
        }

        // Add click listeners for NOTE links (.item-link, .lineage-link)
        container.querySelectorAll('.item-link, .lineage-link').forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault(); // Prevent default link navigation
                const targetLink = event.currentTarget as HTMLAnchorElement;
                const path = targetLink.getAttribute('data-href');
                if (path) {
                    this.app.workspace.openLinkText(path, "", true); // Open in new tab
                }
            });
        });

        // --- GTD List Filtering ---
        container.querySelectorAll('.filter-update-button').forEach(button => {
            button.addEventListener('click', (event) => {
                const filterDiv = (event.target as HTMLElement).closest('.gtd-list-filter');
                if (!filterDiv) return;

                const listId = filterDiv.getAttribute('data-list-id');
                const selectElement = filterDiv.querySelector(`#filter-${listId}`) as HTMLSelectElement | null;
                const listDetailsElement = filterDiv.closest('.gtd-list-details');
                const taskListElement = listDetailsElement?.querySelector('.tasks-list');

                if (!selectElement || !taskListElement) {
                    console.error("Filter elements not found for list:", listId);
                    return;
                }

                const selectedTags = Array.from(selectElement.selectedOptions).map(option => option.value);

                console.log(`[GTDv2 View] Filtering list '${listId}' by tags:`, selectedTags);

                const taskItems = taskListElement.querySelectorAll('.tasks-item');
                taskItems.forEach(taskItem => {
                    const taskElement = taskItem as HTMLElement; // Cast for style access
                    if (selectedTags.length === 0) {
                        // No filters selected, show all tasks in this list
                        taskElement.style.display = '';
                        return;
                    }

                    // Check if the task contains any of the selected tags
                    const contextSpans = Array.from(taskElement.querySelectorAll('.meta.contexts, .meta.assigned'));
                    const taskTags = contextSpans.flatMap(span => span.textContent?.trim().split(' ') ?? []);

                    const hasMatchingTag = selectedTags.some(selectedTag => taskTags.includes(selectedTag));

                    if (hasMatchingTag) {
                        taskElement.style.display = ''; // Show if it matches
                    } else {
                        taskElement.style.display = 'none'; // Hide if it doesn't match
                    }
                });
                 new Notice(`Vista de lista '${listId}' actualizada.`);
            });
        });
        // --- End GTD List Filtering ---


        // Add click listeners for task text and checkbox to navigate TO THE TASK LINE
        container.querySelectorAll('.tasks-checkbox, .tasks-text').forEach(el => {
            el.addEventListener('click', (event) => {
                event.preventDefault(); // Prevent potential default actions
                const targetElement = event.currentTarget as HTMLElement;
                // Find the parent task item (li) to get data attributes reliably
                const taskItem = targetElement.closest('.tasks-item');
                if (!taskItem) {
                     console.error("[GTDv2 View] Could not find parent task item for navigation.");
                     new Notice("Error: No se pudo encontrar el elemento de la tarea.");
                     return;
                }

                // Get path and line number from the task item's attributes
                // NOTE: The path should be stored on the task elements themselves during generation if needed
                // Let's assume the path is on the parent list item for now, but line is on task item
                const path = taskItem.getAttribute('data-path'); // Re-check if path is here or on parent
                const lineStr = taskItem.getAttribute('data-linea');

                if (path && lineStr !== null) {
                    const line = parseInt(lineStr, 10);
                    if (isNaN(line)) {
                         console.error("[GTDv2 View] Invalid line number found:", lineStr);
                         new Notice("Error: Número de línea inválido para la tarea.");
                         return;
                    }
                    // Obsidian API uses 0-based line numbers. Our parser stores 0-based index.
                    const targetLine = line;
                    console.log(`[GTDv2 View] Navigating to Task -> Path: ${path}, Line: ${targetLine}`);
                    try {
                        // Use standard API to open in new tab and go to line
                        this.app.workspace.openLinkText(path, "", true, { eState: { line: targetLine } });
                    } catch (e) {
                         console.error("[GTDv2 View] Error executing openLinkText:", e);
                         new Notice("Error al intentar navegar a la tarea.");
                    }
                } else {
                    console.warn("[GTDv2 View] Missing path or line number for task navigation.", {path, lineStr, taskItem});
                    new Notice("Error: No se pudo navegar a la tarea (falta información de ruta o línea).");
                }
            });
        });


        // Scroll to active context if present and expand parents
        const activeElement = container.querySelector('.active-context') as HTMLElement | null;
        if (activeElement) {
            // Use setTimeout to ensure layout is complete before scrolling
            setTimeout(() => {
                activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Expand parents by finding the header and triggering a click if needed
                let current: HTMLElement | null = activeElement;
                // Iterate upwards through parent list items
                while (current && current !== container) {
                    const parentItem = current.closest('.proyectos-item');
                    if (!parentItem) break; // Stop if we can't find a parent item

                    const parentContent = parentItem.querySelector('.proyectos-area-content') as HTMLElement | null;
                    const parentHeader = parentItem.querySelector('.proyectos-area-header') as HTMLElement | null;
                    const parentToggle = parentHeader?.querySelector('.toggle-icon') as HTMLElement | null;

                    // Check if the content area exists and is currently hidden
                    if (parentContent && parentToggle && parentContent.style.display === 'none') {
                        // Dispatch a click event on the header to trigger the toggle logic
                        if (parentHeader) {
                            parentHeader.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                        }
                    }
                    // Move up to the next parent item in the hierarchy
                    current = parentItem.parentElement?.closest('.proyectos-item') as HTMLElement | null;
                }
            }, 100); // Delay scrolling/expanding slightly
        }
    }


    async onClose() {
        console.log("[GTDv2 View] Closing view.");
        // Perform any cleanup needed when the view is closed
    }
}
