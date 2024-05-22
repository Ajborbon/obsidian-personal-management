//campos = ["id","fecha","año","estado","aliases","rename"]

import { TFile, TFolder, Notice } from 'obsidian';
import { FieldHandlerUtils } from '../FieldHandlerUtils';
import { NoteFieldHandlerBase } from './NoteFieldHandlerBase'; // Asegúrate de importar NoteFieldHandler si es necesario
import { CompassPlaneacionAnual_FH } from '../Interfaces/CompassPlaneacionAnual_FH';

export class CompassPlaneacionAnual_FH extends NoteFieldHandlerBase implements nodoAreaVidaFieldHandler{
    
    constructor(tp: any, folder: string, plugin: any) {
      super(tp, folder, plugin); // Llama al constructor de la clase padre
    }
    async getAño(): Promise<string> {
        let nombreSistema = this.infoSubsistema.typeName;
        let año;
        //let trimestres = await this.activeStructureResources("Trimestral"); // Funciona en la versión 1.0 de Areas de Vida.
        let años = await FieldHandlerUtils.findMainFilesWithState("AY",null,this.plugin);
        año = await this.suggester(años.map(b => b.file.basename),años.map(b => b.file.basename), false, `Selecciona el año que deseas para el ${nombreSistema}:`);
	    // Verificar si el usuario presionó Esc.
        if (año === null) {
        new Notice("Creación cancelada por el usuario.");
        return; // Termina la ejecución de la función aquí.
	    }
        this.nota.año = año;
        return año;
    }

    async getNota(): Promise<any> {
        return this.nota;
    }

    async getAliases(): Promise<string[]> {
        this.nota.aliases = [];
        this.nota.aliases.push(`${this.infoSubsistema.typeName}/${this.nota.año}`)   
        this.nota.aliases.push(`${this.infoSubsistema.typeName}/${this.nota.id}`)   
        return this.nota.aliases;
    }

    async getRename(): Promise<string> {
        let folder = `${this.infoSubsistema.folder}/${this.nota.año}`
        const newName = `${this.infoSubsistema.folder}/${this.nota.año}/Planeación ${this.nota.año}.md`
        await FieldHandlerUtils.crearCarpeta(folder);

        const file = this.tp.file.config.target_file;
        const existe = app.vault.getAbstractFileByPath(newName);

        try {
            if (existe instanceof TFile) {
                const nombreFile = newName.split("/");
                const borrar = await this.suggester(
                    ["Sobreescribir Archivo Actual", "Detener creación del archivo."],
                    [true, false],
                    true,
                    `¿${nombreFile.pop()} ya existe. Qué deseas hacer?`
                );
                if (borrar) {
                    await app.vault.delete(existe);
                    if (file instanceof TFile) {
                        await app.vault.rename(file, newName);
                        console.log("Archivo renombrado con éxito.");
                        return newName;
                    }
                } else {
                    console.log("Cancelando la creación del archivo.");
                    throw new Error("Proceso cancelado por el usuario.");
                }
            } else {
                if (file instanceof TFile) {
                    await app.vault.rename(file, newName);
                    console.log("Archivo renombrado con éxito.");
                    return newName;
                }
            }
        } catch (error) {
            console.error("Error al cambiar el nombre", error);
            throw error;
        }
    }
}