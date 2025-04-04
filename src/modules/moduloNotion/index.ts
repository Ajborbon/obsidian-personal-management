import { Notice } from "obsidian"; // Import Notice
import ManagementPlugin from "../../main"; // Adjust path as needed
import { NotionApi } from "./api";
// Removed NotionSettings import
import { NotionMapper } from "./mapper";

// Define the structure for Notion settings (Moved from settings.ts)
export interface NotionModuleSettings {
    notionApiKey: string;
    campaignDbId: string;
    deliverableDbId: string;
    notionSubdomain: string;
}

// Define the default values for Notion settings (Moved from settings.ts)
export const DEFAULT_NOTION_SETTINGS: NotionModuleSettings = {
    notionApiKey: '',
    campaignDbId: '',
    deliverableDbId: '',
    notionSubdomain: '',
};

export class ModuloNotion {
    plugin: ManagementPlugin;
    // Removed settings property: settings: NotionSettings;
    api: NotionApi;
    mapper: NotionMapper;
    isLoaded: boolean = false;

    constructor(plugin: ManagementPlugin) {
        this.plugin = plugin;
        // Removed NotionSettings instantiation
        // Pass the settings object directly to API constructor
        this.api = new NotionApi(this.plugin, this.getNotionSettings());
        this.mapper = new NotionMapper(this.plugin);
        console.log("ModuloNotion: Constructor called");
    }

    // Helper to get notion settings from main plugin settings
    private getNotionSettings(): NotionModuleSettings {
        // Ensure notionSettings exists on the main settings object
        if (!this.plugin.settings?.notionSettings) {
             console.warn("ModuloNotion: notionSettings not found on main plugin settings. Using defaults.");
             // Initialize it if missing (should be handled by main plugin load)
             if (this.plugin.settings) {
                 this.plugin.settings.notionSettings = { ...DEFAULT_NOTION_SETTINGS };
             } else {
                 // This case should ideally not happen if main.ts loads settings correctly
                 return { ...DEFAULT_NOTION_SETTINGS };
             }
        }
        // Merge with defaults to ensure all properties are present
        return { ...DEFAULT_NOTION_SETTINGS, ...this.plugin.settings.notionSettings };
    }

    async load() {
        // console.log("ModuloNotion: Attempting to load..."); // Optional: Keep for basic load confirmation
        try {
            // Settings are now loaded by the main plugin, just access them
            const currentSettings = this.getNotionSettings();
            // console.log("ModuloNotion: Settings accessed in ModuloNotion.load():", JSON.stringify(currentSettings)); // Remove debug log
            // Re-initialize API client with potentially updated settings
            this.api.initializeClient(currentSettings); // Pass settings to initializer
            this.registerCommands();
            this.isLoaded = true;
            console.log("ModuloNotion: Loaded successfully");
        } catch (error) {
             console.error("ModuloNotion: Error during load():", error);
             this.isLoaded = false;
        }
    }

    unload() {
        // Clean up resources, remove commands if necessary
        this.isLoaded = false;
        console.log("ModuloNotion: Unloaded");
    }

    registerCommands() {
        console.log("ModuloNotion: Registering commands...");

        this.plugin.addCommand({
            id: 'notion-send-to-campaign',
            name: 'Notion: Enviar nota a BD Campañas',
            // Restore original check: Module loaded, file active, API key and DB ID set
            checkCallback: (checking: boolean) => {
                const activeFile = this.plugin.app.workspace.getActiveFile();
                const settings = this.getNotionSettings(); // Use helper
                if (this.isLoaded && activeFile && settings.notionApiKey && settings.campaignDbId) {
                    // console.log("ModuloNotion: CheckCallback for Campaign command passed."); // Optional: remove debug log
                    if (!checking) {
                         // Settings are already checked by the outer if condition
                        this.sendNoteToNotion('campaign');
                    }
                    return true;
                }
                return false;
            },
        });

        this.plugin.addCommand({
            id: 'notion-send-to-deliverable',
            name: 'Notion: Enviar nota a BD Entregables',
             // Restore original check: Module loaded, file active, API key and DB ID set
            checkCallback: (checking: boolean) => {
                const activeFile = this.plugin.app.workspace.getActiveFile();
                const settings = this.getNotionSettings(); // Use helper
                if (this.isLoaded && activeFile && settings.notionApiKey && settings.deliverableDbId) {
                    // console.log("ModuloNotion: CheckCallback for Deliverable command passed."); // Optional: remove debug log
                    if (!checking) {
                         // Settings are already checked by the outer if condition
                        this.sendNoteToNotion('deliverable');
                    }
                    return true;
                }
                return false;
            },
        });
         console.log("ModuloNotion: Commands registered.");
    }

