import { NoteFieldHandler } from './NoteFieldHandler'; // Asegúrate de importar NoteFieldHandler si es necesario
import { FieldHandlerUtils } from '../FieldHandlerUtils';
import { TFile } from 'obsidian';

export class TransaccionesFieldHandler extends NoteFieldHandler{
    constructor(tp: any, folder: string, plugin: any) {
      super(tp, folder, plugin); // Llama al constructor de la clase padre
    }
    async getFecha() : Promise<string> {
        let fecha;  
        let fechaOriginal = await this.prompt(`Confirma la fecha de la transacción: `, `${moment().format('YYYY-MM-DD HH:mm')}`, true)
        // Parseando la fecha original utilizando moment
        let fechaMoment = moment(fechaOriginal, "YYYY-MM-DD HH:mm");
        // Formateando la nueva fecha al formato deseado
        fecha = fechaMoment.format("YYYY-MM-DD dddd HH:mm");
        this.nota.fecha = fecha;
        return fecha;
    }
    
        async getRename(): Promise<string> {
            debugger;
            let fecha = moment(this.nota.fecha, "YYYY-MM-DD dddd HH:mm");
            let fechaY = fecha.format("YYYY");
            let fechaMes = fecha.format("MM - MMMM");

            const newName = `${this.infoSubsistema.folder}/${fechaY}/${fechaMes}/${this.infoSubsistema.type} - ${this.nota.id}.md`
            const folder = `${this.infoSubsistema.folder}/${fechaY}/${fechaMes}`
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