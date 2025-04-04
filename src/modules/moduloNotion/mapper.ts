import ManagementPlugin from "../../main"; // Adjust path as needed
import type {
    CreatePageParameters,
    DatePropertyItemObjectResponse,
    AppendBlockChildrenParameters,
    PageObjectResponse, // Import PageObjectResponse for properties
    BlockObjectResponse, // Import BlockObjectResponse for blocks
    PartialBlockObjectResponse, // Import PartialBlockObjectResponse
    RichTextItemResponse // Import RichTextItemResponse
} from "@notionhq/client/build/src/api-endpoints";

// Type alias for Notion properties object (for sending)
type NotionPropertiesSend = CreatePageParameters["properties"];
// Type alias for Notion properties object (received)
type NotionPropertiesReceive = PageObjectResponse["properties"];
// Type alias for Notion blocks array
export type NotionBlocks = AppendBlockChildrenParameters["children"]; // <-- Added export

export class NotionMapper {
    plugin: ManagementPlugin;

    constructor(plugin: ManagementPlugin) {
        this.plugin = plugin;
        console.log("NotionMapper: Constructor called");
    }

    // --- Mapping Obsidian Frontmatter -> Notion Properties ---

    // --- Mapping for "Campañas" Database ---
    mapToCampaignProperties(noteTitle: string, frontmatter: any, noteContent: string): NotionPropertiesSend {
        const properties: NotionPropertiesSend = {};

        // 1. nombre (Title) - Use note title as default, allow override from frontmatter
        properties['nombre'] = {
            title: [{ text: { content: frontmatter.nombre || noteTitle } }]
        };

        // 2. fechainicio (Date)
        if (frontmatter.fechainicio) {
            const startDate = this.formatDate(frontmatter.fechainicio);
            if (startDate) {
                properties['fechainicio'] = { date: { start: startDate } };
            } else {
                 console.warn(`NotionMapper: Invalid date format for 'fechainicio': ${frontmatter.fechainicio}`);
            }
        }

        // 3. fechaFin (Date)
        if (frontmatter.fechaFin) {
             const endDate = this.formatDate(frontmatter.fechaFin);
             if (endDate) {
                 const fechainicioProp = properties['fechainicio'];
                 // Use a type guard to check if fechainicio is a date property
                 if (this.isDateProperty(fechainicioProp) && fechainicioProp.date?.start) {
                     fechainicioProp.date.end = endDate;
                 } else {
                     // Otherwise, just set fechaFin (assuming Notion DB has separate start/end or just uses start)
                     // Adjust if your Notion DB expects fechaFin in a specific property
                     properties['fechaFin'] = { date: { start: endDate } }; // Or adjust property name if needed
                 }
             } else {
                  console.warn(`NotionMapper: Invalid date format for 'fechaFin': ${frontmatter.fechaFin}`);
             }
        }

        // 4. prioridad (Select)
        if (frontmatter.prioridad) {
            properties['prioridad'] = { select: { name: String(frontmatter.prioridad) } };
        }

        // 5. indicadores (URL)
        if (frontmatter.indicadores) {
            properties['indicadores'] = { url: String(frontmatter.indicadores) };
        }

        // 6. estadoC (Status)
        if (frontmatter.estadoC) {
            properties['estadoC'] = { status: { name: String(frontmatter.estadoC) } };
        }

        // Add other mappings as needed

        console.log("NotionMapper: Mapped Campaign Properties:", properties);
        return properties;
    }

