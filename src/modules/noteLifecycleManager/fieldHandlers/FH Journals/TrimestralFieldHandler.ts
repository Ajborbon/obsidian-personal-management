import { TFile, Notice } from 'obsidian';
import { DateTime } from 'luxon';
import { NoteFieldHandlerBase } from '../FH Base/NoteFieldHandlerBase';

export class TrimestralFieldHandler extends NoteFieldHandlerBase {
    constructor(tp: any, infoSubsistema: any, plugin: any) {
        super(tp, infoSubsistema, plugin);
    }

    async getId() {
        this.nota.id = this.generateUUID();
        return this.nota.id;
    }

    async getFecha() {
        this.nota.fecha = DateTime.now().toISODate();
        return this.nota.fecha;
    }

    async getTrimestre() {
        // Opciones predefinidas para trimestres
        const trimestres = ["Q1", "Q2", "Q3", "Q4"];
        // Obtiene los trimestres ya existentes en la carpeta definida
        const existingTrimestres = await this.getExistingTrimestres();
        // Filtra para dejar solo las opciones que no se han usado
        const availableTrimestres = trimestres.filter(q => !existingTrimestres.includes(q));
        if (availableTrimestres.length === 0) {
            new Notice("Todos los trimestres ya han sido creados en esta carpeta.");
            return;
        }
        const trimestre = await this.suggester(
            availableTrimestres,
            availableTrimestres,
            false,
            "Selecciona el trimestre:"
        );
        if (trimestre === null) {
            new Notice("Selección de trimestre cancelada por el usuario.");
            return;
        }
        this.nota.trimestre = trimestre;
        return trimestre;
    }

    async getEstado() {
        this.nota.estado = "🟢";
        return this.nota.estado;
    }

    async getRename() {
        // Construye el nuevo nombre usando el folder y el trimestre seleccionado
        const newName = `${this.infoSubsistema.folder}/${this.nota.trimestre}.md`;
        const file = this.tp.file.config.target_file;
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
                return true;
            }
        }
    }

    async getNota(): Promise<any> {
        return this.nota;
    }

    private async getExistingTrimestres(): Promise<string[]> {
        const files = app.vault.getMarkdownFiles();
        // Se filtran los archivos que se encuentran en la carpeta definida para notas trimestrales
        const trimestreFiles = files.filter(file => file.path.startsWith(this.infoSubsistema.folder));
        const trimestres = trimestreFiles.map(file => file.basename);
        return trimestres;
    }
}