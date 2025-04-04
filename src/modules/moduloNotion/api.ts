import { Client, APIErrorCode, ClientErrorCode } from "@notionhq/client"; // Import error codes
import type {
    CreatePageParameters,
    UpdatePageParameters,
    AppendBlockChildrenParameters,
    ListBlockChildrenParameters,
    DeleteBlockParameters,
    BlockObjectResponse, // Import BlockObjectResponse
    PartialBlockObjectResponse // Import PartialBlockObjectResponse
} from "@notionhq/client/build/src/api-endpoints";
import { Notice, requestUrl } from "obsidian"; // Import requestUrl
import type { RequestUrlParam, RequestUrlResponse } from "obsidian"; // Use type import for these
import ManagementPlugin from "../../main"; // Adjust path as needed
import type { NotionModuleSettings } from "./index"; // Import settings interface from index.ts
import type { NotionBlocks } from "./mapper"; // Import NotionBlocks type

// Custom fetch implementation using Obsidian's requestUrl
// Mimics the standard fetch API signature enough for the Notion client
// Max blocks per append request
const MAX_BLOCKS_PER_APPEND = 100;
const obsidianFetch = async (url: string | URL, options: RequestInit = {}): Promise<Response> => {
    const method = options.method || 'GET';
    const headers = options.headers as Record<string, string> || {}; // Type assertion
    let body = options.body;

    // requestUrl expects body as string or ArrayBuffer
    if (body instanceof URLSearchParams) {
        body = body.toString();
        if (!headers['Content-Type']) {
             headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8';
        }
    } else if (body instanceof FormData) {
         // FormData is tricky with requestUrl, might need specific handling if used by Notion client
         console.warn("NotionApi: FormData body type might not be fully supported by obsidianFetch.");
         // Attempt basic conversion, might fail for files
         const formDataBody: Record<string, string> = {};
         body.forEach((value, key) => {
             if (typeof value === 'string') {
                 formDataBody[key] = value;
             }
         });
         body = JSON.stringify(formDataBody); // Send as JSON? Or urlencoded? Notion likely uses JSON.
         if (!headers['Content-Type']) {
             headers['Content-Type'] = 'application/json';
         }
    } else if (typeof body === 'object' && body !== null && !(body instanceof ArrayBuffer)) {
         // Assume JSON if it's an object but not already stringified or ArrayBuffer
         body = JSON.stringify(body);
         if (!headers['Content-Type']) {
             headers['Content-Type'] = 'application/json';
         }
    }


    const requestParams: RequestUrlParam = {
        url: url.toString(),
        method: method,
        headers: headers,
        // Ensure body is string, ArrayBuffer, or undefined (handle null explicitly)
        body: body === null ? undefined : (body as string | ArrayBuffer | undefined),
        throw: false, // Don't throw on HTTP errors, let Notion client handle it
    };

    // Remove Content-Type header for GET/HEAD requests if body is null/undefined
    if ((method === 'GET' || method === 'HEAD') && !requestParams.body) {
        delete headers['Content-Type'];
    }


    try {
        console.log("obsidianFetch: Making request:", method, url.toString(), "Headers:", headers); // Log headers
        const response: RequestUrlResponse = await requestUrl(requestParams);
        console.log("obsidianFetch: Received response status:", response.status);

        // Create a Response object mimicking the standard Fetch API
        const fetchResponse = new Response(response.arrayBuffer, { // Use arrayBuffer for body
            status: response.status,
            statusText: response.status.toString(), // requestUrl doesn't provide statusText
            headers: response.headers,
        });
        return fetchResponse;

    } catch (error) {
        console.error("obsidianFetch: Error making requestUrl:", error);
        // Simulate a network error response
        return new Response(null, { status: 0, statusText: 'Network Error (obsidianFetch)' });
    }
};

export class NotionApi {
    plugin: ManagementPlugin;
    // Removed settings property: settings: NotionSettings;
    client: Client | null = null;

