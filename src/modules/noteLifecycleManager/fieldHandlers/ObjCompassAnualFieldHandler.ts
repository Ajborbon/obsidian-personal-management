// campos = ["id","fecha","areaVida","año","titulo","descripcion","trimestre","estado","aliases","rename"];

import { NoteFieldHandler } from './FH Base/NoteFieldHandler'; // Asegúrate de importar NoteFieldHandler si es necesario
import { ObjCompassAnualFieldHandler } from '../Interfaces/ObjCompassAnualFieldHandler';
import { FieldHandlerUtils } from '../FieldHandlerUtils';
import { TFile } from 'obsidian';

export class ObjCompassAnualFieldHandler extends NoteFieldHandler implements ObjCompassAnualFieldHandler{
    
    constructor(tp: any, folder: string, plugin: any) {
      super(tp, folder, plugin); // Llama al constructor de la clase padre
    }

    async getEstado(): Promise<string> {
        return '🟡';
    }

    async getAreaVida(){
        let areaVida;
        if (!this.nota.asuntoDefinido) {
        let nombreArchivo = this.infoSubsistema.fileName;
        const regex = /Objetivo para (.+)\.md$/;
        const resultado = nombreArchivo.match(regex);
        if (resultado && resultado[1]) {
            // Retornamos el grupo capturado, que es el valor deseado de substr
            areaVida = resultado[1];
        } else {
            // Si no se encuentra una coincidencia, podríamos retornar null o alguna otra señal de no encontrado
            return null;
        }  
	    // Verificar si el usuario presionó Esc.
        this.nota.areaVida = areaVida;
        return areaVida;
        } else {
            return this.nota.areaVida;
        }
    }


    async getTitulo(){
        let titulo;
        titulo = await this.prompt(`Cual es tu objetivo en ${this.nota.año} para ${this.nota.areaVida}?`, `Voy a `, true, true) // 4 parametro true: Multilinea.
	    // Verificar si el usuario presionó Esc.
        if (titulo === null) {
        new Notice("Creación de nota cancelada por el usuario.");
        return; // Termina la ejecución de la función aquí.
	    }
        this.nota.titulo = titulo;
        return titulo;
    }

    async getAño(){
         
        let suggester = this.tp.system.static_functions.get("suggester");
        let tipoSistema = this.infoSubsistema.type;
        let nombreSistema = this.infoSubsistema.typeName;
        let año;
        //let trimestres = await this.activeStructureResources("Trimestral"); // Funciona en la versión 1.0 de Areas de Vida.
        let años = await FieldHandlerUtils.findMainFilesWithState("AY", null, this.plugin);
            let nombreArchivo = this.infoSubsistema.fileName;
            const regex = /\/(\d{4})/;
            const resultado = nombreArchivo.match(regex);
            if (resultado && resultado[1]) {
                // Retornamos el grupo capturado, que es el valor deseado de substr
                año = resultado[1];
            } else {
                // Si no se encuentra una coincidencia, podríamos retornar null o alguna otra señal de no encontrado
                return null;
            }
        if (año === null) {
        new Notice("Creación cancelada por el usuario.");
        return; // Termina la ejecución de la función aquí.
	    }
        this.nota.año = año;
        return año;
    }

    async getDescripcion(): Promise<string> {
        const descripcion = await this.prompt(`¿Quieres agregar detalles de tu objetivo?`, "", false, true);
        this.nota.descripcion = descripcion;
        return descripcion;
    }

    async getTrimestre(){
        let trimestre;
        //let trimestres = await this.activeStructureResources("Trimestral"); // Funciona en la versión 1.0 de Areas de Vida.
        let trimestres = await FieldHandlerUtils.findMainFilesWithState("TQ",null,this.plugin);
        trimestre = await this.suggester(
            ["Q1", "Q2", "Q3", "Q4"],
            [
                `${this.nota.año}-Q1`,
                `${this.nota.año}-Q2`,
                `${this.nota.año}-Q3`,
                `${this.nota.año}-Q4`,
            ],
            true,
            `¿En qué trimestre del ${this.nota.año} consideras que se puede realizar ese objetivo?`
            );
                   
	    // Verificar si el usuario presionó Esc.
        if (trimestre === null) {
        new Notice("Modificación de nota cancelada por el usuario.");
        return; // Termina la ejecución de la función aquí.
	    }
        this.nota.trimestre = trimestre;
        return trimestre;
    }

    
    async getAliases(): Promise<string[]> {
        this.nota.aliases = [];
        this.nota.aliases.push(`${this.infoSubsistema.type}/${this.nota.año}/${this.nota.id}`)
        this.nota.aliases.push(`${this.infoSubsistema.type}/${this.nota.año}/${this.nota.areaVida}/${this.nota.id}`)
        this.nota.aliases.push(`${this.infoSubsistema.type}/${this.nota.titulo}`)
        return this.nota.aliases;
    }

    async getRename(): Promise<string> {
       
        let folder = `${this.infoSubsistema.folder}/${this.nota.año}`
        const newName = `${this.infoSubsistema.folder}/${this.nota.año}/${this.infoSubsistema.type} - ${this.nota.id}.md`
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