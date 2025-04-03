// Logic for generating the HTML view for GTDv2
import type { GtdDataModel, HierarchicalItem, Task, ClassifiedTasks } from './model';

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

    function renderGtdList(listName: string, tasks: Task[]): string {
        if (tasks.length === 0) return '';
        // TODO: Add sorting within lists (e.g., by priority, date)
        // Wrap in <details> element, closed by default (no 'open' attribute)
        return `
            <details class="gtd-list-details">
                <summary class="gtd-list-summary">
                    <h2>${listName} (${tasks.length})</h2>
                </summary>
                <ul class="tasks-list">
                    ${tasks.map(task => renderTask(task, vaultName)).join('')}
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

    const gtdListsHtml = `
        ${renderGtdList('Inbox', classifiedTasks.inbox)}
        ${renderGtdList('Next Actions', classifiedTasks.nextActions)}
        ${renderGtdList('Calendar', classifiedTasks.calendar)}
        ${renderGtdList('Ojalá Hoy', classifiedTasks.ojalaHoy)}
        ${renderGtdList('Vencidas (Ojalá Hoy)', classifiedTasks.vencidas)}
        ${renderGtdList('Asignadas', classifiedTasks.asignadas)}
        ${renderGtdList('Proyectos', classifiedTasks.proyectos)}
        ${renderGtdList('En Pausa', classifiedTasks.enPausa)}
        ${renderGtdList('Someday/Maybe', classifiedTasks.somedayMaybe)}
        ${renderGtdList('Esta Semana No', classifiedTasks.estaSemanaNo)}
        ${renderGtdList('Conflictivas', classifiedTasks.conflictivas)}
    `;

    // Return only the body content, suitable for embedding in an ItemView
    return `
    <h1>GTD v2 View</h1>
    <p>Vault: ${vaultName}</p>
    <p>Active Note Context: ${activeNotePath ?? 'N/A'}</p>
    <button id="refresh-button">Refresh View</button>

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
