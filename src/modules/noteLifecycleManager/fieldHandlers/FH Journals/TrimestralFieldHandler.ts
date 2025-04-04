import { TFile, Notice, TFolder, TAbstractFile, App } from 'obsidian';
import { DateTime } from 'luxon';
import type { NoteFieldHandlerBase } from '../../Interfaces/NoteFieldHandlerBase';
import type MyPlugin from '../../../../main';

interface TrimestralInfoSubsistema {
    folder: string;
    indice: string;
    type: string;
    typeName: string;
    defined: boolean;
    fileName: string;
    initialTitle?: string;
}

export class TrimestralFieldHandler implements NoteFieldHandlerBase {
    private app: App;
    private plugin: MyPlugin;
    private tp: any;
    private infoSubsistema: TrimestralInfoSubsistema;

    // Objeto para acumular los datos de la nota
    private nota: {
        id?: string; // Almacena el UUID real (string)
        fecha?: string;
        trimestre?: string; // Almacena "YYYY-Qq"
        estado?: string;
        typeName?: string;
        type?: string;
        year?: number;
        titulo?: string; // Añadido para almacenar título si es necesario
        descripcion?: string; // Añadido para almacenar descripción si es necesario
        aliases?: string[]; // Añadido para almacenar aliases si es necesario
        [key: string]: any;
    } = {};

    constructor(tp: any, infoSubsistema: TrimestralInfoSubsistema, plugin: MyPlugin) {
        this.app = plugin.app;
        this.plugin = plugin;
        this.tp = tp;
        this.infoSubsistema = infoSubsistema;

        this.nota = {
            typeName: infoSubsistema.typeName,
            type: infoSubsistema.type,
        };
    }

    // --- Implementación de Métodos de la Interfaz NoteFieldHandlerBase ---

    /**
     * Genera UUID (string), lo guarda en nota.id, devuelve 0 (number) para interfaz.
     */
    async getId(): Promise<number> { // Firma de la interfaz
        const newId = this.generateUUID();
        this.nota.id = newId;
        console.warn(`getId: Devolviendo 0 para cumplir interfaz, UUID real es ${newId}`);
        return 0;
    }

    async getFecha(): Promise<string> { // Firma de la interfaz
        const fechaActual = DateTime.now().toISODate();
        if (fechaActual === null) {
            throw new Error("No se pudo obtener la fecha actual en formato ISO.");
        }
        this.nota.fecha = fechaActual;
        return fechaActual;
    }

    async getTitulo(): Promise<string> { // Firma de la interfaz
        // Deriva el título del trimestre si está disponible, sino usa default.
        const titulo = this.nota.trimestre || `Revisión Trimestral ${DateTime.now().year}`;
        this.nota.titulo = titulo;
        console.log(`getTitulo: Devolviendo '${titulo}'`);
        return titulo;
    }

    async getDescripcion(): Promise<string> { // Firma de la interfaz
        const descripcion = ""; // Descripción no relevante para este handler
        this.nota.descripcion = descripcion;
        console.log("getDescripcion: Devolviendo string vacío.");
        return descripcion;
    }

    async getEstado(): Promise<string> { // Firma de la interfaz
        const estado = "🟢";
        this.nota.estado = estado;
        return estado;
    }

    async getAliases(): Promise<string[]> { // Firma de la interfaz
        const aliases: string[] = []; // Aliases no relevantes para este handler
        this.nota.aliases = aliases;
        console.log("getAliases: Devolviendo array vacío.");
        return aliases;
    }

