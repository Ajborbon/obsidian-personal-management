// Logic for parsing vault notes, frontmatter, and tasks for GTDv2
import type { App, TFile, FrontMatterCache } from 'obsidian'; // Import types
import { parseFrontMatterEntry, getAllTags } from 'obsidian'; // Import functions/values
import type { Task, HierarchicalItem } from './model'; // Use import type

// --- Constants for Frontmatter Keys ---
const FM_AREA_VIDA = 'areaVida';
const FM_AREA_INTERES = 'areaInteres';
const FM_PROYECTO_Q = 'proyectoQ';
const FM_PROYECTO_GTD = 'proyectoGTD';
const FM_ASUNTO = 'asunto';

// --- Interfaces for Raw Parsed Data ---
interface ParsedFrontmatter {
    areaVidaLinks: string[];
    areaInteresLinks: string[];
    proyectoQLinks: string[];
    proyectoGTDLinks: string[];
    asuntoLink: string | null;
}

export interface ParsedTaskData extends Omit<Task, 'filePath' | 'lineNumber' | 'rawText'> { // Added export
    // Raw extracted values before final processing
    rawLineNumber: number;
    rawLineText: string;
}

export interface ParsedNoteData {
    path: string;
    fileName: string;
    frontmatter: ParsedFrontmatter; // Contains only the resolved links
    rawFrontmatter: any; // Include the raw frontmatter object
    aliases?: string[]; // Add aliases from frontmatter
    tasks: ParsedTaskData[];
    content: string; // Keep content for potential future use or context
    ctime: number; // File creation timestamp
}

/**
 * Parses the entire vault to extract relevant data for GTDv2.
 * @param app Obsidian App instance
 * @returns Promise resolving to an array of ParsedNoteData
 */
export async function parseVault(app: App): Promise<ParsedNoteData[]> {
    const markdownFiles = app.vault.getMarkdownFiles();
    const parsedNotes: ParsedNoteData[] = [];

    // Define excluded folder paths (relative to vault root)
    const excludedFolders = [
        'Adjuntos/',
        'Archivo/',
        'Plantillas/',
        'Estructura/GTD/Sistema GTD/Sistema/'
    ];

    console.log(`[GTDv2 Parser] Starting vault parse. Found ${markdownFiles.length} markdown files. Excluding folders: ${excludedFolders.join(', ')}`);

    for (const file of markdownFiles) {
        // Check if the file path starts with any excluded folder path
        const isExcluded = excludedFolders.some(folder => file.path.startsWith(folder));
        if (isExcluded) {
            // console.log(`[GTDv2 Parser] Skipping excluded file: ${file.path}`);
            continue; // Skip this file
        }

        try {
            const fileCache = app.metadataCache.getFileCache(file);
            const frontmatter = fileCache?.frontmatter ?? {};
            const content = await app.vault.cachedRead(file);

            const parsedFm = parseNoteFrontmatter(frontmatter, app, file.path);
            // TODO: Implement parseNoteTasks
            const parsedTasks = parseNoteTasks(content, file.path);

            parsedNotes.push({
                path: file.path,
                fileName: file.basename,
                frontmatter: parsedFm,
                rawFrontmatter: frontmatter, // Add raw frontmatter here
                aliases: frontmatter.aliases, // Add aliases here
                tasks: parsedTasks,
                content: content,
                ctime: file.stat.ctime, // Add file creation time
            });
        } catch (error) {
            console.error(`[GTDv2 Parser] Error parsing file ${file.path}:`, error);
        }
    }

    console.log(`[GTDv2 Parser] Finished vault parse. Successfully parsed ${parsedNotes.length} notes.`);
    return parsedNotes;
}

/**
 * Parses the frontmatter of a single note.
 * @param fm Raw frontmatter object
 * @param app Obsidian App instance
 * @param notePath Path of the note being parsed (for resolving links)
 * @returns ParsedFrontmatter object
 */
