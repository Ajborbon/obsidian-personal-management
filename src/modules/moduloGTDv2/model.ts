// Data models (interfaces/classes) for GTDv2: Task, HierarchicalItem

/**
 * Represents a single task parsed from a note.
 */
export interface Task {
    id: string | null; // Unique ID (🆔)
    rawText: string; // The raw text of the task line `- [ ] ...`
    text: string; // Text content of the task (excluding checkbox, ID, metadata)
    status: ' ' | 'x' | 'X' | '/' | '-'; // Checkbox status: incomplete, complete (lowercase/uppercase), cancelled, in progress
    filePath: string; // Path of the file containing the task
    lineNumber: number; // Line number where the task is located
    tags: string[]; // All tags found in the task line

    // GTD Specific Metadata
    contexts: string[]; // #cx- tags
    assignedPersons: string[]; // #px- tags
    startDate: string | null; // 🛫 YYYY-MM-DD
    dueDate: string | null; // 📅 YYYY-MM-DD
    scheduledDate: string | null; // ⏳ YYYY-MM-DD (Treated similarly to dueDate for 'Ojalá Hoy')
    startTime: string | null; // [hI:: time]
    endTime: string | null; // [hF:: time]
    duration: string | null; // [Xmin] or [Xh]
    week: string | null; // [w:: [[YYYY-WXX]]]
    dependsOn: string | null; // ⛔ ID
    priority: 'highest' | 'high' | 'medium' | 'low' | 'lowest' | null; // ⏫, 🔼, ?, 🔽, ⏬

    // Calculated/Processed fields (optional, can be added during processing)
    gtdList?: string; // Which GTD list the task belongs to (e.g., 'Inbox', 'Next Actions')
    isDue?: boolean; // Calculated based on dueDate/scheduledDate and current date
    isOverdue?: boolean; // Calculated based on dueDate/scheduledDate and current date
    conflicts?: string[]; // List of detected inconsistencies
}

/**
 * Represents a note within the hierarchical structure.
 */
export interface HierarchicalItem {
    path: string; // Unique identifier (file path)
    fileName: string; // Base name of the file
    aliases?: string[]; // Optional: Parsed from frontmatter 'aliases'
    typeName?: string; // Optional: Parsed from frontmatter 'typeName'
    estado?: string; // Optional: Parsed from frontmatter 'estado'

    tasks: Task[]; // Tasks found directly within this note's content
    children: HierarchicalItem[]; // Direct children notes based on the 'asunto' field

    // Linages based on frontmatter fields (arrays preserve order: [direct parent, grandparent, ...])
    lineageAreaVida: string[]; // Array of file paths
    lineageAreaInteres: string[]; // Array of file paths
    lineageProyectoQ: string[]; // Array of file paths
    lineageProyectoGTD: string[]; // Array of file paths
    parentAsuntoPath: string | null; // Path of the direct parent defined by 'asunto'
    ctime?: number; // Optional: File creation timestamp (added for sorting)

    // State for UI
    isExpanded?: boolean; // For tree view state
    isActiveContext?: boolean; // If this item corresponds to the currently active Obsidian note
}

/**
 * Represents the entire parsed and structured data set.
 */
export interface GtdDataModel {
    items: Map<string, HierarchicalItem>; // All items keyed by path for quick lookup
    roots: HierarchicalItem[]; // Top-level items (those without a parentAsuntoPath)
    allTasks: Task[]; // Flat list of all tasks found
}

/**
 * Represents the classified tasks into GTD lists.
 */
export interface ClassifiedTasks {
    inbox: Task[];
    nextActions: Task[];
    calendar: Task[];
    ojalaHoy: Task[];
    asignadas: Task[];
    proyectos: Task[];
    somedayMaybe: Task[];
    estaSemanaNo: Task[];
    enPausa: Task[];
    vencidas: Task[]; // Separate list for overdue 'Ojalá Hoy' tasks
    conflictivas: Task[]; // Tasks moved to Inbox due to conflicts
}
