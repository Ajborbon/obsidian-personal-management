import { NoteFieldHandler } from './FH Base/NoteFieldHandler'; // Asegúrate de importar NoteFieldHandler si es necesario

export class RecursosRecurrentesFieldHandler extends NoteFieldHandler{
    constructor(tp: any, folder: string, plugin: any) {
      super(tp, folder, plugin); // Llama al constructor de la clase padre
    }
  }