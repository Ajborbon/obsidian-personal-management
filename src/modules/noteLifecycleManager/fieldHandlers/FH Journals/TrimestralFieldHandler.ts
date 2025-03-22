import { TFile, Notice } from 'obsidian';
import { DateTime } from 'luxon';
import { NoteFieldHandlerBase } from '../FH Base/NoteFieldHandlerBase';

export class TrimestralFieldHandler extends NoteFieldHandlerBase {
    constructor(tp: any, infoSubsistema: any, plugin: any) {
        super(tp, infoSubsistema, plugin);
    }

    /**
     * Genera un UUID para el ID de la nota
     */
    async getId() {
        this.nota.id = this.generateUUID();
        return this.nota.id;
    }

    /**
     * Obtiene la fecha actual en formato ISO
     */
    async getFecha() {
        this.nota.fecha = DateTime.now().toISODate();
        return this.nota.fecha;
    }

    /**
     * Permite seleccionar el trimestre para la nota
     * Muestra solo los trimestres disponibles (no utilizados)
     */
    async getTrimestre() {
        // Opciones predefinidas para trimestres
        const trimestres = ["Q1", "Q2", "Q3", "Q4"];
        
        // Obtiene los trimestres ya existentes en la carpeta definida
        const existingTrimestres = await this.getExistingTrimestres();
        
        // Filtra para dejar solo las opciones que no se han usado
        const availableTrimestres = trimestres.filter(q => !existingTrimestres.includes(q));
        
        if (availableTrimestres.length === 0) {
            new Notice("Todos los trimestres ya han sido creados en esta carpeta.");
            throw new Error("No hay trimestres disponibles");
        }
        
        const trimestre = await this.suggester(
            availableTrimestres,
            availableTrimestres,
            false,
            "Selecciona el trimestre:"
        );
        
        if (trimestre === null) {
            new Notice("Selección de trimestre cancelada por el usuario.");
            throw new Error("Selección cancelada");
        }
        
        this.nota.trimestre = trimestre;
        return trimestre;
    }

    /**
     * Establece el estado inicial como activo
     */
    async getEstado() {
        this.nota.estado = "🟢";
        return this.nota.estado;
    }

    /**
     * Renombra el archivo según el trimestre seleccionado
     */
    async getRename() {
        // Asegurarse de que la carpeta existe
        await this.crearCarpeta(this.infoSubsistema.folder);
        
        // Construye el nuevo nombre usando el folder y el trimestre seleccionado
        const newName = `${this.infoSubsistema.folder}/${this.nota.trimestre}.md`;
        const file = this.tp.file.config.target_file;
        
        // Verifica si el archivo ya existe
        const exists = app.vault.getAbstractFileByPath(newName);
        
        if (exists instanceof TFile) {
            const overwrite = await this.suggester(
                ["Sobreescribir Archivo Actual", "Detener creación del archivo."],
                [true, false],
                true,
                `El archivo ${newName} ya existe. ¿Qué deseas hacer?`
            );
            
            if (overwrite) {
                await app.vault.delete(exists);
                if (file instanceof TFile) {
                    await app.vault.rename(file, newName);
                    console.log("Archivo renombrado con éxito.");
                    
                    // Abrir el archivo recién creado
                    const nuevoArchivo = app.vault.getAbstractFileByPath(newName);
                    if (nuevoArchivo instanceof TFile) {
                        await app.workspace.getLeaf(true).openFile(nuevoArchivo);
                    }
                    
                    return true;
                }
            } else {
                console.log("Cancelando la creación del archivo.");
                throw new Error("Proceso cancelado por el usuario.");
            }
        } else {
            if (file instanceof TFile) {
                await app.vault.rename(file, newName);
                console.log("Archivo renombrado con éxito.");
                
                // Abrir el archivo recién creado
                const nuevoArchivo = app.vault.getAbstractFileByPath(newName);
                if (nuevoArchivo instanceof TFile) {
                    await app.workspace.getLeaf(true).openFile(nuevoArchivo);
                }
                
                return true;
            }
        }
    }

    /**
     * Retorna el objeto nota completo
     */
    async getNota(): Promise<any> {
        return this.nota;
    }

    /**
     * Genera un UUID único para la nota
     */
    generateUUID(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Obtiene los trimestres que ya tienen notas trimestrales
     */
    private async getExistingTrimestres(): Promise<string[]> {
        const files = app.vault.getMarkdownFiles();
        // Se filtran los archivos que se encuentran en la carpeta definida para notas trimestrales
        const trimestreFiles = files.filter(file => file.path.startsWith(this.infoSubsistema.folder));
        const trimestres = trimestreFiles.map(file => file.basename);
        return trimestres;
    }
    
    /**
     * Crea la carpeta si no existe
     */
    private async crearCarpeta(folderPath: string) {
        try {
            // Verificar si la carpeta ya existe
            const existingFolder = app.vault.getAbstractFileByPath(folderPath);
            if (existingFolder) {
                console.log(`La carpeta '${folderPath}' ya existe.`);
                return;
            }
            
            // Crear la carpeta
            await app.vault.createFolder(folderPath);
            console.log(`Carpeta '${folderPath}' creada exitosamente.`);
        } catch (error) {
            console.error(`Error al crear la carpeta '${folderPath}':`, error);
        }
    }
}