function parseNoteFrontmatter(fm: any, app: App, notePath: string): ParsedFrontmatter {
    const getLinks = (key: string): string[] => {
        const entry = fm[key];
        if (!entry) return [];
        const values = Array.isArray(entry) ? entry : [entry];
        return values
            .map(link => {
                if (typeof link === 'string') {
                    // Try to resolve wikilink [[Link]] or [[Link|Alias]]
                    const match = link.match(/^\[\[([^|\]]+)(?:\|[^\]]+)?\]\]$/);
                    if (match) {
                        const linkText = match[1];
                        const resolvedFile = app.metadataCache.getFirstLinkpathDest(linkText, notePath);
                        return resolvedFile?.path ?? null; // Return path or null if not resolved
                    }
                    // Could potentially handle direct paths here if needed
                }
                return null; // Ignore non-string or non-wikilink entries
            })
            .filter((path): path is string => path !== null); // Filter out nulls
    };

    const asuntoRaw = fm[FM_ASUNTO];
    let asuntoLink: string | null = null;
    if (asuntoRaw) {
        // Asunto should only have one link according to plan, take the first if array
        const asuntoValue = Array.isArray(asuntoRaw) ? asuntoRaw[0] : asuntoRaw;
        if (typeof asuntoValue === 'string') {
            const match = asuntoValue.match(/^\[\[([^|\]]+)(?:\|[^\]]+)?\]\]$/);
            if (match) {
                const resolvedFile = app.metadataCache.getFirstLinkpathDest(match[1], notePath);
                asuntoLink = resolvedFile?.path ?? null;
            }
        }
    }


    return {
        areaVidaLinks: getLinks(FM_AREA_VIDA),
        areaInteresLinks: getLinks(FM_AREA_INTERES),
        proyectoQLinks: getLinks(FM_PROYECTO_Q),
        proyectoGTDLinks: getLinks(FM_PROYECTO_GTD),
        asuntoLink: asuntoLink,
    };
}

/**
 * Parses the tasks from the content of a single note.
 * Placeholder function - needs implementation.
 * @param content Note content string
 * @param filePath Path of the note
 * @returns Array of ParsedTaskData
 */