    constructor(plugin: ManagementPlugin, initialSettings: NotionModuleSettings) { // Accept initial settings
        this.plugin = plugin;
        // Initialize client immediately in constructor if possible
        this.initializeClient(initialSettings);
        console.log("NotionApi: Constructor called");
    }

    // Accept settings object as argument
    initializeClient(settings: NotionModuleSettings) {
        const apiKey = settings.notionApiKey; // Access directly from passed settings
        if (apiKey) {
            try {
                // Pass the custom fetch implementation to the Notion client
                this.client = new Client({
                    auth: apiKey,
                    fetch: obsidianFetch, // Use Obsidian's requestUrl via wrapper
                });
                console.log("NotionApi: Notion client initialized successfully using obsidianFetch.");
            } catch (error) {
                console.error("NotionApi: Failed to initialize Notion client:", error);
                 new Notice("Error al inicializar el cliente de Notion. Verifica la API Key."); // Use Notice directly
                this.client = null;
            }
        } else {
            console.warn("NotionApi: Notion API Key not found. Client not initialized.");
            this.client = null;
        }
    }

    getClient(): Client | null {
         if (!this.client) {
             console.warn("NotionApi: Attempted to get client, but it's not initialized. Check API Key and ensure module is loaded.");
             // Removed the re-initialization attempt here as it caused type issues and should be handled by ModuloNotion's load/constructor.
             new Notice("Cliente de Notion no inicializado. Verifica la API Key en la configuración."); // Use Notice directly
         }
        return this.client;
    }

    // --- Page Creation ---
    async createPage(databaseId: string, properties: CreatePageParameters["properties"], children?: NotionBlocks) {
        const client = this.getClient();
        if (!client) {
            throw new Error("NotionApi: Client not initialized.");
        }
        if (!databaseId) {
            throw new Error("NotionApi: Database ID is required to create a page.");
        }

        console.log(`NotionApi: Creating page in database ${databaseId} with ${children ? children.length : 0} blocks.`);
        try {
            const params: CreatePageParameters = {
                parent: { database_id: databaseId },
                properties: properties,
            };
            // Add children only if provided and not empty
            if (children && children.length > 0) {
                // Notion API for createPage expects children directly, but append might be safer for large content
                // For simplicity now, let's add directly if <= MAX_BLOCKS_PER_APPEND
                if (children.length <= MAX_BLOCKS_PER_APPEND) {
                    params.children = children;
                } else {
                    console.warn(`NotionApi: Initial content has > ${MAX_BLOCKS_PER_APPEND} blocks. Creating page without content, will append separately.`);
                    // We'll need to append after creation in the calling function if this happens
                }
            }

            const response = await client.pages.create(params);
            console.log("NotionApi: Page created successfully:", response.id);

            // If content was too large for initial creation, append it now
            if (children && children.length > MAX_BLOCKS_PER_APPEND) {
                console.log(`NotionApi: Appending ${children.length} blocks to newly created page ${response.id}...`);
                await this.appendBlocks(response.id, children);
                console.log(`NotionApi: Finished appending blocks to ${response.id}.`);
            }

            return response;
        } catch (error: unknown) {
            this.handleNotionError(error, "creating Notion page");
            throw error; // Re-throw after logging/notifying
        }
    }

    // --- Page Retrieval ---
    async retrievePage(pageId: string) {
        const client = this.getClient();
        if (!client) {
            throw new Error("NotionApi: Client not initialized.");
        }
        if (!pageId) {
            throw new Error("NotionApi: Page ID is required to retrieve page data.");
        }
        console.log(`NotionApi: Retrieving page ${pageId}`);
        try {
            const response = await client.pages.retrieve({ page_id: pageId });
            console.log(`NotionApi: Page ${pageId} retrieved successfully.`);
            return response;
        } catch (error: unknown) {
            this.handleNotionError(error, `retrieving page ${pageId}`);
            throw error;
        }
    }

