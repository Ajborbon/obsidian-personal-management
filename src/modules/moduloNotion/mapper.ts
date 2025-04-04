import ManagementPlugin from "../../main"; // Adjust path as needed
import type { CreatePageParameters, DatePropertyItemObjectResponse } from "@notionhq/client/build/src/api-endpoints"; // Import DatePropertyItemObjectResponse

// Type alias for Notion properties object
type NotionProperties = CreatePageParameters["properties"];

export class NotionMapper {
    plugin: ManagementPlugin;

    constructor(plugin: ManagementPlugin) {
        this.plugin = plugin;
        console.log("NotionMapper: Constructor called");
    }

    // --- Mapping for "Campañas" Database ---
    mapToCampaignProperties(noteTitle: string, frontmatter: any, noteContent: string): NotionProperties {
        const properties: NotionProperties = {};

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
    mapToDeliverableProperties(noteTitle: string, frontmatter: any, noteContent: string): NotionProperties {
        const properties: NotionProperties = {};

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
        // ... (formatDate implementation remains the same) ...
        if (!dateInput) return null;

        // Basic date parsing (adjust as needed)
        try {
            let date: Date | null = null;
            if (dateInput instanceof Date) {
                date = dateInput;
            } else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
                 // Attempt to parse common formats
                 date = new Date(dateInput);
            }

            if (date && !isNaN(date.getTime())) {
                 // Format to YYYY-MM-DD
                 const year = date.getFullYear();
                 const month = (date.getMonth() + 1).toString().padStart(2, '0');
                 const day = date.getDate().toString().padStart(2, '0');
                 return `${year}-${month}-${day}`;
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
}
