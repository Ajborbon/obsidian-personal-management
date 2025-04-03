// Logic for generating the HTML view for GTDv2
import type { GtdDataModel, HierarchicalItem, Task, ClassifiedTasks } from './model';
import { DateTime } from 'luxon'; // Import Luxon

// --- Constants ---
const OBSIDIAN_APP_URI_SCHEME = 'obsidian://';

/**
 * Generates the complete HTML page for the GTD v2 view.
 * @param model The processed GtdDataModel containing the hierarchy and all items.
 * @param classifiedTasks The tasks classified into GTD lists.
 * @param activeNotePath The path of the note active in Obsidian when the view was triggered.
 * @param vaultName The name of the current Obsidian vault.
 * @returns A string containing the full HTML document.
 */
export function generateGtdViewHtml(
    model: GtdDataModel,
    classifiedTasks: ClassifiedTasks,
    activeNotePath: string | null,
    vaultName: string
): string {

    console.log(`[GTDv2 HTML] Generating HTML view. Active note: ${activeNotePath}`);

    // --- Helper Functions for Rendering (Inspired by addOnsAPI) ---

    function renderHierarchicalItem(item: HierarchicalItem, level: number): string {
        const isActive = item.path === activeNotePath;
        const hasChildren = item.children.length > 0;
        const hasTasks = item.tasks.length > 0;
        const hasContent = hasChildren || hasTasks;

        // Determine item type and status (assuming they might be added to HierarchicalItem later)
        // Get typeName and estado from the item (populated by hierarchyBuilder)
        const itemType = item.typeName || "Nota";
        const itemStatus = item.estado || "";

        // Determine display name: use alias[0] if available, otherwise fileName
        const displayName = (item.aliases && item.aliases.length > 0) ? item.aliases[0] : item.fileName;

        const itemClass = `proyectos-item nivel-${level} ${isActive ? 'active-context' : ''}`;
        const headerClass = `proyectos-area-header`; // Use similar class for consistency

        // Build lineages string using display names (requires alias lookup - simplified for now)
        // TODO: Implement alias lookup for lineage links (requires passing the full model.items map)
        const renderLineageLink = (path: string): string => {
            const linkedItem = model.items.get(path);
            const linkDisplayName = (linkedItem?.aliases && linkedItem.aliases.length > 0)
                                     ? linkedItem.aliases[0]
                                     : (linkedItem?.fileName ?? path.substring(path.lastIndexOf('/') + 1).replace('.md', ''));
            return `<a class="internal-link lineage-link" href="${path}" data-href="${path}" title="${path}">${linkDisplayName}</a>`;
        };
        const lineages = `
            AV: ${item.lineageAreaVida.map(renderLineageLink).join(' -> ')} <br>
            AI: ${item.lineageAreaInteres.map(renderLineageLink).join(' -> ')} <br>
            PQ: ${item.lineageProyectoQ.map(renderLineageLink).join(' -> ')} <br>
            PGTD: ${item.lineageProyectoGTD.map(renderLineageLink).join(' -> ')}
        `.trim();


        // Unique ID for toggling content - replace slashes, dots, spaces, and other unsafe chars
        const safePath = item.path.replace(/[^a-zA-Z0-9_-]/g, "_"); // Make ID safer
        const toggleId = `item-${safePath}`;

        // Format header: [typeName] estado NombreNota
        const headerContent = `
            ${hasContent ? '<span class="toggle-icon">►</span>' : '<span class="no-toggle"></span>'}
            <span class="item-type">[${itemType}]</span>
            ${itemStatus ? `<span class="proyecto-estado">${itemStatus}</span> ` : ''}
            <a class="internal-link item-link" href="${item.path}" data-href="${item.path}" title="${item.path}">${displayName}</a>
            ${hasTasks ? `<span class="proyectos-contador">(${item.tasks.length})</span>` : ''}
            ${lineages ? `<button class="show-lineage">Linaje</button>` : ''}
        `;

        return `
            <li class="${itemClass}" data-path="${item.path}">
                <div class="${headerClass}" data-toggle-id="${toggleId}">
                    ${headerContent}
                </div>
                ${lineages ? `<div class="item-lineage" style="display: none;">${lineages}</div>` : ''}
                ${hasContent ? `
                <div class="proyectos-area-content" id="content-${toggleId}" style="display: none;">
                    ${hasTasks ? `
                    <ul class="tasks-list">
                        ${item.tasks.map(task => renderTask(task, vaultName)).join('')}
                    </ul>` : ''}
                    ${hasChildren ? `
                    <ul class="proyectos-sublista">
                        ${item.children.map(child => renderHierarchicalItem(child, level + 1)).join('')}
                    </ul>` : ''}
                </div>` : ''}
            </li>
        `;
    }

    function renderTask(task: Task, vault: string): string {
        // Inspired by crearTareaElementHuerfana and renderTask
        const obsidianUri = `${OBSIDIAN_APP_URI_SCHEME}open?vault=${encodeURIComponent(vault)}&file=${encodeURIComponent(task.filePath)}&line=${task.lineNumber}`;
        const isOverdueClass = task.isOverdue ? 'overdue' : '';
        const priorityClass = task.priority ? `priority-${task.priority}` : '';
        const statusText = task.status === ' ' ? '☐' : (task.status === '/' ? '◔' : `[${task.status}]`); // Use symbols like in example

        // Build metadata string
        let metadataHtml = '';
        if (task.dueDate) metadataHtml += `<span class="meta due-date">📅 ${task.dueDate}</span> `;
        if (task.scheduledDate) metadataHtml += `<span class="meta scheduled-date">⏳ ${task.scheduledDate}</span> `;
        if (task.startDate) metadataHtml += `<span class="meta start-date">🛫 ${task.startDate}</span> `;
        if (task.startTime) metadataHtml += `<span class="meta start-time">[hI:: ${task.startTime}]</span> `;
        if (task.endTime) metadataHtml += `<span class="meta end-time">[hF:: ${task.endTime}]</span> `;
        if (task.duration) metadataHtml += `<span class="meta duration">[${task.duration}]</span> `;
        if (task.contexts.length > 0) metadataHtml += `<span class="meta contexts">${task.contexts.join(' ')}</span> `;
        if (task.assignedPersons.length > 0) metadataHtml += `<span class="meta assigned">${task.assignedPersons.join(' ')}</span> `;
        if (task.dependsOn) metadataHtml += `<span class="meta depends-on">⛔ ${task.dependsOn}</span> `;
        if (task.week) metadataHtml += `<span class="meta week">[w:: [[${task.week}]]]</span> `;

        // Add data-path attribute to the list item itself
        return `
            <li class="tasks-item ${isOverdueClass} ${priorityClass}" data-task-id="${task.id ?? ''}" data-linea="${task.lineNumber}" data-path="${task.filePath}">
                <div class="tarea-texto">
                     <span class="tasks-checkbox">${statusText}</span>
                     <span class="tasks-text">
                        ${getPrioritySymbol(task.priority)} ${task.text}
                     </span>
                </div>
                ${metadataHtml ? `<div class="tarea-metadatos">${metadataHtml}</div>` : ''}
                ${task.id ? `<div class="tarea-id">🆔 ${task.id}</div>` : ''}
            </li>
        `;
        // Note: Removed the outer <a> tag wrapping the whole task, click listeners will be added in view.ts
    }

    function getPrioritySymbol(priority: Task['priority']): string {
        switch (priority) {
            case 'highest': return '⏫';
            case 'high': return '🔼';
            case 'low': return '🔽';
            case 'lowest': return '⏬';
            default: return '';
        }
    }

    // --- Sorting Helper Functions ---

    /**
     * Gets the relevant date (due highest priority, then scheduled) for sorting.
     * Returns null if no relevant date exists.
     */
    function getTaskSortDate(task: Task): DateTime | null {
        // Accept string, undefined, or null
        const parseDate = (dateStr: string | undefined | null): DateTime | null => {
            if (!dateStr) return null; // Handles undefined and null
            const dt = DateTime.fromISO(dateStr);
            return dt.isValid ? dt : null;
        };

        const dueDate = parseDate(task.dueDate);
        const scheduledDate = parseDate(task.scheduledDate);

        if (dueDate) return dueDate;
        if (scheduledDate) return scheduledDate;
        return null;
    }

    /**
     * Compares two tasks based on date (due/scheduled) and then context/person tags.
     * - Overdue tasks first (older first).
     * - Tasks due/scheduled later come next (sooner first).
     * - Tasks without dates come last.
     * - Secondary sort by the first context (#cx-) or assigned person (#px-) tag alphabetically.
     */
    function compareTasks(a: Task, b: Task): number {
        const dateA = getTaskSortDate(a);
        const dateB = getTaskSortDate(b);
        const now = DateTime.now().startOf('day'); // Compare against the start of today

        // Handle null dates (put them at the end)
        if (!dateA && !dateB) return 0; // Keep original order if both lack dates
        if (!dateA) return 1; // a comes after b
        if (!dateB) return -1; // a comes before b

        const isAOverdue = dateA < now;
        const isBOverdue = dateB < now;

        // Sort by overdue status first
        if (isAOverdue && !isBOverdue) return -1; // Overdue a comes before non-overdue b
        if (!isAOverdue && isBOverdue) return 1; // Non-overdue a comes after overdue b

        // If both are overdue, sort by date ascending (older first)
        if (isAOverdue && isBOverdue) {
            if (dateA < dateB) return -1;
            if (dateA > dateB) return 1;
        }

        // If both are not overdue, sort by date ascending (sooner first)
        if (!isAOverdue && !isBOverdue) {
            if (dateA < dateB) return -1;
            if (dateA > dateB) return 1;
        }

        // --- Dates are the same (or both null treated as same), sort by tag ---
        const getFirstTag = (task: Task): string | null => {
            const tags = [...task.contexts, ...task.assignedPersons].sort();
            return tags.length > 0 ? tags[0] : null;
        };

        const tagA = getFirstTag(a);
        const tagB = getFirstTag(b);

        if (!tagA && !tagB) return 0;
        if (!tagA) return 1; // Tasks without tags come after tasks with tags
        if (!tagB) return -1;

        return tagA.localeCompare(tagB); // Alphabetical sort
    }


    function renderGtdList(listId: keyof ClassifiedTasks, listName: string, tasks: Task[], vaultName: string): string {
        if (tasks.length === 0) return '';

        let sortedTasks = [...tasks]; // Create a copy to sort
        let filterHtml = '';

        // Apply specific sorting and filtering UI for Next Actions and Asignadas
        if (listId === 'nextActions' || listId === 'asignadas') {
            sortedTasks.sort(compareTasks);

            // Extract unique tags for filtering
            const uniqueTags = new Set<string>();
            sortedTasks.forEach(task => {
                task.contexts.forEach(tag => uniqueTags.add(tag));
                task.assignedPersons.forEach(tag => uniqueTags.add(tag));
            });

            const sortedUniqueTags = Array.from(uniqueTags).sort();

            // Generate filter HTML (using basic select multiple for now)
            // Client-side filtering logic will be added in view.ts
            if (sortedUniqueTags.length > 0) {
                filterHtml = `
                    <div class="gtd-list-filter" data-list-id="${listId}">
                        <label for="filter-${listId}">Filtrar por Tag:</label>
                        <select id="filter-${listId}" name="filter-${listId}" multiple size="3" style="width: 90%; margin-bottom: 5px;">
                            ${sortedUniqueTags.map(tag => `<option value="${tag}">${tag}</option>`).join('')}
                        </select>
                        <button class="filter-update-button">Actualizar Vista</button>
                    </div>
                `;
            }
        }

        // Change title for Ojalá Hoy
        const displayListName = listId === 'ojalaHoy' ? 'Hoy - Ojalá Hoy' : listName;

        // Wrap in <details> element, closed by default (no 'open' attribute)
        // Add data-list-id to the details element for easier targeting in view.ts
        return `
            <details class="gtd-list-details" data-list-id="${listId}">
                <summary class="gtd-list-summary">
                    <h2>${displayListName} (${tasks.length})</h2>
                </summary>
                ${filterHtml}
                <ul class="tasks-list">
                    ${sortedTasks.map(task => renderTask(task, vaultName)).join('')}
                </ul>
            </details>
        `;
    }

    // --- HTML Structure ---
    let hierarchyHtml = '';
    if (activeNotePath && model.items.has(activeNotePath)) {
        // Start rendering from the active note if it exists in the model
        const activeItem = model.items.get(activeNotePath)!;
        hierarchyHtml = renderHierarchicalItem(activeItem, 0); // Render only the active node and its descendants
    } else if (model.roots.length > 0) {
         // Fallback: If no active note or it's not in the model, render from roots (or show a message)
         hierarchyHtml = model.roots.map(root => renderHierarchicalItem(root, 0)).join('');
         // Optionally add a message indicating it's showing roots because active note wasn't found/applicable
         // hierarchyHtml = `<p>Mostrando raíces (nota activa no encontrada o sin descendencia relevante).</p>` + hierarchyHtml;
    } else {
        hierarchyHtml = '<p>No se encontró jerarquía para mostrar.</p>';
    }

    // --- Get Active Note Details for Header ---
    let activeNoteAlias = null; // Initialize alias variable
    let activeNotePathDisplay = activeNotePath ?? 'N/A'; // Path or N/A

    if (activeNotePath) {
        const activeItem = model.items.get(activeNotePath);
        if (activeItem?.aliases && activeItem.aliases.length > 0) {
             activeNoteAlias = activeItem.aliases[0]; // Store the alias if found
        }
        // Keep activeNotePathDisplay as just the path
    }


    // --- Generate HTML for each GTD List ---
    // Pass the listId and vaultName to renderGtdList
    const gtdListsHtml = `
        ${renderGtdList('inbox', 'Inbox', classifiedTasks.inbox, vaultName)}
        ${renderGtdList('nextActions', 'Next Actions', classifiedTasks.nextActions, vaultName)}
        ${renderGtdList('calendar', 'Calendar', classifiedTasks.calendar, vaultName)}
        ${renderGtdList('ojalaHoy', 'Ojalá Hoy', classifiedTasks.ojalaHoy, vaultName)}
        ${renderGtdList('vencidas', 'Vencidas (Ojalá Hoy)', classifiedTasks.vencidas, vaultName)}
        ${renderGtdList('asignadas', 'Asignadas', classifiedTasks.asignadas, vaultName)}
        ${renderGtdList('proyectos', 'Proyectos', classifiedTasks.proyectos, vaultName)}
        ${renderGtdList('enPausa', 'En Pausa', classifiedTasks.enPausa, vaultName)}
        ${renderGtdList('somedayMaybe', 'Someday/Maybe', classifiedTasks.somedayMaybe, vaultName)}
        ${renderGtdList('estaSemanaNo', 'Esta Semana No', classifiedTasks.estaSemanaNo, vaultName)}
        ${renderGtdList('conflictivas', 'Conflictivas', classifiedTasks.conflictivas, vaultName)}
    `;

    // Return only the body content, suitable for embedding in an ItemView
    return `
    <h1>GTD v2 View</h1>
    <p>Vault: ${vaultName}</p>
    ${activeNoteAlias ? `<p>Active Note Alias: ${activeNoteAlias}</p>` : ''} 
    <p>Active Note Path: ${activeNotePathDisplay}</p> 
    <button id="refresh-button">Actualizar tareas</button> 

    <div>
        <label><input type="radio" name="view-mode" value="hierarchy" checked> Vista Jerárquica</label>
        <label><input type="radio" name="view-mode" value="lists"> Vista de Listas GTD</label>
    </div>

    <div id="hierarchy-view">
        <h2>Jerarquía</h2>
        <ul class="hierarchy-root">
            ${hierarchyHtml}
        </ul>
    </div>

    <div id="list-view" style="display: none;">
        <h2>Listas GTD</h2>
        ${gtdListsHtml}
    </div>
    `;
    // Removed the commented-out full HTML structure as it was causing parsing errors
}