    // --- Page Update ---
    async updatePageProperties(pageId: string, properties: UpdatePageParameters["properties"]) {
        const client = this.getClient();
        if (!client) {
            throw new Error("NotionApi: Client not initialized.");
        }
        if (!pageId) {
            throw new Error("NotionApi: Page ID is required to update properties.");
        }

        console.log(`NotionApi: Updating properties for page ${pageId}`);
        try {
            const response = await client.pages.update({
                page_id: pageId,
                properties: properties,
                // Note: Archiving is done via properties: { archived: true }
            });
            console.log("NotionApi: Page properties updated successfully:", response.id);
            return response;
        } catch (error: unknown) {
            this.handleNotionError(error, `updating properties for page ${pageId}`);
            throw error;
        }
    }

    async updatePageContent(pageId: string, newBlocks: NotionBlocks) {
        const client = this.getClient();
        if (!client) {
            throw new Error("NotionApi: Client not initialized.");
        }
        if (!pageId) {
            throw new Error("NotionApi: Page ID is required to update content.");
        }

        console.log(`NotionApi: Updating content for page ${pageId}. New block count: ${newBlocks.length}`);

        try {
            // 1. Get existing block IDs
            console.log(`NotionApi: Fetching existing blocks for page ${pageId}...`);
            const existingBlocks = await this.listBlockChildren(pageId);
            console.log(`NotionApi: Found ${existingBlocks.length} existing blocks.`);

            // 2. Delete existing blocks (if any)
            // Note: Deleting blocks one by one can be slow and hit rate limits.
            // The Notion API doesn't have a batch delete for blocks.
            // Consider alternative strategies for large pages if performance is an issue.
            if (existingBlocks.length > 0) {
                console.log(`NotionApi: Deleting ${existingBlocks.length} existing blocks...`);
                // Delete in reverse order? Might not matter.
                for (const block of existingBlocks) {
                    try {
                        await client.blocks.delete({ block_id: block.id });
                        // console.log(`NotionApi: Deleted block ${block.id}`); // Verbose
                    } catch (deleteError) {
                        // Log deletion error but continue trying to delete others
                        this.handleNotionError(deleteError, `deleting block ${block.id}`);
                    }
                    // Optional: Add a small delay to avoid rate limits, especially for many blocks
                    // await new Promise(resolve => setTimeout(resolve, 100)); // e.g., 100ms delay
                }
                console.log(`NotionApi: Finished deleting existing blocks.`);
            } else {
                console.log(`NotionApi: No existing blocks to delete.`);
            }


            // 3. Append new blocks (if any)
            if (newBlocks.length > 0) {
                console.log(`NotionApi: Appending ${newBlocks.length} new blocks...`);
                await this.appendBlocks(pageId, newBlocks);
                console.log(`NotionApi: Finished appending new blocks.`);
            } else {
                 console.log(`NotionApi: No new blocks to append.`);
            }

            console.log(`NotionApi: Page content updated successfully for ${pageId}.`);

        } catch (error: unknown) {
            this.handleNotionError(error, `updating content for page ${pageId}`);
            throw error; // Re-throw after logging/notifying
        }
    }

    // --- Block Handling Helpers ---

    /** Appends blocks to a page/block, handling pagination */
    async appendBlocks(parentId: string, blocks: NotionBlocks) {
        const client = this.getClient();
        if (!client) throw new Error("NotionApi: Client not initialized.");

        for (let i = 0; i < blocks.length; i += MAX_BLOCKS_PER_APPEND) {
            const chunk = blocks.slice(i, i + MAX_BLOCKS_PER_APPEND);
            console.log(`NotionApi: Appending chunk of ${chunk.length} blocks (total ${i + chunk.length}/${blocks.length}) to ${parentId}...`);
            try {
                await client.blocks.children.append({
                    block_id: parentId,
                    children: chunk,
                });
            } catch (error) {
                 // Log append error but potentially continue with other chunks?
                 // For now, rethrow the error from the first failed chunk.
                this.handleNotionError(error, `appending block chunk to ${parentId}`);
                throw error;
            }
             // Optional delay between chunks if rate limits are hit
             // if (blocks.length > MAX_BLOCKS_PER_APPEND && i + MAX_BLOCKS_PER_APPEND < blocks.length) {
             //     await new Promise(resolve => setTimeout(resolve, 300)); // 300ms delay
             // }
        }
    }


