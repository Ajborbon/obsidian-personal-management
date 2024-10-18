import { AreaVidaFieldHandler } from '../../Interfaces/AreaVidaFieldHandler';
import { TFile, TFolder, Notice } from 'obsidian';
import { FieldHandlerUtils } from '../../FieldHandlerUtils';
import { NoteFieldHandlerBase } from '../FH Base/NoteFieldHandlerBase'; // Asegúrate de importar NoteFieldHandler si es necesario

export class AreaVidaFieldHandler extends NoteFieldHandlerBase implements AreaVidaFieldHandler {
    constructor(tp: any, folder: string, plugin: any) {
      super(tp, folder, plugin); // Llama al constructor de la clase padre
      this.pathCampos = this.plugin.settings.file_camposCentral + ".md";
    }

    async getArea(){
        let area: string | null, grupo: string | null;
        
        let tipoArea = this.infoSubsistema.typeName;
        let nuevaArea = false;
        let areasGrupos =  this.getDuplasFijas(app, tipoArea)
        let areaGrupo = await this.suggester(areasGrupos.map(b=> b.texto), areasGrupos.map(b=> b.texto), false, `¿Cuál ${tipoArea} deseas crear?`)
            // Verificar si el usuario presionó Esc. 
            if (areaGrupo === null) {
                new Notice("Creación de nota cancelada por el usuario.");
                return; // Termina la ejecución de la función aquí.
            } else if (areaGrupo=="Nuevo"){
                clasificacion = await this.prompt("¿Cual es el nombre de la nueva clasificación que vas a ingresar?", "MiClasificación", true)
                // Verificar si el usuario presionó Esc.
                    if (clasificacion === null) {
                        new Notice("Creación de nota cancelada por el usuario.");
                        return; // Termina la ejecución de la función aquí.
                    }

                tagClasificacion = await this.prompt("¿Cual es el tag que utilizaras para " + clasificacion + "?. No utilices espacios en la definición del tag.", "nuevoTag", true)
                // Verificar si el usuario presionó Esc.
                if (tagClasificacion === null) {
                    new Notice("Creación de nota cancelada por el usuario.");
                    return; // Termina la ejecución de la función aquí.
                }
                nuevaClasificacion = true;
            
            }else {
                
                let indice = areasGrupos.findIndex(objeto => objeto.texto === areaGrupo);
                grupo = areasGrupos[indice].grupo;
                area = areasGrupos[indice].area;
                this.nota.grupo = grupo;
                this.nota.titulo = area;
            return {grupo: grupo, titulo: area};
            }
        }


    getDuplasFijas(app: App, area: string): Promise<GrupoActividad[]> {
        // Encuentra el archivo por su ruta
        const file = app.vault.getAbstractFileByPath(this.pathCampos);
        try {
            if (file instanceof TFile) {
                // Usa metadataCache para obtener los metadatos del archivo
                const metadata = app.metadataCache.getFileCache(file);
                // Accede al front matter (YAML) del archivo y obtiene el arreglo basado en el tema
                const arregloResult = metadata?.frontmatter?.[area] || [];
                // Construye el arreglo de objetos resultado basado en la estructura de GrupoActividad
                const resultado = [];

                // Rellena el arreglo con los datos del arregloResult
                if (Array.isArray(arregloResult)) {
                    arregloResult.forEach(item => {
                        if (Array.isArray(item) && item.length >= 2) {
                            resultado.push({ grupo: item[0], area: item[1], texto: item[0]+"/"+item[1]});
                        }
                    });
                }
                
                return resultado;
            }
        } catch (error) {
            console.error("Error obteniendo el archivo de campos:", error);
            // Aquí manejarías el error como sea apropiado para tu aplicación
            throw error; // O devolver un arreglo vacío como resultado de error
        }

        // Devuelve un arreglo vacío si no se encuentra el archivo o si ocurre cualquier otro problema
        return [];
    }
    

    async getFilename(){
        let fileName;
        if (this.infoSubsistema.hasOwnProperty("fileName")){
            const partes = this.infoSubsistema.fileName.split(' -- ');
            this.nota.trimestre = partes[0];
            this.nota.titulo = partes[1];
            this.nota.areaVida = partes[1];
            this.nota.grupo = partes[2];
        }
        fileName = `${this.nota.trimestre} - ${this.nota.titulo}`    
        this.nota.filename = fileName;
            
        return fileName;
    }

    async getTrimestre(){
        let tipoSistema = this.infoSubsistema.type;
        let nombreSistema = this.infoSubsistema.typeName;
        let trimestre;
        //let trimestres = await this.activeStructureResources("Trimestral"); // Funciona en la versión 1.0 de Areas de Vida.
        let trimestres = await FieldHandlerUtils.findMainFilesWithState("TQ",null,this.plugin);
        trimestre = await this.suggester(trimestres.map(b => b.file.basename),trimestres.map(b => b.file.basename), false, `Trimestre del ${nombreSistema}:`);
        // Verificar si el usuario presionó Esc.
        if (trimestre === null) {
        new Notice("Modificación de nota cancelada por el usuario.");
        return; // Termina la ejecución de la función aquí.
        }
        this.nota.trimestre = trimestre;
        return trimestre;
    }

    async getNota(): Promise<any> {
        return this.nota;
    }

    async getRename(){
        debugger;
        let newName, name, folder;      
        newName = `${this.infoSubsistema.folder}/${this.nota.titulo}/${this.nota.filename}.md`
        folder = `${this.infoSubsistema.folder}/${this.nota.titulo}/`
        await FieldHandlerUtils.crearCarpeta(folder);
        const file = this.tp.file.config.target_file;

        const existe = app.vault.getAbstractFileByPath(newName);
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
                        await app.vault.rename(file, newName);
                        console.log("Archivo renombrado con éxito.");
                        return true;
                    }
                }else{
                    console.log("Cancelando la creación del archivo.");
                    throw new Error("Proceso cancelado por el usuario.");
                }  
            }else{
            if (file instanceof TFile){
                await app.vault.rename(file, newName);
                console.log("Archivo renombrado con éxito.");
                return true;
                }
            }
        }catch (error){
            console.error(error)
            throw error;
        }
    }

    async getDescripcion(): Promise<string> {
        const descripcion = await this.prompt(`Descripción del ${this.infoSubsistema.typeName}:`, "", false, true);
        this.nota.descripcion = descripcion;
        return descripcion;
    }

    async getAliases(){
        this.nota.aliases = [];
        this.nota.aliases.push(`${this.infoSubsistema.type}/${this.nota.trimestre}/${this.nota.titulo}`)
        this.nota.aliases.push(`${this.infoSubsistema.type}/${this.nota.grupo}/${this.nota.trimestre}/${this.nota.titulo}`)
        return this.nota.aliases;
    }
}