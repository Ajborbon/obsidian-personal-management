import { Notice, Modal, TFile, App } from "obsidian"; // Import Modal, TFile, App
import ManagementPlugin from "../../main"; // Adjust path as needed
import { NotionApi } from "./api.js";
import { NotionMapper } from "./mapper.js";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints"; // Import PageObjectResponse

// Define the structure for Notion settings (Moved from settings.ts)
export interface NotionModuleSettings {
    notionApiKey: string;
    campaignDbId: string;
    deliverableDbId: string;
    notionSubdomain: string;
    notionUser: string;
}

// Define the default values for Notion settings (Moved from settings.ts)
export const DEFAULT_NOTION_SETTINGS: NotionModuleSettings = {
    notionApiKey: '',
    campaignDbId: '',
    deliverableDbId: '',
    notionSubdomain: '',
    notionUser: '',
};

export class ModuloNotion {
    plugin: ManagementPlugin;
    api: NotionApi;
    mapper: NotionMapper;
    isLoaded: boolean = false;

    constructor(plugin: ManagementPlugin) {
        this.plugin = plugin;
        this.api = new NotionApi(this.plugin, this.getNotionSettings());
        this.mapper = new NotionMapper(this.plugin);
        console.log("ModuloNotion: Constructor called");
    }

    // Helper to get notion settings from main plugin settings
    private getNotionSettings(): NotionModuleSettings {
        if (!this.plugin.settings?.notionSettings) {
             console.warn("ModuloNotion: notionSettings not found on main plugin settings. Using defaults.");
             if (this.plugin.settings) {
                 this.plugin.settings.notionSettings = { ...DEFAULT_NOTION_SETTINGS };
             } else {
                 return { ...DEFAULT_NOTION_SETTINGS };
             }
        }
        return { ...DEFAULT_NOTION_SETTINGS, ...this.plugin.settings.notionSettings };
    }

    async load() {
        try {
            const currentSettings = this.getNotionSettings();
            this.api.initializeClient(currentSettings);
            this.registerCommands();
            this.isLoaded = true;
            console.log("ModuloNotion: Loaded successfully");
        } catch (error) {
             console.error("ModuloNotion: Error during load():", error);
             this.isLoaded = false;
        }
    }

    unload() {
        this.isLoaded = false;
        console.log("ModuloNotion: Unloaded");
    }