    /** Lists all block children for a given block ID, handling pagination */
    async listBlockChildren(blockId: string): Promise<(BlockObjectResponse | PartialBlockObjectResponse)[]> {
        const client = this.getClient();
        if (!client) throw new Error("NotionApi: Client not initialized.");

        const allBlocks: (BlockObjectResponse | PartialBlockObjectResponse)[] = [];
        let hasMore = true;
        let startCursor: string | undefined = undefined;

        console.log(`NotionApi: Listing block children for ${blockId}...`);
        while (hasMore) {
            try {
                const params: ListBlockChildrenParameters = { block_id: blockId, page_size: 100 }; // Max page size is 100
                if (startCursor) {
                    params.start_cursor = startCursor;
                }
                const response = await client.blocks.children.list(params);
                allBlocks.push(...response.results);
                hasMore = response.has_more;
                startCursor = response.next_cursor ?? undefined; // Use nullish coalescing
                // console.log(`NotionApi: Fetched ${response.results.length} blocks, has_more: ${hasMore}`); // Verbose
            } catch (error) {
                this.handleNotionError(error, `listing block children for ${blockId}`);
                throw error; // Stop listing if an error occurs
            }
        }
        console.log(`NotionApi: Total blocks fetched for ${blockId}: ${allBlocks.length}`);
        return allBlocks;
    }

    // --- Error Handling ---
    private handleNotionError(error: unknown, context: string) {
        let errorMessage = `Unknown error ${context}`;
        let consoleMessage = `NotionApi: Error ${context}:`;

        if (typeof error === 'object' && error !== null) {
            // Check if it's a Notion API error
            if ('code' in error && Object.values(APIErrorCode).includes(error.code as APIErrorCode)) {
                const notionError = error as { code: APIErrorCode; message: string; body?: any };
                errorMessage = `Error ${context}: ${notionError.message} (Code: ${notionError.code})`;
                consoleMessage = `${consoleMessage} Notion API Error - Code: ${notionError.code}, Message: ${notionError.message}, Body: ${JSON.stringify(notionError.body || {})}`;
            }
            // Check if it's a Notion Client error
            else if ('code' in error && Object.values(ClientErrorCode).includes(error.code as ClientErrorCode)) {
                 const clientError = error as { code: ClientErrorCode; message: string };
                 errorMessage = `Error ${context}: ${clientError.message} (Code: ${clientError.code})`;
                 consoleMessage = `${consoleMessage} Notion Client Error - Code: ${clientError.code}, Message: ${clientError.message}`;
            }
            // Check if it's a standard JavaScript Error
            else if (error instanceof Error) {
                errorMessage = `Error ${context}: ${error.message}`;
                consoleMessage = `${consoleMessage} ${error.stack || error.message}`;
            }
            // Fallback for other object types
            else {
                 errorMessage = `Non-standard error object ${context}: ${JSON.stringify(error)}`;
                 consoleMessage = `${consoleMessage} Non-standard error object: ${JSON.stringify(error)}`;
            }
        } else {
            // Handle non-object errors (e.g., strings, numbers)
            errorMessage = `Error ${context}: ${String(error)}`;
            consoleMessage = `${consoleMessage} ${String(error)}`;
        }

        console.error(consoleMessage);
        new Notice(errorMessage, 10000); // Show notice for 10 seconds
    }
}