    /**
     * Renombra/mueve el archivo y devuelve la ruta final (string) para interfaz.
     */
    async getRename(): Promise<string> { // Firma de la interfaz
        console.log("Iniciando getRename...");
        // Primero, asegurar que el trimestre y año se han determinado
        // Llamamos a determineTrimestreAndYear si aún no se ha calculado explícitamente
        // (Aunque fillNote lo llama secuencialmente, esto añade robustez)
        if (!this.nota.trimestre || !this.nota.year) {
             await this.determineTrimestreAndYear();
        }

        if (!this.nota.year || !this.nota.trimestre) {
             const errorMsg = "Error interno: Año o trimestre no determinados antes de renombrar.";
             console.error(errorMsg, this.nota);
             throw new Error(errorMsg);
        }

        const baseFolder = this.infoSubsistema.folder;
        const yearFolder = `${baseFolder}/${this.nota.year}`;
        const targetPath = `${yearFolder}/${this.nota.trimestre}.md`;
        console.log(`Ruta destino: ${targetPath}`);

        await this.crearCarpetaSiNoExiste(baseFolder);
        await this.crearCarpetaSiNoExiste(yearFolder);

        // Get the file being processed by Templater using its path stored in infoSubsistema
        // Ensure infoSubsistema.fileName is populated correctly in the template
        if (!this.infoSubsistema.fileName) {
            throw new Error("Error interno: infoSubsistema.fileName no está definido.");
        }
        const fileToRename = this.app.vault.getAbstractFileByPath(this.infoSubsistema.fileName);


        if (!(fileToRename instanceof TFile)) {
             console.error(`Error crítico: No se pudo encontrar el archivo TFile a renombrar en la ruta: ${this.infoSubsistema.fileName}`, fileToRename);
             throw new Error("Archivo de destino de Templater no es un TFile.");
        }
        console.log(`Archivo a renombrar: ${fileToRename.path}`);

        const existingTargetFile = this.app.vault.getAbstractFileByPath(targetPath);
        console.log(`Verificando destino ${targetPath}. Existe:`, existingTargetFile);

        if (existingTargetFile instanceof TFile && existingTargetFile.path !== fileToRename.path) {
             console.log(`Destino ${targetPath} existe y es diferente.`);
             const overwrite = await this.suggester(
                 ["Sobreescribir", "Cancelar"], [true, false], false, `Archivo ${targetPath} ya existe?`
             );

             if (overwrite === true) {
                 console.log(`Sobreescribiendo: ${targetPath}`);
                 await this.app.vault.delete(existingTargetFile as TAbstractFile);
                 console.log(`Archivo ${targetPath} eliminado.`);
             } else {
                 throw new Error("Creación cancelada, archivo ya existe.");
             }
        } else if (existingTargetFile instanceof TFolder) {
             const errorMsg = `Conflicto: Ya existe una carpeta en ${targetPath}`;
             console.error(errorMsg);
             throw new Error(errorMsg);
        }

        try {
            console.log(`Renombrando ${fileToRename.path} a ${targetPath}`);
            await this.app.vault.rename(fileToRename, targetPath);
            console.log(`Renombrado exitoso a: ${targetPath}`);

            const finalFile = this.app.vault.getAbstractFileByPath(targetPath);
            if (finalFile instanceof TFile) {
                console.log(`Abriendo archivo final: ${finalFile.path}`);
                await this.app.workspace.getLeaf(true).openFile(finalFile);
            } else {
                 console.warn(`No se pudo encontrar ${targetPath} después de renombrar.`);
            }
        } catch (error) {
             console.error(`Error en vault.rename a ${targetPath}:`, error);
             new Notice(`Error al renombrar/mover a ${targetPath}.`);
             throw error;
        }
        return targetPath; // Devuelve la ruta final (string)
    }

    async getNota(): Promise<any> { // Firma de la interfaz
        // Asegura que todos los campos relevantes estén poblados antes de devolver
        // (Aunque fillNote los llama en orden, esto es una salvaguarda)
        if (!this.nota.id) await this.getId();
        if (!this.nota.fecha) await this.getFecha();
        // Llamar a determineTrimestreAndYear si falta trimestre o año
        if (!this.nota.trimestre || !this.nota.year) await this.determineTrimestreAndYear();
        if (!this.nota.estado) await this.getEstado();
        // getTitulo ahora depende de nota.trimestre, que debe estar establecido
        if (!this.nota.titulo) await this.getTitulo();
        if (this.nota.descripcion === undefined) await this.getDescripcion();
        if (!this.nota.aliases) await this.getAliases();

        console.log("getNota: Devolviendo objeto nota final:", this.nota);
        return this.nota;
    }

    // --- Missing methods from NoteFieldHandler interface ---
    // Add placeholder implementations for methods required by the interface
    // but not specifically relevant to Trimestral notes.

    async getAsunto(): Promise<string[]> {
        console.log("getAsunto: Not relevant for Trimestral, returning empty array.");
        this.nota.asunto = []; // Store if needed
        return [];
    }

    async getProyectoGTD(): Promise<string[]> {
         console.log("getProyectoGTD: Not relevant for Trimestral, returning empty array.");
         this.nota.proyectoGTD = []; // Store if needed
         return [];
    }

    async getProyectoQ(): Promise<string[]> {
         console.log("getProyectoQ: Not relevant for Trimestral, returning empty array.");
         this.nota.proyectoQ = []; // Store if needed
         return [];
    }

    async getAreaInteres(): Promise<string[]> {
         console.log("getAreaInteres: Not relevant for Trimestral, returning empty array.");
         this.nota.areaInteres = []; // Store if needed
         return [];
    }

     async getAreaVida(): Promise<string[]> {
         console.log("getAreaVida: Not relevant for Trimestral, returning empty array.");
         this.nota.areaVida = []; // Store if needed
         return [];
    }


    // --- Métodos Específicos del Handler (no en la interfaz) ---

