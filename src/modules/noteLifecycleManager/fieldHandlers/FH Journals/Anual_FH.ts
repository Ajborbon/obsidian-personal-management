import { TFile, Notice } from 'obsidian';
import { DateTime } from 'luxon';
import { NoteFieldHandlerBase } from '../FH Base/NoteFieldHandlerBase';

export class Anual_FH extends NoteFieldHandlerBase {
    constructor(tp: any, infoSubsistema: any, plugin: any) {
        super(tp, infoSubsistema, plugin);
    }

    /**
     * Genera un UUID para el ID de la nota
     */
    async getId() {
        // Usar UUID para notas de tipo Journal
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
     * Permite seleccionar el año para la nota anual
     * Muestra años disponibles (no ocupados) en un rango de -3 a +3 del año actual
     */
    async getAño() {
        const currentYear = DateTime.now().year;
        const years = Array.from({ length: 7 }, (_, i) => currentYear - 3 + i);
        const existingYears = await this.getExistingYears();
        const availableYears = years.filter(year => !existingYears.includes(year.toString()));

        // Si no hay años disponibles, mostrar mensaje
        if (availableYears.length === 0) {
            new Notice("No hay años disponibles en el rango seleccionado.");
            throw new Error("No hay años disponibles");
        }

        const year = await this.suggester(
            availableYears.map(String), 
            availableYears.map(String), 
            false, 
            "Selecciona el año:"
        );

        if (year === null) {
            new Notice("Selección de año cancelada por el usuario.");
            throw new Error("Selección cancelada");
        }

        this.nota.año = year;
        return year;
    }
     
    /**
     * Establece el estado inicial como activo
     */
    async getEstado() {
        this.nota.estado = "🟢";
        return this.nota.estado;
    }

    /**
     * Renombra el archivo según el año seleccionado
     */
    async getRename() {
        // Asegurarse de que la carpeta existe
        await this.crearCarpeta(this.infoSubsistema.folder);

        // Construir el nuevo nombre de archivo con el año
        const newName = `${this.infoSubsistema.folder}/${this.nota.año}.md`;
        const file = this.tp.file.config.target_file;

        // Verificar si el archivo ya existe
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
     * Obtiene los años que ya tienen notas anuales
     */
    private async getExistingYears(): Promise<string[]> {
        const files = app.vault.getMarkdownFiles();
        const yearFiles = files.filter(file => file.path.startsWith(this.infoSubsistema.folder));
        const years = yearFiles.map(file => file.basename);
        return years;
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