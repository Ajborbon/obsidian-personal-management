import { reflexionesFieldHandler } from '../../Interfaces/ReflexionesFieldHandler';
import { TFile, TFolder, Notice } from 'obsidian';
import { FieldHandlerUtils } from '../../FieldHandlerUtils';
import { NoteFieldHandlerBase } from '../FH Base/NoteFieldHandlerBase'; // Asegúrate de importar NoteFieldHandler si es necesario

export class ReflexionesFieldHandler extends NoteFieldHandlerBase implements ReflexionesFieldHandler {
    constructor(tp: any, folder: string, plugin: any) {
      super(tp, folder, plugin); // Llama al constructor de la clase padre
    }

    // getFecha para determinar si la fecha de la que inicia esta en el archivo de origen.
    async getFecha(): Promise<string> {
        const activo = app.workspace.getActiveFile();
        let fecha;
        const title = this.tp.file.dynamic_functions.get("title");
    
        if (title && title.startsWith("Reflexion")) { //En caso de que ya traiga la fecha
          fecha = title.split("Reflexion ")[1];
        } else if (activo.path && activo?.path.startsWith("Estructura/Journal/Diario/Notas")) {
          fecha = activo.basename;
        } else {
          const currentDate = moment().format('YYYY-MM-DD dddd');
          fecha = await this.prompt("¿De qué dia es la reflexión??", currentDate , false, false);
          
        }
        this.nota.fecha = fecha;
        return fecha;
      }

  async getReflexion(): Promise<string[]> {
    let reflexiones = [];
    let numReflexiones = 0;
    let otra;
    do {
      const reflexion = await this.prompt("Que estas pensando?", `P${numReflexiones}`, false, true);
      reflexiones.push(reflexion);
      numReflexiones += 1;
      otra = await this.suggester(["Sí", "No"], [true, false], true, "¿Quieres agregar otro párrafo?");
    } while (otra);
    return reflexiones;
  }

}