    // --- Mapping for "Entregables" Database ---
    mapToDeliverableProperties(noteTitle: string, frontmatter: any, noteContent: string): NotionPropertiesSend {
        const properties: NotionPropertiesSend = {};

        // 1. tarea (Title)
        properties['tarea'] = {
            title: [{ text: { content: frontmatter.tarea || noteTitle } }]
        };

        // 2. tipo (Select)
        if (frontmatter.tipo) {
            properties['tipo'] = { select: { name: String(frontmatter.tipo) } };
        }

        // 3. canales (Multi-Select)
        if (frontmatter.canales) {
            const canalesArray = Array.isArray(frontmatter.canales) ? frontmatter.canales : String(frontmatter.canales).split(',').map((s: string) => s.trim()); // Explicit type for s
            properties['canales'] = { multi_select: canalesArray.map((name: string) => ({ name: String(name) })) }; // Explicit type for name
        }

        // 4. estadoE (Status)
        if (frontmatter.estadoE) {
            properties['estadoE'] = { status: { name: String(frontmatter.estadoE) } };
        }

        // 5. prioridad (Select)
        if (frontmatter.prioridad) {
            properties['prioridad'] = { select: { name: String(frontmatter.prioridad) } };
        }

        // 6. publicacion (Date)
        if (frontmatter.publicacion) {
             const pubDate = this.formatDate(frontmatter.publicacion);
             if (pubDate) {
                 properties['publicacion'] = { date: { start: pubDate } };
             } else {
                  console.warn(`NotionMapper: Invalid date format for 'publicacion': ${frontmatter.publicacion}`);
             }
        }

        // 7. piezaNube (URL)
        if (frontmatter.piezaNube) {
            properties['piezaNube'] = { url: String(frontmatter.piezaNube) };
        }

        // 8. urlCanva (URL)
        if (frontmatter.urlCanva) {
            properties['urlCanva'] = { url: String(frontmatter.urlCanva) };
        }

        // 9. hits (Number)
        if (frontmatter.hits !== undefined && frontmatter.hits !== null) {
             const hitsNumber = Number(frontmatter.hits);
             if (!isNaN(hitsNumber)) {
                properties['hits'] = { number: hitsNumber };
             } else {
                 console.warn(`NotionMapper: Invalid number format for 'hits': ${frontmatter.hits}`);
             }
        }

        // 10. pedidosAlCliente (Text - Rich Text)
        if (frontmatter.pedidosAlCliente) {
            properties['pedidosAlCliente'] = { rich_text: [{ text: { content: String(frontmatter.pedidosAlCliente) } }] };
        }

        // 11. pendientesCliente (Checkbox)
        if (frontmatter.pendientesCliente !== undefined && frontmatter.pendientesCliente !== null) {
            properties['pendientesCliente'] = { checkbox: Boolean(frontmatter.pendientesCliente) };
        }

        // 12. proyecto (Relation)
        // Relation requires the ID of the related page in the other database.
        // How will you provide this ID in the Obsidian note's frontmatter?
        // Assuming frontmatter.proyecto contains the Notion Page ID(s) as a string or array of strings.
        if (frontmatter.proyecto) {
            const relationIds = Array.isArray(frontmatter.proyecto) ? frontmatter.proyecto : [String(frontmatter.proyecto)];
            properties['proyecto'] = { relation: relationIds.map((id: string) => ({ id: String(id).trim() })) }; // Explicit type for id
        }

        // Add note content mapping here if needed (e.g., map to Notion blocks)

        console.log("NotionMapper: Mapped Deliverable Properties:", properties);
        return properties;
    }

    // --- Helper Functions ---

    /**
     * Formats a date string/object into 'YYYY-MM-DD' format for Notion API.
     * Handles various potential input formats from frontmatter.
     * @param dateInput - The date value from frontmatter (string, Date object, Luxon DateTime).
     * @returns ISO date string (YYYY-MM-DD) or null if invalid.
     */
    private formatDate(dateInput: any): string | null {
        if (!dateInput) return null;

        try {
            let dateStr = '';
            if (dateInput instanceof Date) {
                // If it's already a Date object, format it directly using UTC methods
                const year = dateInput.getUTCFullYear();
                const month = (dateInput.getUTCMonth() + 1).toString().padStart(2, '0');
                const day = dateInput.getUTCDate().toString().padStart(2, '0');
                return `${year}-${month}-${day}`;
            } else if (typeof dateInput === 'string') {
                dateStr = dateInput.trim();
                // Check if it's already in YYYY-MM-DD format
                if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                    // Assume it's correct and pass it through.
                    // We treat YYYY-MM-DD strings as representing the date in UTC.
                    return dateStr;
                }
                // If not YYYY-MM-DD, try parsing by appending UTC time.
                // This treats the input date string as UTC midnight.
                const date = new Date(dateStr + 'T00:00:00Z');
                 if (date && !isNaN(date.getTime())) {
                    const year = date.getUTCFullYear();
                    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
                    const day = date.getUTCDate().toString().padStart(2, '0');
                    return `${year}-${month}-${day}`;
                 }

            } else if (typeof dateInput === 'number') {
                 // Assuming it's a timestamp, create Date object and use UTC methods
                 const date = new Date(dateInput);
                 if (date && !isNaN(date.getTime())) {
                    const year = date.getUTCFullYear();
                    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
                    const day = date.getUTCDate().toString().padStart(2, '0');
                    return `${year}-${month}-${day}`;
                 }
            }

        } catch (error) {
             console.error(`NotionMapper: Error formatting date: ${dateInput}`, error);
        }

