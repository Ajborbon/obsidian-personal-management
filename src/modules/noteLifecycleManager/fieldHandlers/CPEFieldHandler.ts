import { NoteFieldHandler } from './NoteFieldHandler'; // Asegúrate de importar NoteFieldHandler si es necesario

export class ContenidoParaEstudioFieldHandler extends NoteFieldHandler{
    constructor(tp: any, folder: string, plugin: any) {
      super(tp, folder, plugin); // Llama al constructor de la clase padre
    }
  }