function parseNoteTasks(content: string, filePath: string): ParsedTaskData[] {
    const tasks: ParsedTaskData[] = [];
    const lines = content.split('\n');
    // Regex explanation:
    // ^\s*-\s*\[(.)\]\s*: Start of line, optional whitespace, hyphen, whitespace, checkbox '[.]', whitespace
    // (.*): Capture the rest of the line as the task content
    const taskRegex = /^\s*-\s*\[(.)\]\s*(.*)$/;

    // Regexes for metadata extraction (applied iteratively to the task content)
    const idRegex = /\s*(?:🆔)\s*(\S+)\s*$/; // Matches ID at the end
    const contextTagRegex = /#cx-([\w-]+)/g; // Matches #cx-Tag
    const personTagRegex = /#px-([\w_]+)/g; // Matches #px-Name or #px-Name_Company
    const startDateRegex = /\s*(?:🛫)\s*(\d{4}-\d{2}-\d{2})\s*/; // Matches 🛫 YYYY-MM-DD
    const dueDateRegex = /\s*(?:📅)\s*(\d{4}-\d{2}-\d{2})\s*/; // Matches 📅 YYYY-MM-DD
    const scheduledDateRegex = /\s*(?:⏳)\s*(\d{4}-\d{2}-\d{2})\s*/; // Matches ⏳ YYYY-MM-DD
    const startTimeRegex = /\s*\[hI::\s*([^\]]+)\]\s*/; // Matches [hI:: time]
    const endTimeRegex = /\s*\[hF::\s*([^\]]+)\]\s*/; // Matches [hF:: time]
    const durationRegex = /\s*\[(\d+(?:\.\d+)?(?:min|h))\]\s*/; // Matches [Xmin] or [Xh] (allows decimals for hours)
    const weekRegex = /\s*\[w::\s*\[\[(\d{4}-W\d{2})\]\]\]\s*/; // Matches [w:: [[YYYY-WXX]]]
    const dependsOnRegex = /\s*(?:⛔)\s*(\S+)\s*/; // Matches ⛔ ID
    const priorityRegex = /\s*(⏫|🔼|🔽|⏬)\s*/; // Matches priority symbols

    lines.forEach((line, index) => {
        const taskMatch = line.match(taskRegex);
        if (taskMatch) {
            const status = taskMatch[1] as Task['status'];
            let remainingText = taskMatch[2].trim(); // Start with the full task text after checkbox

            // --- Extract Metadata Iteratively ---
            let id: string | null = null;
            let contexts: string[] = [];
            let assignedPersons: string[] = [];
            let startDate: string | null = null;
            let dueDate: string | null = null;
            let scheduledDate: string | null = null;
            let startTime: string | null = null;
            let endTime: string | null = null;
            let duration: string | null = null;
            let week: string | null = null;
            let dependsOn: string | null = null;
            let priority: Task['priority'] = null;
            let tags: string[] = []; // All tags including cx/px

            // Helper to extract and remove match from text
            const extract = (regex: RegExp, isGlobal = false): string[] | string | null => {
                if (isGlobal) {
                    const matches = Array.from(remainingText.matchAll(regex));
                    if (matches.length > 0) {
                        remainingText = remainingText.replace(regex, '').trim();
                        return matches.map(m => m[1]); // Return array of captured groups
                    }
                    return [];
                } else {
                    const match = remainingText.match(regex);
                    if (match) {
                        remainingText = remainingText.replace(regex, '').trim();
                        return match[1]; // Return the captured group
                    }
                    return null;
                }
            };

            // Extract in a specific order (e.g., ID last, tags early)
            tags = getAllTagsFromLine(remainingText); // Get all tags first
            contexts = tags.filter(t => t.startsWith('#cx-'));
            assignedPersons = tags.filter(t => t.startsWith('#px-'));

            startDate = extract(startDateRegex) as string | null;
            dueDate = extract(dueDateRegex) as string | null;
            scheduledDate = extract(scheduledDateRegex) as string | null;
            startTime = extract(startTimeRegex) as string | null;
            endTime = extract(endTimeRegex) as string | null;
            duration = extract(durationRegex) as string | null;
            week = extract(weekRegex) as string | null;
            dependsOn = extract(dependsOnRegex) as string | null;

            const prioritySymbol = extract(priorityRegex) as string | null;
            if (prioritySymbol) {
                switch (prioritySymbol) {
                    case '⏫': priority = 'highest'; break;
                    case '🔼': priority = 'high'; break;
                    case '🔽': priority = 'low'; break;
                    case '⏬': priority = 'lowest'; break;
                }
            }

            // ID is usually last
            id = extract(idRegex) as string | null;

            // The remainingText now holds the core task description
            const coreTaskText = remainingText;

            tasks.push({
                id: id,
                rawLineNumber: index,
                rawLineText: line,
                text: coreTaskText, // Use the final text after removing metadata
                status: status,
                tags: tags,
                contexts: contexts,
                assignedPersons: assignedPersons,
                startDate: startDate,
                dueDate: dueDate,
                scheduledDate: scheduledDate,
                startTime: startTime,
                endTime: endTime,
                duration: duration,
                week: week,
                dependsOn: dependsOn,
                priority: priority,
                // conflicts will be determined later
            });
        }
    });

    return tasks;
}

// --- Helper Functions (Placeholders - Need Implementation) ---

function getAllTagsFromLine(line: string): string[] {
    // Placeholder: Use Obsidian's getAllTags or a regex to find all #tags
    // Needs access to app.metadataCache potentially or a robust regex
    const tagRegex = /#([a-zA-Z0-9_\-\/]+)/g;
    const matches = line.matchAll(tagRegex);
    return Array.from(matches, m => `#${m[1]}`);
}

// Add more helper functions as needed for parsing dates, times, etc.
