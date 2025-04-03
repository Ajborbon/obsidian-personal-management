// Logic for building the hierarchical structure based on parsed data
import type { ParsedNoteData, ParsedTaskData } from './parser';
import type { GtdDataModel, HierarchicalItem, Task } from './model';

/**
 * Builds the hierarchical data model from parsed note data.
 * @param parsedNotes Array of ParsedNoteData from the parser.
 * @returns GtdDataModel representing the structured hierarchy and tasks.
 */
export function buildHierarchy(parsedNotes: ParsedNoteData[]): GtdDataModel {
    const itemsMap = new Map<string, HierarchicalItem>();
    const allTasks: Task[] = [];
    const roots: HierarchicalItem[] = [];

    console.log(`[GTDv2 Builder] Starting hierarchy build for ${parsedNotes.length} notes.`);

    // --- Pass 1: Create all HierarchicalItem instances and populate basic info ---
    parsedNotes.forEach(noteData => {
        // Extract typeName and estado from raw frontmatter (needs access to it)
        // We need to adjust the parser output or re-read frontmatter here.
        // Let's assume parser.ts will be modified to include raw frontmatter.
        // For now, we'll add placeholders.
        const rawFrontmatter = (noteData as any).rawFrontmatter || {}; // Placeholder
        const typeName = rawFrontmatter.typeName as string | undefined;
        const estado = rawFrontmatter.estado as string | undefined;


        // Map ParsedTaskData to Task, adding filePath and lineNumber, and FILTERING completed and cancelled tasks
        const tasks: Task[] = noteData.tasks
            .filter(parsedTask => parsedTask.status !== 'x' && parsedTask.status !== 'X' && parsedTask.status !== '-') // Keep only non-completed and non-cancelled tasks
            .map(parsedTask => {
            const task: Task = {
                ...parsedTask, // Spread properties from ParsedTaskData
                filePath: noteData.path,
                lineNumber: parsedTask.rawLineNumber, // Use the stored raw line number
                rawText: parsedTask.rawLineText, // Store the raw line text
                // Initialize calculated fields
                gtdList: undefined,
                isDue: undefined,
                isOverdue: undefined,
                conflicts: [],
            };
            // Add only non-completed tasks to the flat list as well
            allTasks.push(task);
            return task;
        });

        const item: HierarchicalItem = {
            path: noteData.path,
            fileName: noteData.fileName,
            aliases: noteData.aliases, // Populate aliases from parsed data
            typeName: typeName, // Populate from frontmatter
            estado: estado, // Populate from frontmatter
            tasks: tasks,
            children: [], // Initialize children array
            // Populate lineages directly from parsed frontmatter
            lineageAreaVida: noteData.frontmatter.areaVidaLinks,
            lineageAreaInteres: noteData.frontmatter.areaInteresLinks,
            lineageProyectoQ: noteData.frontmatter.proyectoQLinks,
            lineageProyectoGTD: noteData.frontmatter.proyectoGTDLinks,
            parentAsuntoPath: noteData.frontmatter.asuntoLink,
            ctime: noteData.ctime, // Assign ctime from ParsedNoteData
            // Initialize UI state
            isExpanded: false,
            isActiveContext: false,
        };
        itemsMap.set(item.path, item);
    });

    console.log(`[GTDv2 Builder] Pass 1 complete. Created ${itemsMap.size} items and found ${allTasks.length} total tasks.`);

    // --- Pass 2: Establish parent-child relationships and identify roots ---
    itemsMap.forEach(item => {
        if (item.parentAsuntoPath) {
            const parentItem = itemsMap.get(item.parentAsuntoPath);
            if (parentItem) {
                parentItem.children.push(item);
            } else {
                // Parent specified in 'asunto' doesn't exist in the parsed notes (orphaned?)
                console.warn(`[GTDv2 Builder] Parent note ${item.parentAsuntoPath} for item ${item.path} not found. Treating as root.`);
                roots.push(item);
            }
        } else {
            // No parent specified via 'asunto', this is a root item
            roots.push(item);
        }
    });

    console.log(`[GTDv2 Builder] Pass 2 complete. Identified ${roots.length} root items.`);

    // --- Custom Sorting Logic ---
    const typeOrder = [
        "AreaVida",
        "AreaInteres",
        "Recursos Recurrentes", // Assuming this is the exact typeName string
        "Proyectos Q", // Assuming this is the exact typeName string
        "ProyectoGTD", // Assuming #cx-ProyectoGTD maps to this typeName
        "Campañas", // Assuming this is the exact typeName string
        "Entregable", // Assuming #cx-Entregable maps to this typeName
        "Anotacion", // Assuming this is the exact typeName string
    ];
    const typeOrderMap = new Map(typeOrder.map((type, index) => [type, index]));

    const statusOrder = ["🟢", "🟡", "🔵", "🔴"];
    const statusOrderMap = new Map(statusOrder.map((status, index) => [status, index]));

    function compareHierarchicalItems(a: HierarchicalItem, b: HierarchicalItem): number {
        // 1. Sort by Type Name based on custom order
        const typeAIndex = typeOrderMap.get(a.typeName ?? '');
        const typeBIndex = typeOrderMap.get(b.typeName ?? '');

        if (typeAIndex !== undefined && typeBIndex !== undefined) {
            if (typeAIndex !== typeBIndex) return typeAIndex - typeBIndex;
        } else if (typeAIndex !== undefined) {
            return -1; // a comes first (it's in the custom order)
        } else if (typeBIndex !== undefined) {
            return 1; // b comes first
        } else {
            // Neither is in custom order, sort alphabetically by typeName (or handle undefined)
            const typeNameA = a.typeName ?? '';
            const typeNameB = b.typeName ?? '';
            if (typeNameA !== typeNameB) return typeNameA.localeCompare(typeNameB);
        }

        // 2. Types are equivalent, sort by Status based on custom order
        const statusAIndex = statusOrderMap.get(a.estado ?? '');
        const statusBIndex = statusOrderMap.get(b.estado ?? '');
        const maxStatusIndex = statusOrder.length; // Place items without status last

        const effectiveStatusA = statusAIndex !== undefined ? statusAIndex : maxStatusIndex;
        const effectiveStatusB = statusBIndex !== undefined ? statusBIndex : maxStatusIndex;

        if (effectiveStatusA !== effectiveStatusB) {
            return effectiveStatusA - effectiveStatusB;
        }

        // 3. Types and Statuses are equivalent, sort by Creation Time (ctime) descending (newest first)
        // Use 0 as a fallback if ctime is undefined/null, placing items without ctime last.
        const ctimeA = a.ctime ?? 0;
        const ctimeB = b.ctime ?? 0;

        if (ctimeA !== ctimeB) {
            return ctimeB - ctimeA; // Descending order (higher timestamp = newer)
        }

        // 4. Fallback to alphabetical by filename if all else is equal
        return a.fileName.localeCompare(b.fileName);
    }

    // Sort children using the custom comparison function
    itemsMap.forEach(item => {
        item.children.sort(compareHierarchicalItems);
    });

    return {
        items: itemsMap,
        roots: roots,
        allTasks: allTasks,
    };
}
