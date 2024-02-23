import { App, TFile, TFolder, Modal, FuzzySuggestModal, FuzzyMatch, Notice } from "obsidian";
import {SeleccionModal} from "../../modales/seleccionModal";
import {fuzzySelectOrCreate} from "../../modales/fuzzySelectOrCreate";

interface GrupoActividad {
    grupo: string;
    actividad: string;
}

export class menuOtro {
    
    pathCampos: string = "Estructura/Campos Sistema Gestion/Campos Registro Tiempo.md";
    selectedActivity: string ="";
    selectedGroup: string = "";
    plugin: Plugin;
    
    constructor(plugin: Plugin) {
        this.plugin = plugin;
        this.fuzzySelectOrC = new fuzzySelectOrCreate(this.app, plugin);
      }
    
      async menuOtro (app: App, registro: any){
        const opcionesOtro = ["Habituales", "Ninguno", "Areas de Vida", "Areas de Interés", "Proyectos de Q", "Proyectos GTD", "Tema de Interés", "Recurso Recurrente", "Buscar"] ;
        const valoresOtro = ["hab", "nin", "actsAV", "actsAI", "actsPQ", "actsPGTD", "actsTI", "actsRR", "bus"];
        const placeholderOtro = "¿Que categoria?";
        const modalOtro = new SeleccionModal(app, opcionesOtro, valoresOtro, placeholderOtro);
        let temaOtro:{grupo:string;actividad:string,nombre:string};
        let siAsunto: boolean = false;
        try {
            const selectionOtro = await modalOtro.openAndAwaitSelection();
            switch(selectionOtro) {
                  
                case "hab":
                    temaOtro = await this.habitual(app);
                    break;
                case "nin":
                    temaOtro = await this.ninguno(app);
                    break;
                case "actsAV":
                case "actsAI":
                case "actsPQ":
                case "actsPGTD":
                case "actsTI":
                case "actsRR":
                    temaOtro = await this.elemSG(app,selectionOtro); 
                    siAsunto = true;
                    break;
                case "bus":
                    
                    break;
                    }
             } catch (error) {
            console.error("Error o modal cerrado sin selección:", error);
            registro.detener = true;
            return error;
            }
            return {titulo: temaOtro.actividad + " / " + temaOtro.grupo, siAsunto ,nombre: temaOtro.nombre}
        }

        async habitual (app: App){

        }

        async ninguno (app: App){

        }

        async  elemSG (app: App, tipo : string): Promise<any>{
            const actividades = await this.resultYaml(app, tipo)
            debugger
            const activeSG = await this.findMainFilesWithState(app,tipo)
            // Extrae el primer alias de cada nota encontrada y los almacena en un array
            
            const groups = activeSG.map(page => page.frontmatter.aliases ? page.frontmatter.aliases[0] : null).filter(alias => alias !== null);
            // Filtrar y preparar las actividades existentes para la búsqueda
            let itemsForSearch = actividades
            .filter((item) => groups.includes(item.grupo)) // Usa la propiedad 'grupo' en lugar de item[0]
            .map((item) => ({
                value: `${item.actividad} / ${item.grupo}`, // Cambia el orden si es necesario
                activity: item.actividad, // Usa la propiedad 'actividad' en lugar de item[1]
                group: item.grupo,
                // Usa la propiedad 'grupo' en lugar de item[0]
            }));
            // Mostramos el modal con las opciones de búsqueda

            let eleccion = await this.fuzzySelectOrC.showFuzzySearchModal(itemsForSearch, groups, tipo);
            const foundElement = activeSG.find(b => b.frontmatter.aliases[0] === eleccion[1]);
            // Si se encuentra el elemento, devolver frontmatter.aliases[1]
            let alias = foundElement?.file.path;
            let objEleccion = {grupo: eleccion[1], actividad: eleccion[0], nombre: alias};
            return objEleccion;     
        }

        async buscar (app: App){

        }

        async  resultYaml(app: App, tema: string): Promise<GrupoActividad[]> {
            // Encuentra el archivo por su ruta
            const file = app.vault.getAbstractFileByPath(this.pathCampos);
            try {
                if (file instanceof TFile) {
                    // Usa metadataCache para obtener los metadatos del archivo
                    const metadata = app.metadataCache.getFileCache(file);

                    // Accede al front matter (YAML) del archivo y obtiene el arreglo basado en el tema
                    const arregloResult = metadata?.frontmatter?.[tema] || [];

                    // Construye el arreglo de objetos resultado basado en la estructura de GrupoActividad
                    const resultado: GrupoActividad[] = [];

                    // Rellena el arreglo con los datos del arregloResult
                    if (Array.isArray(arregloResult)) {
                        arregloResult.forEach(item => {
                            if (Array.isArray(item) && item.length >= 2) {
                                resultado.push({ grupo: item[0], actividad: item[1] });
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

        // Esta función encuentra los archivos de subsistemas y cuyo estado es 🟢
        async findMainFilesWithState(app, tipo) {
            
            const propertiesTipo = {
                actsAV: {
                  folder: this.plugin.settings.folder_AreasVida,
                  sameName: true, 
                  nameFile: this.plugin.settings.nameFile_AreasVida
                },
                actsAI: {
                    folder: this.plugin.settings.folder_AreasInteres,
                    sameName: true,
                    nameFile: this.plugin.settings.nameFile_AreasInteres
                  },
                actsPQ: {
                  folder: this.plugin.settings.folder_ProyectosQ,
                  sameName: false,
                  nameFile: ""
                },
                actsPGTD: {
                    folder: this.plugin.settings.folder_ProyectosGTD,
                    sameName: false,
                    nameFile: ""
                  },
                actsTI: {
                      folder: this.plugin.settings.folder_TemasInteres,
                      sameName: false,
                      nameFile: ""
                    },
                actsRR: {
                    folder: this.plugin.settings.folder_RecursosRecurrentes,
                    sameName: false,
                    nameFile: ""
                  },
                // Puedes continuar añadiendo más casos aquí
              };
            
             // Asegúrate de que tipo es una propiedad válida antes de desestructurar
             if (propertiesTipo.hasOwnProperty(tipo)) {
                const { folder, sameName, nameFile } = propertiesTipo[tipo];
                const filesInFolder = app.vault.getFiles().filter(file => file.path.startsWith(folder));
                const filesWithFrontmatter = [];
        
                for (const file of filesInFolder) {
                    if ((sameName && file.basename === nameFile) || !sameName) {
                        const metadata = app.metadataCache.getFileCache(file);
                        if (metadata.frontmatter && metadata.frontmatter.estado === "🟢") {
                            filesWithFrontmatter.push({ file: file, frontmatter: metadata.frontmatter });
                        }
                    }
                }
                return filesWithFrontmatter;
            } else {
                console.log("Selección no reconocida:", tipo);
                return []; // Manejar según tu lógica de aplicación
            }
         }

}