    async sendNoteToNotion(databaseType: 'campaign' | 'deliverable') {
        const activeFile = this.plugin.app.workspace.getActiveFile();
        if (!activeFile) {
            new Notice("No hay archivo activo para enviar a Notion."); // Use Notice directly
            return;
        }

        console.log(`ModuloNotion: Sending note "${activeFile.basename}" to ${databaseType} DB.`);
        new Notice(`Enviando "${activeFile.basename}" a Notion (${databaseType})...`); // Use Notice directly

        try {
            const fileContent = await this.plugin.app.vault.cachedRead(activeFile);
            const fileCache = this.plugin.app.metadataCache.getFileCache(activeFile);
            const frontmatter = fileCache?.frontmatter ?? {};
            const notionSettings = this.getNotionSettings(); // Get current settings

            let properties;
            let databaseId;

            if (databaseType === 'campaign') {
                properties = this.mapper.mapToCampaignProperties(activeFile.basename, frontmatter, fileContent);
                databaseId = notionSettings.campaignDbId; // Use settings from helper
            } else { // deliverable
                properties = this.mapper.mapToDeliverableProperties(activeFile.basename, frontmatter, fileContent);
                databaseId = notionSettings.deliverableDbId; // Use settings from helper
             }

             if (!databaseId) {
                 new Notice(`Error: ID de la base de datos de ${databaseType} no configurado.`); // Use Notice directly
                 console.error(`ModuloNotion: Database ID for ${databaseType} is not set.`);
                 return;
             }

            const response = await this.api.createPage(databaseId, properties);

            // Check if the response is valid and contains an ID and URL
            // Also check if it has properties to extract the title
            if (response && response.id && response.url && response.properties) {
                 const pageId = response.id;
                 const internalUrl = response.url; // This is the notion.so URL
                 const noticeMessage = `¡Nota "${activeFile.basename}" enviada a Notion!`;
                 new Notice(noticeMessage); // Use Notice directly
                 console.log(`ModuloNotion: Note sent successfully. Notion Page ID: ${pageId}, Internal URL: ${internalUrl}`);

                 // --- Generate Public URL using Subdomain Replacement ---
                 let publicUrl = internalUrl; // Default to internal URL
                 const subdomain = notionSettings.notionSubdomain; // Use settings from helper
                 // console.log(`ModuloNotion: Retrieved subdomain setting: "${subdomain}"`); // Remove debug log
                 if (subdomain) {
                     try {
                         // Replace www.notion.so with <subdomain>.notion.site
                         publicUrl = internalUrl.replace("www.notion.so", `${subdomain}.notion.site`);
                         console.log(`ModuloNotion: Generated Public URL by replacement: ${publicUrl}`);
                     } catch (replaceError) {
                          console.error("ModuloNotion: Error replacing subdomain for public URL:", replaceError);
                          publicUrl = internalUrl; // Fallback to internal URL on error
                     }
                 } else {
                     console.warn("ModuloNotion: notionSubdomain setting is empty. Public URL will be the same as internal URL.");
                 }
                 // --- End Public URL Generation ---


                 // --- Update Obsidian Note Frontmatter ---
                 try {
                     await this.plugin.app.fileManager.processFrontMatter(activeFile, (fm: Record<string, any>) => { // Add type for fm
                         const notionIdKey = `NotionID-${databaseType}`;
                         const linkKey = `link-${databaseType}`; // Public URL
                         const notionLinkKey = `NotionLink-${databaseType}`; // Internal Notion URL
                         // publicUrl now holds the potentially modified URL
                         // console.log(`ModuloNotion: Assigning to frontmatter - ${linkKey}: "${publicUrl}", ${notionLinkKey}: "${internalUrl}"`); // Remove debug log

                         fm[notionIdKey] = pageId;
                         fm[linkKey] = publicUrl; // Assign the generated public URL (or fallback internal)
                         fm[notionLinkKey] = internalUrl; // Assign the original internal URL

                         console.log(`ModuloNotion: Updated frontmatter for ${activeFile.basename} with keys: ${notionIdKey}, ${linkKey}, ${notionLinkKey}`);
                     });
                     new Notice(`Frontmatter de "${activeFile.basename}" actualizado con datos de Notion.`);
                 } catch (frontmatterError) {
                     console.error(`ModuloNotion: Error updating frontmatter for ${activeFile.basename}:`, frontmatterError);
                     new Notice(`Error al actualizar frontmatter para "${activeFile.basename}".`);
                 }
                 // --- End Frontmatter Update ---

            } else {
                 // Log the actual response if it's unexpected
                 console.error("ModuloNotion: Invalid response from Notion API:", response);
                 // Check if response exists before trying to access properties
                 const errorDetails = response ? `ID: ${response.id}, URL: ${response.url}, Properties: ${!!response.properties}` : 'Response is null or undefined';
                 throw new Error(`La respuesta de la API de Notion no es válida. Details: ${errorDetails}`);
            }

        } catch (error) {
            // Notice is already shown in api.ts if createPage fails
            console.error("ModuloNotion: Error sending note to Notion:", error);
        }
    }

    // Removed showNotice helper as we use `new Notice()` directly
}
