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

    // Sort children alphabetically by fileName for consistent display? (Optional)
    itemsMap.forEach(item => {
        item.children.sort((a, b) => a.fileName.localeCompare(b.fileName));
    });

    return {
        items: itemsMap,
        roots: roots,
        allTasks: allTasks,
    };
}