    registerCommands() {
        console.log("ModuloNotion: Registering commands...");

        this.plugin.addCommand({
            id: 'notion-send-to-campaign',
            name: 'Notion: Enviar nota a BD Campañas',
            checkCallback: (checking: boolean) => {
                const activeFile = this.plugin.app.workspace.getActiveFile();
                const settings = this.getNotionSettings();
                if (this.isLoaded && activeFile && settings.notionApiKey && settings.campaignDbId) {
                    if (!checking) {
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
            checkCallback: (checking: boolean) => {
                const activeFile = this.plugin.app.workspace.getActiveFile();
                const settings = this.getNotionSettings();
                if (this.isLoaded && activeFile && settings.notionApiKey && settings.deliverableDbId) {
                    if (!checking) {
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
            new Notice("No hay archivo activo para enviar a Notion.");
            return;
        }

        console.log(`ModuloNotion: Processing note "${activeFile.basename}" for ${databaseType} DB.`);

        try {
            const fileContent = await this.plugin.app.vault.cachedRead(activeFile);
            const fileCache = this.plugin.app.metadataCache.getFileCache(activeFile);
            const obsidianFrontmatter = fileCache?.frontmatter ?? {};
            const notionSettings = this.getNotionSettings();

            let propertiesToSend;
            let databaseId;
            const titlePropertyKey = databaseType === 'campaign' ? 'nombre' : 'tarea'; // Key for Notion title property

            if (databaseType === 'campaign') {
                propertiesToSend = this.mapper.mapToCampaignProperties(activeFile.basename, obsidianFrontmatter, fileContent);
                databaseId = notionSettings.campaignDbId;
            } else {
                propertiesToSend = this.mapper.mapToDeliverableProperties(activeFile.basename, obsidianFrontmatter, fileContent);
                databaseId = notionSettings.deliverableDbId;
             }

             if (!databaseId) {
                 new Notice(`Error: ID de la base de datos de ${databaseType} no configurado.`);
                 console.error(`ModuloNotion: Database ID for ${databaseType} is not set.`);
                 return;
             }

            const notionIdKey = `NotionID-${databaseType}`;
            const existingPageId = obsidianFrontmatter[notionIdKey];
            console.log(`ModuloNotion: Checking for existing page ID using key "${notionIdKey}". Found: ${existingPageId}`);

            // --- Filter Obsidian Content ---
            const contentStartIndex = fileContent.indexOf('---', fileContent.indexOf('---') + 3);
            let noteBodyContent = contentStartIndex !== -1 ? fileContent.substring(contentStartIndex + 3) : fileContent;
            console.log("ModuloNotion: Filtering Obsidian content...");
            // Remove dataviewjs blocks first
            noteBodyContent = noteBodyContent.replace(/```dataviewjs\s*[\s\S]*?```/gs, '');
            // --- Refined Procedural Filtering Logic ---
            console.log("ModuloNotion: Starting refined procedural content filtering...");

            // 1. Remove dataviewjs blocks first
            noteBodyContent = noteBodyContent.replace(/```dataviewjs\s*[\s\S]*?```/gs, '');
            console.log("ModuloNotion: Removed dataviewjs blocks.");

            // 2. Process line by line
            const lines = noteBodyContent.split(/\r?\n/);
            const filteredLines: string[] = [];
            let isIgnoringSection = false; // True if inside ## Recursos or ## Tareas
            let ignoreRestOfFile = false;  // True once # Fin is found

            for (const line of lines) {
                const trimmedLine = line.trim();

                // Check for # Fin marker first - this stops everything
                if (trimmedLine === '# Fin') {
                    console.log("ModuloNotion: Found '# Fin' marker. Ignoring subsequent content.");
                    ignoreRestOfFile = true;
                    continue; // Stop processing this line and all future lines
                }

                // If we are already ignoring the rest of the file, stop
                if (ignoreRestOfFile) {
                    continue;
                }

                // Check if this line marks the END of an ignored section
                if (isIgnoringSection) {
                    // Does the line start with any heading (# or ##)?
                    if (trimmedLine.startsWith('#')) {
                         console.log(`ModuloNotion: Exiting ignored section upon finding heading: "${trimmedLine}"`);
                         isIgnoringSection = false;
                         // Now, re-evaluate THIS line to see if it starts a *new* ignored section
                    } else {
                        // Still inside the ignored section, skip this line
                        continue;
                    }
                }

                // Check if this line marks the START of an ignored section
                // This check runs even if we just exited an ignored section on the same line
                if (trimmedLine.startsWith('## Recursos') || trimmedLine.startsWith('## Tareas')) {
                    console.log(`ModuloNotion: Entering ignored section: "${trimmedLine}"`);
                    isIgnoringSection = true;
                    continue; // Don't include the section header line itself
                }

                // If, after all checks, we are NOT ignoring the section, add the line
                // This ensures the heading line that ended the previous section is included (unless it starts a new ignored section)
                if (!isIgnoringSection) {
                    filteredLines.push(line);
                }
            }

            // 3. Join filtered lines and trim
            const obsidianFilteredMarkdown = filteredLines.join('\n').trim();
            console.log("ModuloNotion: Refined procedural filtering complete.");
            // --- End Refined Procedural Filtering Logic ---

            // --- Create or Compare/Update Logic ---
            if (existingPageId) {
                // --- COMPARE AND UPDATE EXISTING PAGE ---
                console.log(`ModuloNotion: Comparing Obsidian note with Notion page ${existingPageId}...`);
                new Notice(`Comparando con Notion (${databaseType})...`);

                let notionPageData: PageObjectResponse | null = null;
                let notionBlocksData;
                try {
                    const pageResponse = await this.api.retrievePage(existingPageId);
                    if ('properties' in pageResponse) {
                        notionPageData = pageResponse;
                    } else {
                        throw new Error("Retrieved partial page data, cannot compare properties.");
                    }
                    notionBlocksData = await this.api.listBlockChildren(existingPageId);
                } catch (fetchError) {
                     console.error("ModuloNotion: Failed to fetch data from Notion for comparison.", fetchError);
                     new Notice("Error al obtener datos de Notion para comparar.");
                     return;
                }

                // Map Notion Data
                const notionFrontmatter = this.mapper.mapNotionPropertiesToFrontmatter(notionPageData.properties, databaseType);
                const notionMarkdown = this.mapper.mapNotionBlocksToMarkdown(notionBlocksData);

                // --- Compare Data ---
                // 1. Compare Title
                const notionTitle = notionFrontmatter[titlePropertyKey] || '';
                const obsidianTitle = activeFile.basename;
                const titleDiffers = obsidianTitle !== notionTitle;
                console.log(`ModuloNotion: Title comparison - Obsidian: "${obsidianTitle}", Notion: "${notionTitle}", Differs: ${titleDiffers}`);

                // 2. Compare Frontmatter (mapped keys only)
                const mappedKeys = this.mapper.getMappedFrontmatterKeys(databaseType);
                const relevantObsidianFm = filterKeys(obsidianFrontmatter, mappedKeys);
                const relevantNotionFm = filterKeys(notionFrontmatter, mappedKeys);

                // *** DEBUG LOG for 'publicacion' ***
                if (mappedKeys.includes('publicacion')) {
                    console.log(`DEBUG: Comparing 'publicacion':`);
                    console.log(`  Obsidian (relevantObsidianFm): Value='${relevantObsidianFm['publicacion']}', Type=${typeof relevantObsidianFm['publicacion']}`);
                    console.log(`  Notion (relevantNotionFm):   Value='${relevantNotionFm['publicacion']}', Type=${typeof relevantNotionFm['publicacion']}`);
                }
                // *** END DEBUG LOG ***

                const fmDifferences = compareFrontmatterKeys(relevantObsidianFm, relevantNotionFm, mappedKeys);
                const frontmatterDiffers = fmDifferences.length > 0;
                console.log(`ModuloNotion: Frontmatter comparison (mapped keys only) - Differs: ${frontmatterDiffers} (Keys: ${fmDifferences.join(', ')})`);

                // 3. Compare Content
                const contentDiffers = obsidianFilteredMarkdown !== notionMarkdown;
                let contentDiffSummary = "";
                if (contentDiffers) {
                    contentDiffSummary = generateContentDiffSummary(obsidianFilteredMarkdown, notionMarkdown);
                    console.log(`ModuloNotion: Content comparison - Differs: true. Summary: ${contentDiffSummary}`);
                } else {
                    console.log(`ModuloNotion: Content comparison - Differs: false.`);
                }

                // --- Ask User or Notify ---
                if (titleDiffers || frontmatterDiffers || contentDiffers) {
                    let diffSummary = "Se encontraron diferencias en: ";
                    const diffParts: string[] = [];
                    if (titleDiffers) diffParts.push(`título ("${obsidianTitle}" vs "${notionTitle}")`);
                    if (frontmatterDiffers) diffParts.push(`frontmatter (${fmDifferences.join(', ')})`);
                    if (contentDiffers) diffParts.push(`contenido ${contentDiffSummary}`);
                    diffSummary += diffParts.join(', ');
                    diffSummary += ".";

                    this.showSyncDirectionModal(
                        diffSummary,
                        async (choice: string) => {
                             if (choice === "Obsidian -> Notion") {
                                 await this.syncObsidianToNotion(existingPageId, propertiesToSend, obsidianFilteredMarkdown, activeFile, databaseType);
                             } else if (choice === "Notion -> Obsidian") {
                                 await this.syncNotionToObsidian(existingPageId, notionTitle, titleDiffers, notionFrontmatter, notionMarkdown, activeFile, databaseType);
                             } else {
                                 new Notice("Sincronización cancelada.");
                             }
                        }
                    );
                } else {
                    new Notice("No se detectaron cambios entre Obsidian y Notion.");
                }

            } else {
                // --- CREATE NEW PAGE ---
                console.log(`ModuloNotion: Creating new Notion page...`);
                new Notice(`Creando página en Notion (${databaseType})...`);
                const blocksForCreate = this.mapper.mapContentToBlocks(obsidianFilteredMarkdown);
                const response = await this.api.createPage(databaseId, propertiesToSend, blocksForCreate);

                if (response && response.id) {
                     const newPageId = response.id;
                     const internalUrl = `https://www.notion.so/${newPageId.replace(/-/g, '')}`;
                     const noticeMessage = `¡Nota "${activeFile.basename}" enviada a Notion!`;
                     new Notice(noticeMessage);
                     console.log(`ModuloNotion: New note sent successfully. Notion Page ID: ${newPageId}, Constructed Internal URL: ${internalUrl}`);

                     let publicUrl = internalUrl;
                     const subdomain = notionSettings.notionSubdomain;
                     if (subdomain) {
                         try {
                             publicUrl = internalUrl.replace("www.notion.so", `${subdomain}.notion.site`);
                             console.log(`ModuloNotion: Generated Public URL by replacement: ${publicUrl}`);
                         } catch (replaceError) {
                              console.error("ModuloNotion: Error replacing subdomain for public URL:", replaceError);
                              publicUrl = internalUrl;
                         }
                     } else {
                         console.warn("ModuloNotion: notionSubdomain setting is empty. Public URL will be the same as internal URL.");
                     }

                     try {
                         await this.plugin.app.fileManager.processFrontMatter(activeFile, (fm: Record<string, any>) => {
                             const linkKey = `link-${databaseType}`;
                             const notionLinkKey = `NotionLink-${databaseType}`;
                             fm[notionIdKey] = newPageId;
                             fm[linkKey] = publicUrl;
                             fm[notionLinkKey] = internalUrl;
                             console.log(`ModuloNotion: Updated frontmatter for ${activeFile.basename} with keys: ${notionIdKey}, ${linkKey}, ${notionLinkKey}`);
                         });
                         new Notice(`Frontmatter de "${activeFile.basename}" actualizado con datos de Notion.`);
                     } catch (frontmatterError) {
                         console.error(`ModuloNotion: Error updating frontmatter for ${activeFile.basename}:`, frontmatterError);
                         new Notice(`Error al actualizar frontmatter para "${activeFile.basename}".`);
                     }
                } else {
                     console.error("ModuloNotion: Invalid response from Notion API after createPage (expected ID):", response);
                     throw new Error(`La respuesta de la API de Notion (createPage) no contenía un ID válido.`);
                }
            } // End Create or Compare/Update block

        } catch (error) {
            console.error(`ModuloNotion: Error during sendNoteToNotion (${databaseType}):`, error);
            if (!(error instanceof Error && error.message.includes("Notion API Error"))) {
                 new Notice(`Fallo el proceso para la nota de Notion (${databaseType}). Revisa la consola.`);
            }
        }
    }

    // --- Sync Functions (Called after user choice) ---

    async syncObsidianToNotion(pageId: string, propertiesToSend: any, filteredMarkdown: string, file: TFile, dbType: string) {
        console.log(`ModuloNotion: Syncing Obsidian -> Notion for page ${pageId}`);
        new Notice(`Sincronizando Obsidian -> Notion...`);
        try {
            const blocks = this.mapper.mapContentToBlocks(filteredMarkdown);
            await this.api.updatePageProperties(pageId, propertiesToSend);
            console.log(`ModuloNotion: Properties updated for page ${pageId}.`);
            await this.api.updatePageContent(pageId, blocks);
            console.log(`ModuloNotion: Content updated for page ${pageId}.`);
            new Notice(`¡Página de Notion "${file.basename}" actualizada desde Obsidian!`);
        } catch (error) {
            console.error(`ModuloNotion: Error during Obsidian -> Notion sync for ${pageId}:`, error);
        }
    }

    async syncNotionToObsidian(
        pageId: string,
        notionTitle: string,
        titleDiffers: boolean,
        notionFrontmatter: Record<string, any>,
        notionMarkdown: string,
        file: TFile,
        dbType: string
    ) {
        console.log(`ModuloNotion: Syncing Notion -> Obsidian for page ${pageId}`);
        new Notice(`Sincronizando Notion -> Obsidian...`);
        let targetFile = file;

        try {
            // 0. Rename file if titles differ
            if (titleDiffers && notionTitle) {
                const newPath = file.path.replace(file.basename, notionTitle);
                console.log(`ModuloNotion: Renaming Obsidian file from "${file.basename}" to "${notionTitle}"`);
                try {
                    await this.plugin.app.fileManager.renameFile(file, newPath);
                    targetFile = this.plugin.app.vault.getAbstractFileByPath(newPath) as TFile;
                    if (!targetFile) throw new Error(`Failed to get new file reference after renaming to ${newPath}`);
                    new Notice(`Nota renombrada a "${notionTitle}" para coincidir con Notion.`);
                } catch (renameError) {
                    console.error(`ModuloNotion: Error renaming file to "${notionTitle}":`, renameError);
                    new Notice(`Error al renombrar la nota a "${notionTitle}".`);
                }
            }

            // 1. Update Frontmatter in Obsidian
            await this.plugin.app.fileManager.processFrontMatter(targetFile, (fm: Record<string, any>) => {
                const mappedKeys = this.mapper.getMappedFrontmatterKeys(dbType as 'campaign' | 'deliverable');
                for (const key of mappedKeys) {
                    if (notionFrontmatter.hasOwnProperty(key)) {
                         if (notionFrontmatter[key] !== null && notionFrontmatter[key] !== undefined) {
                            if (Array.isArray(notionFrontmatter[key])) fm[key] = [...notionFrontmatter[key]];
                            else fm[key] = notionFrontmatter[key];
                         } else {
                             delete fm[key];
                         }
                    } else {
                        delete fm[key];
                    }
                }
                 console.log(`ModuloNotion: Updated Obsidian frontmatter from Notion for ${targetFile.basename} (mapped keys only)`);
            });

            // 2. Update Content (Extract Preserved Sections, Use Notion Content, Append Preserved)
            console.log("ModuloNotion: Starting content update with extraction and append strategy...");
            const currentObsidianContent = await this.plugin.app.vault.read(targetFile);
            const currentContentStartIndex = currentObsidianContent.indexOf('---', currentObsidianContent.indexOf('---') + 3);
            const originalObsidianBody = currentContentStartIndex !== -1
                ? currentObsidianContent.substring(currentContentStartIndex + 3)
                : currentObsidianContent;

            // Extract preserved content (full sections including headers) using the refined helper
            const preservedDataviewBlocks = this.extractDataviewBlocks(originalObsidianBody);
            const preservedRecursosSection = this.extractSectionContent(originalObsidianBody, /^## Recursos/m);
            const preservedTareasSection = this.extractSectionContent(originalObsidianBody, /^## Tareas/m);
            const preservedFinSection = this.extractSectionContent(originalObsidianBody, /^# Fin/m);

            console.log(`ModuloNotion: Extracted ${preservedDataviewBlocks.length} dataview blocks.`);
            if (preservedRecursosSection) console.log("ModuloNotion: Extracted ## Recursos section."); else console.log("ModuloNotion: ## Recursos section not found.");
            if (preservedTareasSection) console.log("ModuloNotion: Extracted ## Tareas section."); else console.log("ModuloNotion: ## Tareas section not found.");
            if (preservedFinSection) console.log("ModuloNotion: Extracted # Fin section."); else console.log("ModuloNotion: # Fin section not found.");

            // Get and clean Notion content
            const cleanedNotionMarkdown = notionMarkdown.replace(/```dataviewjs\s*[\s\S]*?```/gs, '').trim();
            console.log("ModuloNotion: Using cleaned Notion markdown as base content.");

            // Construct the new body by appending preserved parts carefully
            const bodyParts: string[] = [cleanedNotionMarkdown]; // Start with cleaned Notion content

            if (preservedDataviewBlocks.length > 0) {
                // Add dataview blocks, ensuring separation
                bodyParts.push(preservedDataviewBlocks.join("\n\n"));
                console.log("ModuloNotion: Added preserved dataview blocks to parts array.");
            }
            if (preservedRecursosSection !== null) { // Check for null explicitly
                bodyParts.push(preservedRecursosSection);
                console.log("ModuloNotion: Added preserved ## Recursos section to parts array.");
            }
            if (preservedTareasSection !== null) { // Check for null explicitly
                bodyParts.push(preservedTareasSection);
                console.log("ModuloNotion: Added preserved ## Tareas section to parts array.");
            }
            if (preservedFinSection !== null) { // Check for null explicitly
                bodyParts.push(preservedFinSection);
                console.log("ModuloNotion: Added preserved # Fin section to parts array.");
            }

            // Join the parts with double newlines for separation, then trim final result
            let finalBodyContent = bodyParts.join("\n\n").trim();

            // Get updated frontmatter section
            const fileAfterFmUpdate = await this.plugin.app.vault.read(targetFile); // Read again after FM update
            const updatedFmStartIndex = fileAfterFmUpdate.indexOf('---', fileAfterFmUpdate.indexOf('---') + 3);
            const updatedFrontmatterSection = updatedFmStartIndex !== -1
                ? fileAfterFmUpdate.substring(0, updatedFmStartIndex + 3)
                 : "---\n---";

            // Use 'finalBodyContent' instead of 'newBody'
            const finalContent = updatedFrontmatterSection + "\n" + finalBodyContent.trim() + "\n";

            await this.plugin.app.vault.modify(targetFile, finalContent);

            console.log(`ModuloNotion: Updated Obsidian content from Notion for ${targetFile.basename}, preserving sections.`);
            new Notice(`¡Nota "${targetFile.basename}" actualizada desde Notion!`);

        } catch (error) {
            console.error(`ModuloNotion: Error during Notion -> Obsidian sync for ${pageId}:`, error);
            new Notice(`Error al sincronizar Notion -> Obsidian para "${targetFile.basename}".`);
        }
    }

    // --- Helper functions for section extraction ---

    // Extracts the content *under* a heading
    extractSection(content: string, regex: RegExp): string | null {
        const match = content.match(regex);
        if (!match || match.index === undefined) return null;
        const sectionStartMarkerEnd = match.index + match[0].length;
        const nextHeadingMatch = content.substring(sectionStartMarkerEnd).match(/^\s*#/m);
        const sectionEndIndex = nextHeadingMatch?.index !== undefined
            ? sectionStartMarkerEnd + nextHeadingMatch.index
            : content.length;
        return content.substring(sectionStartMarkerEnd, sectionEndIndex).trim();
    }

    // Extracts the *entire* section including the heading line
    extractSectionContent(content: string, sectionHeadingRegex: RegExp): string | null {
        const match = content.match(sectionHeadingRegex); // Find the start of the section (e.g., /^## Recursos/m)
        if (!match || match.index === undefined) {
            // console.log(`extractSectionContent: Heading not found for regex: ${sectionHeadingRegex}`);
            return null; // Section heading not found
        }

        const sectionStartIndex = match.index;
        // Find the index right after the starting heading's line break
        const headingLineEndMatch = content.substring(sectionStartIndex).match(/\r?\n/);
        const contentStartIndex = headingLineEndMatch ? sectionStartIndex + headingLineEndMatch[0].length + (headingLineEndMatch.index ?? 0) : content.length;

        // Find the start index of the *next* heading (# or ##) or the # Fin marker
        // Search from the position *after* the current section's heading line ends
        const nextMarkerMatch = content.substring(contentStartIndex).match(/^# |^## |^# Fin/m);

        let sectionEndIndex;
        if (nextMarkerMatch?.index !== undefined) {
            // Found the start of the next marker; end the current section right before it.
            // The index is relative to the substring starting at contentStartIndex.
            sectionEndIndex = contentStartIndex + nextMarkerMatch.index;
            // console.log(`extractSectionContent: Found next marker for ${sectionHeadingRegex} at index ${sectionEndIndex}`);
        } else {
            // No subsequent marker found; the section goes to the end of the string.
            sectionEndIndex = content.length;
            // console.log(`extractSectionContent: No next marker found for ${sectionHeadingRegex}. Section ends at content length ${sectionEndIndex}`);
        }

        // Extract the full section from its heading start to the calculated end.
        const extracted = content.slice(sectionStartIndex, sectionEndIndex).trimEnd(); // Use slice for safety
        // console.log(`extractSectionContent: Extracted for ${sectionHeadingRegex}: \n---\n${extracted}\n---`);
        return extracted;
    }


    extractDataviewBlocks(content: string): string[] {
        const blocks: string[] = [];
        const regex = /```dataviewjs\s*[\s\S]*?```/gs;
        let match;
        while ((match = regex.exec(content)) !== null) {
            blocks.push(match[0]);
        }
        return blocks;
    }

    // --- Modal Trigger ---
    showSyncDirectionModal(diffSummary: string, callback: (choice: string) => void) {
        const modal = new SyncDirectionModal(this.plugin.app, diffSummary, callback);
        modal.open();
    }
} // End ModuloNotion Class


// --- Helper Functions (Outside Class) ---

// Helper function for deep comparison (improved)
function deepCompare(obj1: any, obj2: any): boolean {
    // *** DEBUG LOG for Dates ***
    if (obj1 instanceof Date || obj2 instanceof Date) {
        console.log(`DEBUG deepCompare Dates: obj1=${obj1} (Type: ${typeof obj1}), obj2=${obj2} (Type: ${typeof obj2})`);
    }
    // *** END DEBUG LOG ***

    if (obj1 === obj2) return true;
    if (obj1 == null && obj2 == null) return true;
    if (obj1 == null || obj2 == null) return false;
    if (obj1 instanceof Date && obj2 instanceof Date) return obj1.getTime() === obj2.getTime();
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
        if (obj1.length !== obj2.length) return false;
        const simpleSort = (arr: any[]) => arr.every(item => typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean');
        const arr1 = simpleSort(obj1) ? [...obj1].sort() : obj1;
        const arr2 = simpleSort(obj2) ? [...obj2].sort() : obj2;
        for (let i = 0; i < arr1.length; i++) {
            if (!deepCompare(arr1[i], arr2[i])) return false;
        }
        return true;
    }
    if (typeof obj1 === "object" && typeof obj2 === "object") {
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);
        if (keys1.length !== keys2.length) return false;
        keys1.sort();
        keys2.sort();
        for (let i = 0; i < keys1.length; i++) {
            const key1 = keys1[i];
            const key2 = keys2[i];
            if (key1 !== key2 || !deepCompare(obj1[key1], obj2[key1])) return false;
        }
        return true;
    }
    return false;
}


// Helper to filter an object to only include specified keys
function filterKeys(obj: Record<string, any>, keysToKeep: string[]): Record<string, any> {
    const filtered: Record<string, any> = {};
    if (!obj) return filtered;
    for (const key of keysToKeep) {
        filtered[key] = obj.hasOwnProperty(key) ? obj[key] : undefined;
    }
    return filtered;
}

// Helper to find differing keys between two frontmatter objects, considering only a specific set of keys
function compareFrontmatterKeys(fm1: Record<string, any>, fm2: Record<string, any>, keysToCompare: string[]): string[] {
    const diffKeys: string[] = [];
    for (const key of keysToCompare) {
        // *** DEBUG LOG for specific key comparison ***
        if (key === 'publicacion') {
             console.log(`DEBUG compareFrontmatterKeys for 'publicacion': fm1='${fm1[key]}', fm2='${fm2[key]}'`);
        }
        // *** END DEBUG LOG ***
        if (!deepCompare(fm1[key], fm2[key])) {
            diffKeys.push(key);
        }
    }
    return diffKeys;
}

// Simple content diff summary (Enhanced)
function generateContentDiffSummary(text1: string, text2: string): string {
    const normalize = (str: string) => str.replace(/\r\n/g, '\n').trim();
    const normalizedText1 = normalize(text1);
    const normalizedText2 = normalize(text2);

    if (normalizedText1 === normalizedText2) return "(contenido idéntico)";

    const lines1 = normalizedText1.split('\n');
    const lines2 = normalizedText2.split('\n');

    if (lines1.length !== lines2.length) {
        return `(diferencia de longitud: ${lines1.length} vs ${lines2.length} líneas)`;
    }

    for (let i = 0; i < lines1.length; i++) {
        if (lines1[i] !== lines2[i]) {
            return `(modificado, primera diferencia en línea ~${i + 1})`;
        }
    }
    return "(contenido modificado)";
}


// --- Modal Class (Outside ModuloNotion) ---
class SyncDirectionModal extends Modal {
    diffSummary: string;
    callback: (choice: string) => void;

    constructor(app: App, diffSummary: string, callback: (choice: string) => void) {
        super(app);
        this.diffSummary = diffSummary;
        this.callback = callback;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('notion-sync-modal');

        contentEl.createEl('h2', { text: 'Conflicto de Sincronización' });
        contentEl.createEl('p', { text: this.diffSummary });
        contentEl.createEl('p', { text: '¿Cómo deseas proceder?' });

        const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });

        const obToNoButton = buttonContainer.createEl('button', { text: 'Obsidian -> Notion', cls: 'mod-cta' });
        obToNoButton.addEventListener('click', () => { this.callback('Obsidian -> Notion'); this.close(); });

        const noToObButton = buttonContainer.createEl('button', { text: 'Notion -> Obsidian' });
        noToObButton.addEventListener('click', () => { this.callback('Notion -> Obsidian'); this.close(); });

        const cancelButton = buttonContainer.createEl('button', { text: 'Cancelar' });
        cancelButton.addEventListener('click', () => { this.callback('Cancelar'); this.close(); });
    }

    onClose() {
        this.contentEl.empty();
    }
}