    /**
     * Determina el año y trimestre (YYYY-Qq), validando o solicitando al usuario.
     * Este es llamado internamente por getRename o getNota si es necesario.
     */
    private async determineTrimestreAndYear(): Promise<void> {
        // Evita recalcular si ya se hizo
        if (this.nota.trimestre && this.nota.year) {
            return;
        }

        const currentYear = DateTime.now().year;
        const quarters = ["Q1", "Q2", "Q3", "Q4"];
        let selectedYear: number;
        let selectedQuarter: string;

        const initialTitle = this.infoSubsistema.initialTitle;
        const titleMatch = initialTitle?.match(/^(\d{4})-(Q[1-4])$/);

        if (titleMatch && !initialTitle?.includes("Untitled")) {
            selectedYear = parseInt(titleMatch[1], 10);
            selectedQuarter = titleMatch[2];
            console.log(`(determine) Título inicial válido: ${initialTitle}. Año: ${selectedYear}, Trimestre: ${selectedQuarter}`);

            const targetPath = `${this.infoSubsistema.folder}/${selectedYear}/${selectedYear}-${selectedQuarter}.md`;
            const existingFile = this.app.vault.getAbstractFileByPath(targetPath);
            // Use the reliable fileName from infoSubsistema to get the current file
            const currentFile = this.infoSubsistema.fileName ? this.app.vault.getAbstractFileByPath(this.infoSubsistema.fileName) : null;


            if (existingFile instanceof TFile && (!currentFile || existingFile.path !== currentFile.path)) {
                // Error only if the existing file is different from the one being processed
                new Notice(`Error: Nota para ${selectedYear}-${selectedQuarter} ya existe en ${targetPath}.`);
                throw new Error(`Nota ${selectedYear}-${selectedQuarter} ya existe.`);
            }
            console.log(`(determine) Trimestre ${selectedYear}-${selectedQuarter} validado.`);

        } else {
            console.log("(determine) Título inicial no válido o 'Untitled'. Solicitando año y trimestre.");

            const yearOptions = [currentYear, currentYear + 1, currentYear - 1];
            const yearStrings = yearOptions.map(String);
            const chosenYearNum = await this.suggester(
                yearStrings, yearOptions, false, "Selecciona el año:"
            );

            if (chosenYearNum === null || chosenYearNum === undefined) {
                throw new Error("Selección de año cancelada.");
            }
            selectedYear = chosenYearNum as number;

            const existingQuarters = await this.getExistingQuartersForYear(selectedYear);
            const availableQuarters = quarters.filter(q => !existingQuarters.includes(`${selectedYear}-${q}`));

            if (availableQuarters.length === 0) {
                throw new Error(`No hay trimestres disponibles para ${selectedYear}.`);
            }

            const chosenQuarter = await this.suggester(
                availableQuarters, availableQuarters, false, `Selecciona trimestre para ${selectedYear}:`
            );

            if (chosenQuarter === null || chosenQuarter === undefined) {
                throw new Error("Selección de trimestre cancelada.");
            }
            selectedQuarter = chosenQuarter as string;
        }

        this.nota.year = selectedYear;
        this.nota.trimestre = `${selectedYear}-${selectedQuarter}`;
        console.log(`(determine) Trimestre final: ${this.nota.trimestre}, Año: ${this.nota.year}`);
        // No devuelve nada, solo establece las propiedades de this.nota
    }


    // --- Métodos Helper Locales ---

    private async getExistingQuartersForYear(year: number): Promise<string[]> {
        if (!this.infoSubsistema || !this.infoSubsistema.folder) {
            console.error("Error: infoSubsistema.folder no definido en getExistingQuartersForYear");
            return [];
        }
        const yearFolderPath = `${this.infoSubsistema.folder}/${year}`;
        const yearFolder = this.app.vault.getAbstractFileByPath(yearFolderPath);

        if (!(yearFolder instanceof TFolder)) {
            return [];
        }

        const children = yearFolder.children;
        const trimestreFiles = children.filter(file =>
            file instanceof TFile && /^\d{4}-Q[1-4]\.md$/.test(file.name)
        ) as TFile[];

        const trimestres = trimestreFiles.map(file => file.basename);
        console.log(`Trimestres existentes para ${year}:`, trimestres);
        return trimestres;
    }

    private generateUUID(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    private async suggester(text_items: string[], items: any[], throw_on_cancel: boolean = false, placeholder: string = "", limit?: number ): Promise<any | null> {
        if (!this.tp || !this.tp.system || typeof this.tp.system.suggester !== 'function') {
             console.error("Error: tp.system.suggester no disponible.");
             if (throw_on_cancel) throw new Error("Suggester no disponible.");
             return null;
        }
        try {
            const result = await this.tp.system.suggester(text_items, items, throw_on_cancel, placeholder, limit);
            return result;
        } catch (error) {
             console.log("Suggester cancelado o error.", error);
             if (throw_on_cancel) throw error;
             return null;
        }
    }

    private async crearCarpetaSiNoExiste(folderPath: string): Promise<void> {
        try {
            const existingItem = this.app.vault.getAbstractFileByPath(folderPath);
            if (existingItem instanceof TFolder) return;
            if (existingItem instanceof TFile) {
                throw new Error(`Conflicto: Existe un archivo en lugar de la carpeta ${folderPath}`);
            }
            await this.app.vault.createFolder(folderPath);
            console.log(`Carpeta '${folderPath}' creada.`);
        } catch (error) {
            console.error(`Error al crear carpeta '${folderPath}':`, error);
            throw error;
        }
    }
}
