import { TFile, Notice } from 'obsidian';
import { DateTime } from 'luxon';
import { NoteFieldHandlerBase } from '../FH Base/NoteFieldHandlerBase';

export class Anual_FH extends NoteFieldHandlerBase {
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

    async getAño() {
        const currentYear = DateTime.now().year;
        const years = Array.from({ length: 7 }, (_, i) => currentYear - 3 + i);
        const existingYears = await this.getExistingYears();
        const availableYears = years.filter(year => !existingYears.includes(year.toString()));

        const year = await this.suggester(availableYears.map(String), availableYears.map(String), false, "Selecciona el año:");
        if (year === null) {
            new Notice("Selección de año cancelada por el usuario.");
            return;
        }
        this.nota.año = year;
        return year;
    }

    async getEstado() {
        this.nota.estado = "🟢";
        return this.nota.estado;
    }

    async getRename() {
        const newName = `${this.infoSubsistema.folder}/${this.nota.año}.md`;
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

    private async getExistingYears(): Promise<string[]> {
        const files = app.vault.getMarkdownFiles();
        const yearFiles = files.filter(file => file.path.startsWith(this.infoSubsistema.folder));
        const years = yearFiles.map(file => file.basename);
        return years;
    }
}
