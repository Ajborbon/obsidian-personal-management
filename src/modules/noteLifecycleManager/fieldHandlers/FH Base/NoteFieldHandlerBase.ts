import { NoteFieldHandlerBase } from '../../Interfaces/NoteFieldHandlerBase';
import { TFile } from 'obsidian';
import { FieldHandlerUtils } from '../../FieldHandlerUtils';

export class NoteFieldHandlerBase implements NoteFieldHandlerBase{
  private tp: any;
  private infoSubsistema: any;
  private suggester: any;
  private prompt: any;
  private fechaAgr: string;
  private plugin: any; 

  constructor(tp: any, infoSubsistema: any, plugin: any) {
    this.tp = tp;
    this.infoSubsistema = infoSubsistema;
    this.suggester = tp.system.static_functions.get("suggester");
    this.prompt = tp.system.static_functions.get("prompt");
    this.plugin = plugin; // Almacenar la instancia del plugin 
    this.nota = {}; // Inicializar la nota
  }

  async getId(): Promise<number> {
    let maxId = 0;
    const files = app.vault.getMarkdownFiles();
    const registrosExistentes = files.filter(file => file.path.startsWith(this.infoSubsistema.folder));
    registrosExistentes.forEach((file: any) => {
      const metadata = app.metadataCache.getFileCache(file)?.frontmatter;
      if (metadata && metadata.id && !isNaN(metadata.id)) {
        const id = parseInt(metadata.id);
        if (id > maxId) maxId = id;
      }
    });
    return maxId + 1;
  }

  async getFecha(): Promise<string> {
    const currentDate = new Date().toISOString().slice(0, 10);
    const currentDay = new Date().toLocaleDateString('es-ES', { weekday: 'long' });
    const formattedDate = `${currentDate} ${currentDay}`;
    this.nota.fecha = formattedDate;
    return formattedDate;
}

  async getAliases(): Promise<string[]> {
    const id = await this.getId();
    return [`${this.infoSubsistema.typeName} ${id}`];
  }

  async getRename(): Promise<string> {
    const fecha = this.nota.fecha;
    const newName = `${this.infoSubsistema.folder}/${this.infoSubsistema.typeName} ${fecha}.md`;
    await FieldHandlerUtils.crearCarpeta(this.infoSubsistema.folder);

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
          throw new Error("Proceso cancelado por el usuario."); // Lanzamos una excepción para detener la creación
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
      throw error; // Lanzamos la excepción para detener la creación
    }
  }


  async getEstado(): Promise<string> {
    return '🟢';
  }

  async getNota(): Promise<any> {
    return this.nota;
}

}