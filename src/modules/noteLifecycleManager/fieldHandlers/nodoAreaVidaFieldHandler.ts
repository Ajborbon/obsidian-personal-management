import { TFile, TFolder, Notice } from 'obsidian';
import { FieldHandlerUtils } from '../FieldHandlerUtils';
import { NoteFieldHandlerBase } from './NoteFieldHandlerBase'; // Asegúrate de importar NoteFieldHandler si es necesario
import { nodoAreaVidaFieldHandler } from '../Interfaces/nodoAreaVidaFieldHandler';

export class nodoAreaVidaFieldHandler extends NoteFieldHandlerBase implements nodoAreaVidaFieldHandler{
    
    constructor(tp: any, folder: string, plugin: any) {
      super(tp, folder, plugin); // Llama al constructor de la clase padre
      this.pathCampos = this.plugin.settings.file_camposCentral + ".md";
    }

    async getId() { 
        let maxId = 0;
        // Obtén todos los archivos Markdown
        const files = app.vault.getMarkdownFiles();
        let registrosExistentes = files.filter((file: { path: string; }) => file.path.startsWith(this.infoSubsistema.folder));
        // Filtra por los archivos en la carpeta deseada
        registrosExistentes.forEach((file: any) => {
            const metadata = app.metadataCache.getFileCache(file)?.frontmatter;
            if (metadata && metadata.id && !isNaN(metadata.id) && metadata.type && metadata.type === this.infoSubsistema.type) {
                const id = parseInt(metadata.id);
                if (id > maxId) maxId = id;
            }
        });
    }

    async getRename(){
        debugger;
        const file = this.tp.file.config.target_file;
        const partes = file.basename.split(' - ');
        this.nota.grupo = partes[0];
        this.nota.areaVida = partes[1];

        // Obtener la ruta completa del archivo actual
        const fullPath = file.path;

        // Extraer la ruta del directorio sin el nombre del archivo
        const directoryPath = fullPath.substring(0, fullPath.lastIndexOf('/') + 1);

        // Concatenar la ruta del directorio con el nombre del archivo y la extensión .md
        const fileName = `${directoryPath}${partes[1]}.md`;
        
        debugger;
        let newName, folder;      
        
        // newName = `${this.infoSubsistema.folder}/${this.nota.areaVida}/${this.nota.filename}.md`
        // folder = `${this.infoSubsistema.folder}/${this.nota.areaVida}/`
        // await FieldHandlerUtils.crearCarpeta(folder);

        const existe = app.vault.getAbstractFileByPath(fileName);
        debugger;
        try{
            if (existe instanceof TFile){
                let nombreFile = newName?.split("/");

                let borrar = await this.suggester(
                    ["Sobreescribir Archivo Actual", "Detener creación del archivo."],
                    [
                      true,
                      false],
                    true,
                    `¿${nombreFile.pop()} ya existe. Que deseas hacer?`
                  );
                if (borrar){
                    await app.vault.delete(existe);
                    if (file instanceof TFile){
                        await app.vault.rename(file, fileName);
                        console.log("Archivo renombrado con éxito.");
                        return true;
                    }
                }else{
                    console.log("Cancelando la creación del archivo.");
                    throw new Error("Proceso cancelado por el usuario.");
                }  
            }else{
            if (file instanceof TFile){
                await app.vault.rename(file, fileName);
                console.log("Archivo renombrado con éxito.");
                return true;
                }
            }
        }catch (error){
            console.error(error)
            throw error;
        }
    }

    async getNota(): Promise<any> {
        return this.nota;
    }
}