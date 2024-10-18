import { AgradecimientosFieldHandler } from '../../Interfaces/AgradecimientosFieldHandler';
import { TFile, TFolder, Notice } from 'obsidian';
import { FieldHandlerUtils } from '../../FieldHandlerUtils';
import { NoteFieldHandlerBase } from '../FH Base/NoteFieldHandlerBase'; // Asegúrate de importar NoteFieldHandler si es necesario

export class AgradecimientosFieldHandler extends NoteFieldHandlerBase implements AgradecimientosFieldHandler {
    constructor(tp: any, folder: string, plugin: any) {
      super(tp, folder, plugin); // Llama al constructor de la clase padre
    }

    // getFecha para determinar si la fecha de la que inicia esta en el archivo de origen.
    async getFecha(): Promise<string> {
        const activo = app.workspace.getActiveFile();
        let fecha;
        const title = this.tp.file.dynamic_functions.get("title");
    
        if (title && title.startsWith("Agradecimiento")) { //En caso de que ya traiga la fecha
          fecha = title.split("Agradecimiento ")[1];
        } else if (activo.path && activo?.path.startsWith("Estructura/Journal/Diario/Notas")) {
          fecha = activo.basename;
        } else {
          const currentDate = moment().format('YYYY-MM-DD dddd');
          fecha = await this.prompt("¿De qué dia es el agradecimiento??", currentDate , false, false);
          
        }
        this.nota.fecha = fecha;
        return fecha;
      }

  async getAgradecimientos(): Promise<string[]> {
    let agradecimientos = [];
    let numAgradecimientos = 0;
    let otra;
    do {
      const agradecimiento = await this.prompt("¿De qué estás agradecido?", `Gracias por ${numAgradecimientos}`, false, true);
      agradecimientos.push(agradecimiento);
      numAgradecimientos += 1;
      otra = await this.suggester(["Sí", "No"], [true, false], true, "¿Quieres agregar otro agradecimiento?");
    } while (otra);
    return agradecimientos;
  }

}