        console.warn(`NotionMapper: Could not format date: ${dateInput}`);
        return null;
    }

    /**
     * Type guard to check if a property object is a Notion Date property value.
     */
    private isDateProperty(prop: any): prop is { date: { start: string; end?: string | null } } {
        return typeof prop === 'object' && prop !== null && 'date' in prop && typeof prop.date === 'object' && prop.date !== null;
    }

    // --- Content Mapping ---

    /**
     * Converts Markdown content string into an array of Notion blocks.
     * Basic implementation: Splits by double newline into paragraphs.
     * @param markdownContent - The Markdown content of the note.
     * @returns An array of Notion blocks.
     */
    mapContentToBlocks(markdownContent: string): NotionBlocks {
        if (!markdownContent) {
            return [];
        }

        const blocks: NotionBlocks = [];
        const lines = markdownContent.split('\n'); // Split by single newline

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine === '') {
                // Create an empty paragraph block for empty lines
                blocks.push({
                    object: 'block',
                    type: 'paragraph',
                    paragraph: {
                        rich_text: [] // Empty rich_text array for empty line
                    }
                });
            } else {
                // Create a paragraph block with the line content
                blocks.push({
                    object: 'block',
                    type: 'paragraph', // Keep only one 'type' property
                    paragraph: {
                        rich_text: [{
                            type: 'text',
                            text: {
                                content: line, // Use the original line content, preserving leading/trailing spaces? Or trimmedLine? Let's use 'line' for now.
                            },
                        }],
                    },
                });
            }
        }
        // Remove potential trailing empty block if the original text ended with newlines?
        // Or keep it to represent the trailing newlines? Let's keep it for now.

        console.log(`NotionMapper: Mapped content to ${blocks.length} blocks.`);
        return blocks;
    }


    // --- Mapping Notion -> Obsidian ---

    /**
     * Converts an array of Notion blocks into a Markdown string.
     * Basic implementation: Handles paragraphs.
     * @param blocks - Array of Notion BlockObjectResponse or PartialBlockObjectResponse.
     * @returns Markdown string representation.
     */
    mapNotionBlocksToMarkdown(blocks: (BlockObjectResponse | PartialBlockObjectResponse)[]): string {
        let markdown = "";
        for (const block of blocks) {
            // Ensure it's a full block response before accessing type-specific properties
            if (!('type' in block)) continue;

            switch (block.type) {
                case 'paragraph':
                    const paragraphText = block.paragraph.rich_text.map(rt => rt.plain_text).join('');
                    if (paragraphText.trim() === '') {
                        // If the paragraph block is effectively empty, represent it as a single empty line
                        markdown += "\n";
                    } else {
                        // Otherwise, add the text and a single newline
                        markdown += paragraphText + "\n";
                    }
                    break;
                // TODO: Add cases for other block types (headings, lists, code, etc.) preserving single newlines
                // case 'heading_1':
                //     markdown += `# ${block.heading_1.rich_text.map(rt => rt.plain_text).join('')}\n`; // Single newline
                //     markdown += `# ${block.heading_1.rich_text.map(rt => rt.plain_text).join('')}\n\n`;
                //     break;
                // case 'bulleted_list_item':
                //     markdown += `* ${block.bulleted_list_item.rich_text.map(rt => rt.plain_text).join('')}\n`; // Needs proper list handling
                //     break;
                default:
                    // For unsupported blocks, maybe add a placeholder or log it
                    console.warn(`NotionMapper: Unsupported block type "${block.type}" encountered during Markdown conversion.`);
                    // Optionally add raw JSON as a comment or placeholder:
                    // markdown += `<!-- Unsupported block type: ${block.type} -->\n\n`;
                    break;
            }
        }
        // Return the raw markdown, preserving leading/trailing newlines if they resulted from empty blocks
        return markdown;
    }

    /**
     * Converts Notion page properties into an Obsidian frontmatter object.
     * @param notionProperties - The properties object from a Notion PageObjectResponse.
     * @param databaseType - 'campaign' or 'deliverable' to determine mapping.
     * @returns An object representing Obsidian frontmatter.
     */
    mapNotionPropertiesToFrontmatter(notionProperties: NotionPropertiesReceive, databaseType: 'campaign' | 'deliverable'): Record<string, any> {
        const frontmatter: Record<string, any> = {};

        if (databaseType === 'campaign') {
            // Map Campaign properties back
            this.mapNotionProperty(notionProperties, 'nombre', frontmatter, 'nombre', 'title');
            this.mapNotionProperty(notionProperties, 'fechainicio', frontmatter, 'fechainicio', 'date');
            this.mapNotionProperty(notionProperties, 'fechaFin', frontmatter, 'fechaFin', 'date'); // Note: Notion might store start/end in one prop
            this.mapNotionProperty(notionProperties, 'prioridad', frontmatter, 'prioridad', 'select');
            this.mapNotionProperty(notionProperties, 'indicadores', frontmatter, 'indicadores', 'url');
            this.mapNotionProperty(notionProperties, 'estadoC', frontmatter, 'estadoC', 'status');

        } else { // deliverable
            // Map Deliverable properties back
            this.mapNotionProperty(notionProperties, 'tarea', frontmatter, 'tarea', 'title');
            this.mapNotionProperty(notionProperties, 'tipo', frontmatter, 'tipo', 'select');
            this.mapNotionProperty(notionProperties, 'canales', frontmatter, 'canales', 'multi_select');
            this.mapNotionProperty(notionProperties, 'estadoE', frontmatter, 'estadoE', 'status');
            this.mapNotionProperty(notionProperties, 'prioridad', frontmatter, 'prioridad', 'select');
            this.mapNotionProperty(notionProperties, 'publicacion', frontmatter, 'publicacion', 'date');
            this.mapNotionProperty(notionProperties, 'piezaNube', frontmatter, 'piezaNube', 'url');
            this.mapNotionProperty(notionProperties, 'urlCanva', frontmatter, 'urlCanva', 'url');
            this.mapNotionProperty(notionProperties, 'hits', frontmatter, 'hits', 'number');
            this.mapNotionProperty(notionProperties, 'pedidosAlCliente', frontmatter, 'pedidosAlCliente', 'rich_text');
            this.mapNotionProperty(notionProperties, 'pendientesCliente', frontmatter, 'pendientesCliente', 'checkbox');
            this.mapNotionProperty(notionProperties, 'proyecto', frontmatter, 'proyecto', 'relation');
        }

        console.log("NotionMapper: Mapped Notion Properties to Frontmatter:", frontmatter);
        return frontmatter;
    }

    /**
     * Helper to safely extract and map a single Notion property to a frontmatter key.
     */
    private mapNotionProperty(
        notionProperties: NotionPropertiesReceive,
        notionKey: string,
        frontmatter: Record<string, any>,
        fmKey: string,
        notionType: NotionPropertiesReceive[string]['type']
    ) {
        const prop = notionProperties[notionKey];
        if (!prop || prop.type !== notionType) {
            // console.warn(`NotionMapper: Property "${notionKey}" not found or type mismatch (expected ${notionType}, got ${prop?.type}).`);
            return; // Skip if property doesn't exist or type doesn't match
        }

        try {
            switch (prop.type) {
                case 'title':
                    frontmatter[fmKey] = prop.title.map(rt => rt.plain_text).join('') || null;
                    break;
                case 'rich_text':
                    frontmatter[fmKey] = prop.rich_text.map(rt => rt.plain_text).join('') || null;
                    break;
                case 'number':
                    frontmatter[fmKey] = prop.number; // Can be null
                    break;
                case 'select':
                    frontmatter[fmKey] = prop.select?.name || null;
                    break;
                case 'multi_select':
                    frontmatter[fmKey] = prop.multi_select.map(s => s.name); // Array of strings
                    break;
                case 'status':
                    frontmatter[fmKey] = prop.status?.name || null;
                    break;
                case 'date':
                    // Return only the start date for simplicity, Notion might have start/end
                    frontmatter[fmKey] = prop.date?.start || null;
                    // If you need end date too, you might store it as a separate fm key or an object
                    // if (prop.date?.end) frontmatter[`${fmKey}_end`] = prop.date.end;
                    break;
                case 'checkbox':
                    frontmatter[fmKey] = prop.checkbox;
                    break;
                case 'url':
                    frontmatter[fmKey] = prop.url; // Can be null
                    break;
                case 'relation':
                    // Store array of related page IDs
                    frontmatter[fmKey] = prop.relation.map(r => r.id);
                    break;
                // Add cases for other types as needed (email, phone_number, files, created_by, etc.)
                default:
                    console.warn(`NotionMapper: Unhandled Notion property type "${prop.type}" for key "${notionKey}".`);
            }
        } catch (error) {
             console.error(`NotionMapper: Error mapping Notion property "${notionKey}" (type ${prop.type}) to frontmatter key "${fmKey}":`, error);
        }
    }

    /**
     * Returns a list of Obsidian frontmatter keys that are mapped to Notion properties
     * for the specified database type.
     * @param databaseType - 'campaign' or 'deliverable'.
     * @returns Array of relevant frontmatter keys.
     */
    getMappedFrontmatterKeys(databaseType: 'campaign' | 'deliverable'): string[] {
        if (databaseType === 'campaign') {
            // Exclude 'nombre' as it maps to the filename, not frontmatter
            return [
                // 'nombre',
                'fechainicio',
                'fechaFin',
                'prioridad',
                'indicadores',
                'estadoC'
            ];
        } else { // deliverable
             // Exclude 'tarea' as it maps to the filename, not frontmatter
            return [
                // 'tarea',
                'tipo',
                'canales',
                'estadoE',
                'prioridad',
                'publicacion',
                'piezaNube',
                'urlCanva',
                'hits',
                'pedidosAlCliente',
                'pendientesCliente',
                'proyecto'
            ];
        }
    }
}
