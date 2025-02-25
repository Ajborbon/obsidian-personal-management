/*
 * Filename: /src/modules/moduloRegistroTiempo/API/utilsAPI.ts
 * Path: /src/modules/moduloRegistroTiempo/API
 * Created Date: 2024-03-05 17:02:34
 * Author: Andrés Julián Borbón
 * -----
 * Last Modified: 2025-02-23 17:43:58
 * Modified By: Andrés Julián Borbón
 * -----
 * Copyright (c) 2025 - Andrés Julián Borbón
 */


import { App, TFile, TFolder, Modal, FuzzySuggestModal, FuzzyMatch, Notice } from "obsidian";
import {SeleccionModalTareas} from "../../modales/seleccionModalTareas"
import {menuOtro} from './menuOtro'
import { registroTiempoAPI } from "./registroTiempoAPI";

export class utilsAPI {
  private menuOtro: menuOtro;
  plugin: Plugin;

  constructor(plugin: Plugin) {
    this.plugin = plugin;
    this.menuOtro = new menuOtro(plugin);
  }
  // La declaración del método estaba asi: buscarRegistrosActivos(app: App, registro: any)
  // Devuelve el file del registro activo. Utilizado para cuando necesito obtener el dato solamente de si hay algún registro activo.
  async buscarRegistrosActivos(app: App): Promise<TFile | null> {
    const files = app.vault.getMarkdownFiles();
    const folder = this.plugin.settings.folder_RegistroTiempo;
    for (let file of files) {
      if (file.path.startsWith(folder)) {
        // Obtener los metadatos del archivo desde metadataCache
        const metadata = app.metadataCache.getFileCache(file);

        // Verificar si el frontmatter contiene el campo "estado" con el valor "🟢"
        if (metadata?.frontmatter?.estado === "🟢") {
          return file;
        }
      }
    }
    return;
  }

  // Suponemos que esta función se ubicará en algún lugar donde pueda acceder a `app` de Obsidian.
  async crearObjetoRegistro(plugin: Plugin) {
    const activo = plugin.app.workspace.getActiveFile();
    if (!activo) {
      // Retornar un objeto registro predeterminado sin archivo activo
      return {
        activo: null,
        nombre: "Registro sin archivo activo",
        folder: plugin.settings.folder_RegistroTiempo,
        indice: plugin.settings.indice_RegistroTiempo,
        id: null,
        fecha: this.formatearFecha(new Date()),
        indice_DVJS: `"${plugin.settings.indice_RegistroTiempo}"`,
        aliases: [] // o incluso podrías asignar algún alias por defecto si lo deseas
      };
    }
  
    const folder = plugin.settings.folder_RegistroTiempo;
    const indice = plugin.settings.indice_RegistroTiempo;
  
    let maxId = 0;
    const files = plugin.app.vault.getMarkdownFiles();
    const registrosExistentes = files.filter((file: { path: string }) =>
      file.path.startsWith(folder)
    );
  
    registrosExistentes.forEach((file: any) => {
      const metadata = plugin.app.metadataCache.getFileCache(file)?.frontmatter;
      if (metadata && metadata.id && !isNaN(metadata.id)) {
        const id = parseInt(metadata.id);
        if (id > maxId) maxId = id;
      }
    });
  
    const nextId = maxId + 1;
    const fechaCompleta = this.formatearFecha(new Date());
  
    // Obtener los metadatos del archivo activo para extraer aliases
    const metadataActivo = plugin.app.metadataCache.getFileCache(activo);
    const aliases =
      metadataActivo && metadataActivo.frontmatter && metadataActivo.frontmatter.aliases
        ? metadataActivo.frontmatter.aliases
        : [];
  
    return {
      activo,
      nombre: activo.basename,
      folder,
      indice,
      id: nextId,
      fecha: fechaCompleta,
      indice_DVJS: `"${indice}"`,
      aliases, // Se agrega el campo aliases al registro
    };
  }

  formatearFecha(fecha: Date): string {
    const offset = fecha.getTimezoneOffset() * 60000;
    const fechaLocal = new Date(fecha.getTime() - offset);
    const fechaFormato = fechaLocal.toISOString().split("T")[0];
    const dias = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
    ];
    const diaSemana = dias[fecha.getDay()];
    const horaFormato = fecha.toTimeString().split(" ")[0].substring(0, 5);
    return `${fechaFormato} ${diaSemana} ${horaFormato}`;
  }

  // Método que verifica si hay registros ACtivos y pregunta si quiere cerrarlos.
  async verificarTareasActivas(registro: any, app: App): Promise<void> {
    const files = app.vault.getMarkdownFiles();
    const tareasActivas = [];

    for (let file of files) {
      if (file.path.startsWith(registro.folder)) {
        const metadata = app.metadataCache.getFileCache(file)?.frontmatter;
        if (metadata?.estado === "🟢") {
          tareasActivas.push({
            file,
            titulo: metadata.titulo,
            aliases: metadata.aliases || file.basename,
          });
        }
      }
    }

    if (tareasActivas.length === 1) {
      const tareaActiva = tareasActivas[0];
      const deseaDetener = await this.mostrarSugerencia(
        `La tarea ${tareaActiva.aliases} está corriendo. ¿Desea detenerla?`
      );
      if (deseaDetener === undefined) {
        new Notice(`Creación de registro cancelado por el usuario.`);
        registro.detener = true;
        return;
      }

      if (deseaDetener) {
        debugger;
        const registroTiempoAPInstance = new registroTiempoAPI(this.plugin);
        await registroTiempoAPInstance.cerrarRegistro(tareaActiva.file);
        registro.detener = false;
      } else {
        new Notice(`La tarea ${tareaActiva.aliases} seguirá registrándose.`);
        registro.detener = true;
        return;
      }
    } else if (tareasActivas.length > 1) {
      new Notice(
        "Hay un error con la cantidad de tareas corriendo en este momento."
      );
      registro.detener = true;
    } else {
      console.log("No hay más tareas corriendo.");
      registro.detener = false;
    }
  }

  mostrarSugerencia(mensaje: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      let seleccionado = false; // Indica si se ha hecho una selección

      const modal = new Modal(app);
      modal.contentEl.createEl("h1", { text: mensaje });

      // Crear contenedor para botones
      const buttonsContainer = modal.contentEl.createEl("div");

      // Función auxiliar para manejar selecciones y cerrar el modal adecuadamente
      const hacerSeleccion = (seleccion: boolean) => {
        seleccionado = true; // Marcar que se ha hecho una selección
        modal.close(); // Cerrar el modal
        resolve(seleccion); // Resolver la promesa con la selección
      };

      // Botón Sí
      const yesButton = buttonsContainer.createEl("button", {
        text: "Sí",
      });
      yesButton.addEventListener("click", () => hacerSeleccion(true));

      // Botón No
      const noButton = buttonsContainer.createEl("button", {
        text: "No",
      });
      noButton.addEventListener("click", () => hacerSeleccion(false));

      modal.onClose = () => {
        if (!seleccionado) {
          // Si el modal se cierra sin que se haya hecho una selección, rechazar la promesa
          reject(new Error("Modal cerrado sin selección"));
        }
      };

      // Agregar escuchas de eventos de teclado para permitir la navegación con el teclado
      modal.contentEl.addEventListener("keydown", (e: { key: any }) => {
        switch (e.key) {
          case "ArrowLeft":
            yesButton.focus();
            break;
          case "ArrowRight":
            noButton.focus();
            break;
          case "Enter":
            // Simula clic en el botón enfocado
            document.activeElement?.click();
            break;
        }
      });

      // Enfocar inicialmente el botón 'Sí' para permitir la navegación con teclado desde el inicio
      yesButton.focus();

      modal.open();
    });
  }

  async definirTipoRegistro(registro: any, app: App) {
    const totTareas = await this.encontrarTareasPendientes(app);
    let opcionesTitulo: string[];
    let valoresOpcion: string[];
  
    if (registro.activo) {
      // Si hay archivo activo, se determina el valorMostrar basado en aliases o nombre.
      let valorMostrar: string;
      if (registro.aliases && registro.aliases.length >= 2) {
        valorMostrar = registro.aliases[1];
      } else if (registro.aliases && registro.aliases.length >= 1) {
        valorMostrar = registro.aliases[0];
      } else {
        valorMostrar = registro.nombre;
      }
      if (totTareas.length > 0) {
        opcionesTitulo = [valorMostrar, "Alguna tarea en Ejecución", "Otro"];
        valoresOpcion = ["Nota", "Tarea", "Otro"];
      } else {
        opcionesTitulo = [valorMostrar, "Otro"];
        valoresOpcion = ["Nota", "Otro"];
      }
    } else {
      // Si no hay archivo activo, se omite valorMostrar.
      if (totTareas.length > 0) {
        opcionesTitulo = ["Alguna tarea en Ejecución", "Otro"];
        valoresOpcion = ["Tarea", "Otro"];
      } else {
        opcionesTitulo = ["Otro"];
        valoresOpcion = ["Otro"];
      }
    }
  
    const placeholder = "¿Sobre qué es el registro de tiempo?";
    const modalMenu1 = new SeleccionModalTareas(app, opcionesTitulo, valoresOpcion, placeholder);
  
    try {
      const selection = await modalMenu1.openAndAwaitSelection();
      registro.tipoRegistro = selection;
  
      switch (registro.tipoRegistro) {
        case "Nota":
          if (registro.activo) {
            registro.titulo = registro.nombre;
            registro.siAsunto = true;
            registro.tarea = false;
            registro = this.copiarCampos(registro);
          } else {
            new Notice("No hay nota activa para asignar");
            registro.tipoRegistro = "Otro";
          }
          break;
        case "Tarea":
          await this.elegirTareaParaRegistro(app, registro, totTareas);
          break;
        default:
          let respuesta = await this.menuOtro.menuOtro(app, registro);
          Object.assign(registro, respuesta);
          break;
      }
    } catch (error) {
      console.error("Error o modal cerrado sin selección:", error);
      // Aquí se podría manejar el caso de cierre sin selección, por ejemplo, estableciendo registro.detener.
    }
  }

  copiarCampos(registro){
    let nombre = registro.activo.basename;
    let nota = app.metadataCache.getFileCache(registro.activo);
        // VERIFICACION DE PROYECTOS DE Q Y PROYECTO GTD
        if (nota.frontmatter?.type === "PQ"){ 
          // CUANDO LA NOTA ACTIVA ES UN PQ.
          registro.proyectoQ = nombre;                                
          // VERIFICACION DE PROYECTOSGTD
          // Inicializamos registro.proyectoGTD con un valor predeterminado de cadena vacía
          registro.proyectoGTD = "";
          // Verificamos si nota.proyectoGTD existe y es un arreglo
          if (Array.isArray(nota.frontmatter.proyectoGTD)) {
              // Si es un arreglo, iteramos sobre cada elemento
              registro.proyectoGTD = nota.frontmatter.proyectoGTD.map(elemento => 
                  elemento.replace(/\[\[\s*|\s*\]\]/g, ''));
          } else if (nota.frontmatter.proyectoGTD) {
              // Si existe pero no es un arreglo, aplicamos el regex directamente
              registro.proyectoGTD = nota.frontmatter.proyectoGTD.replace(/\[\[\s*|\s*\]\]/g, '');
          }
          // Si nota.proyectoGTD no existe, registro.proyectoGTD ya está establecido en "" por defecto
          // Obtener ProyectoQ y Proyecto GTD cuando la nota es ProyectoGTD.
           } else if (nota.frontmatter?.type === "PGTD"){
           
           // CUANDO LA NOTA ACTIVA ES UN GTD.
           // VERIFICACION DE PROYECTOSGTD
           registro.proyectoGTD = [nombre];

           if (Array.isArray(nota.frontmatter.proyectoGTD)) {
               // Si es un arreglo, utilizamos concat para añadir los elementos ya procesados con el regex al arreglo registro.proyectoGTD
               registro.proyectoGTD = registro.proyectoGTD.concat(nota.frontmatter.proyectoGTD.map(elemento => 
                   elemento.replace(/\[\[\s*|\s*\]\]/g, '')));
           } else if (nota.frontmatter.proyectoGTD) {
               // Si existe pero no es un arreglo, aplicamos el regex directamente y usamos push para agregarlo a registro.proyectoGTD
               registro.proyectoGTD.push(nota.frontmatter.proyectoGTD.replace(/\[\[\s*|\s*\]\]/g, ''));
           }
           
           // Si nota.proyectoGTD no existe, registro.proyectoGTD ya está establecido en "" por defecto
           registro.proyectoQ = "";
           if (Array.isArray(nota.frontmatter.proyectoQ)) {
              // Si es un arreglo, iteramos sobre cada elemento
              registro.proyectoQ = nota.frontmatter.proyectoQ.map(elemento => 
                  elemento.replace(/\[\[\s*|\s*\]\]/g, ''));
          } else if (nota.frontmatter.proyectoQ) {
              // Si existe pero no es un arreglo, aplicamos el regex directamente
              registro.proyectoQ = nota.frontmatter.proyectoQ.replace(/\[\[\s*|\s*\]\]/g, '');
          }


           }
           // Obtener ProyectoQ y Proyecto GTD cuando la nota es otra cosa que no es proyecto
           else{

              registro.proyectoQ = "";
              if (Array.isArray(nota?.frontmatter?.proyectoQ)) {
                  // Si es un arreglo, iteramos sobre cada elemento
                  registro.proyectoQ = nota.frontmatter.proyectoQ.map(elemento => 
                      elemento.replace(/\[\[\s*|\s*\]\]/g, ''));
              } else if (nota?.frontmatter?.proyectoQ) {
                  // Si existe pero no es un arreglo, aplicamos el regex directamente
                  registro.proyectoQ = nota.frontmatter.proyectoQ.replace(/\[\[\s*|\s*\]\]/g, '');
              }

              registro.proyectoGTD = "";
              // Verificamos si nota.proyectoGTD existe y es un arreglo
              if (Array.isArray(nota?.frontmatter?.proyectoGTD)) {
                  // Si es un arreglo, iteramos sobre cada elemento
                  registro.proyectoGTD = nota.frontmatter.proyectoGTD.map(elemento => 
                      elemento.replace(/\[\[\s*|\s*\]\]/g, ''));
              } else if (nota?.frontmatter?.proyectoGTD) {
                  // Si existe pero no es un arreglo, aplicamos el regex directamente
                  registro.proyectoGTD = nota.frontmatter.proyectoGTD.replace(/\[\[\s*|\s*\]\]/g, '');
              }

          }
          // Verificamos areaInteres 
          registro.areaInteres = [];
          if (Array.isArray(nota?.frontmatter?.areaInteres)) {
              // Si es un arreglo, iteramos sobre cada elemento (excluyendo el primer elemento ya agregado que es nota.titulo)
              // y aplicamos el regex a cada elemento. Luego concatenamos con el array existente.
              registro.areaInteres = registro.areaInteres.concat(nota.frontmatter.areaInteres.map(elemento => 
                  elemento.replace(/\[\[\s*|\s*\]\]/g, '')));
          } else {
              // Si no es un arreglo, revisamos si nota.frontmatter.areaInteres existe
              if (nota?.frontmatter?.areaInteres) {
                  // Si existe, aplicamos el regex y lo añadimos como segundo elemento
                  registro.areaInteres.push(nota.frontmatter.areaInteres.replace(/\[\[\s*|\s*\]\]/g, ''));
              }
          }
          // Verificamos AreaVida
          registro.areaVida = "";
          if (nota?.frontmatter?.areaVida) {
              if (Array.isArray(nota.frontmatter.areaVida)) {
                  // Es un arreglo, usa el primer elemento
                  registro.areaVida = nota.frontmatter.areaVida[0].replace(/\[\[\s*|\s*\]\]/g, '');
              } else if (typeof nota.frontmatter.areaVida === 'string') {
                  // Es un string
                  registro.areaVida = nota.frontmatter.areaVida.replace(/\[\[\s*|\s*\]\]/g, '');
              }
          } else {
              // No está definido o está vacío
              registro.areaVida = "No es de ningún Area de Vida";
          }
          return registro;
  }

  async encontrarTareasPendientes(app: App): Promise<{ tarea: string; archivo: TFile }[]> {
    let tareasPendientes: { tarea: string; archivo: TFile }[] = [];
    const archivos = app.vault.getMarkdownFiles();
    
    // Excluir archivos que están en carpetas indeseadas
    const archivosRelevantes = archivos.filter((archivo: TFile) => {
      return !archivo.path.includes("Plantillas") && !archivo.path.includes("Estructura/GTD/Sistema GTD/Sistema") && !archivo.path.includes("Archivo");
    });
  
    for (const archivo of archivosRelevantes) {
      const contenido = await app.vault.read(archivo);
      const coincidencias = contenido.match(/^ *- \[\/\] .*/gm) || [];
  
      // Por cada tarea encontrada, se crea un objeto con la tarea limpia y el archivo actual.
      const tareasConArchivo = coincidencias.map((tarea: string) => {
        return { tarea: tarea.trim(), archivo: archivo };
      });
      tareasPendientes = tareasPendientes.concat(tareasConArchivo);
    }
    return tareasPendientes;
  }

async elegirTareaParaRegistro(
  app: App,
  registro: any,
  tareasPendientes: { tarea: string; archivo: TFile }[]
) {
  const placeholder = "Elige la tarea que vas a registrar.";

  // Limpia el texto de cada tarea
  const promesasLimpias = tareasPendientes.map((tareaObj) =>
    this.limpiarTextoTarea(tareaObj.tarea)
  );

  try {
    const tareasLimpias = await Promise.all(promesasLimpias);

    // Construye el listado para el modal: cada opción es el alias (o nombre) concatenado con el texto limpio de la tarea
    const displayOptions: string[] = [];
    const values: number[] = []; // se usará el índice o algún valor identificador

    for (let i = 0; i < tareasPendientes.length; i++) {
      const { tarea, archivo } = tareasPendientes[i];
      const textoTarea = tareasLimpias[i];

      let aliasDisplay = "";
      // Obtener la metadata del archivo para ver si tiene aliases en el frontmatter
      const metadata = app.metadataCache.getFileCache(archivo);
      if (metadata?.frontmatter?.aliases) {
        let aliases = metadata.frontmatter.aliases;
        if (!Array.isArray(aliases)) aliases = [aliases];
        if (aliases.length >= 2) {
          aliasDisplay = aliases[1];
        } else if (aliases.length >= 1) {
          aliasDisplay = aliases[0];
        }
      }
      // Si no se encontró ningún alias, se usa el nombre del archivo
      if (!aliasDisplay) {
        aliasDisplay = archivo.basename;
      }

      // Concatenar el aliasDisplay (o nombre) con el texto de la tarea, separado por " / "
      const displayText = `${aliasDisplay} / ${textoTarea}`;
      displayOptions.push(displayText);
      values.push(i);
    }

    // Crear el modal pasando las opciones concatenadas y usando los índices como valores de selección
    const modalMenu = new SeleccionModalTareas(app, displayOptions, values, placeholder);
    try {
      const selectedIndex = await modalMenu.openAndAwaitSelection();
      // Se obtiene la tarea correspondiente a la opción seleccionada
      const seleccion = tareasPendientes[selectedIndex];
      registro.titulo = await this.limpiarTextoTarea(seleccion.tarea);
      registro.nombre = seleccion.archivo.basename;
      registro.archivoTarea = seleccion.archivo;
      registro.siAsunto = true;
      registro.tarea = true;
      registro = this.copiarCampos(registro);
    } catch (error) {
      registro.detener = true;
      console.error("Error o modal cerrado sin selección:", error);
    }
  } catch (error) {
    console.error("Hubo un error al limpiar las tareas:", error);
  }
}

limpiarTextoTarea(titulo: string): Promise<string> {
  return new Promise((resolve) => {
    // Se toma solo la primera línea
    let textoLimpio = titulo.split("\n")[0];

    // Transforma las secciones que empiezan por "#":
    // Por ejemplo: "#cx/GestiónPersonal/PlanSemanal" se transforma en "cx_GestionPersonal_PlanSemanal"
    textoLimpio = textoLimpio.replace(/#([\w-/]+)/g, (match, p1) => {
      let transformado = p1.replace(/\//g, "_");
      // Elimina acentos usando normalización Unicode
      transformado = transformado.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return transformado;
    });

    // Elimina los campos de estilo Dataview, por ejemplo [campo::valor]
    textoLimpio = textoLimpio.replace(/\[\w+::[^\]]+\]/g, "");

    // Elimina el patrón " - [/]" al inicio de la cadena, con posibles espacios
    textoLimpio = textoLimpio.replace(/^\s*-\s*\[\/\]\s*/, "");

    // Elimina los emojis de Tasks junto con la fecha que viene inmediatamente después.
    // Se asume que la fecha tiene formato YYYY-MM-DD, opcionalmente seguida de hora.
    textoLimpio = textoLimpio.replace(
      /\p{Extended_Pictographic}\s*\d{4}-\d{2}-\d{2}(?:\s*\d{2}:\d{2}(?::\d{2})?)?/gu,
      ""
    );

    // Elimina cualquier otro emoji que quede
    textoLimpio = textoLimpio.replace(/\p{Extended_Pictographic}/gu, "");

    // Elimina cualquier contenido que esté entre corchetes cuadrados (incluyendo los corchetes)
    textoLimpio = textoLimpio.replace(/\[[^\]]*\]/g, "");

    // Reemplaza caracteres no permitidos en nombres de archivo con un guion bajo
    const caracteresNoPermitidos = /[<>:"\/\\|?*\x00-\x1F]/g;
    textoLimpio = textoLimpio.replace(caracteresNoPermitidos, "_");

    // Reemplaza espacios múltiples por un único espacio
    textoLimpio = textoLimpio.replace(/\s+/g, " ");

    resolve(textoLimpio.trim());
  });
}

async construirNombreyAlias(registro: any, app: App) {
  // 1. Calcular el último idSec existente para este título
  const maxIdSec = await this.calcularUltimoIdSec(registro.titulo, registro.folder, app);
  registro.idSec = maxIdSec + 1;
  
  // 2. Definir el sufijo: para idSec > 1 se añade " - idSec", sino queda vacío
  const suffix = registro.idSec > 1 ? ` - ${registro.idSec}` : "";
  
  // 3. Guardar una copia de los aliases originales de la nota
  const originalAliases = Array.isArray(registro.aliases) ? [...registro.aliases] : [];
  
  // 4. Limpiar cualquier prefijo RT para evitar duplicaciones
  function cleanPrefix(value) {
    if (!value) return "";
    return value.replace(/^RT -\s*/, "").trim();
  }
  
  // 5. Crear nuevos aliases según el tipo de registro
  if (!registro.tarea) {
    // CASO 1: Registro directo sobre la nota
    const noteName = cleanPrefix(registro.nombre || "");
    
    // Crear array de nuevos aliases
    const newAliases = [
      `RT - ${noteName}${suffix}` // Alias 0: Nombre de la nota + sufijo
    ];
    
    // Si hay aliases originales, usarlos para el segundo y tercer alias
    if (originalAliases.length >= 1) {
      newAliases.push(`RT - ${cleanPrefix(originalAliases[0])}${suffix}`); // Alias 1: Primer alias de la nota
      
      if (originalAliases.length >= 2) {
        newAliases.push(`RT - ${cleanPrefix(originalAliases[1])}${suffix}`); // Alias 2: Segundo alias de la nota
      }
    }
    
    registro.aliases = newAliases;
  } else {
    // CASO 2: Registro sobre una tarea
    // 1. Obtener metadatos de la nota donde está la tarea
    const metadataNota = app.metadataCache.getFileCache(registro.archivoTarea
      // Este es el archivo donde está la tarea, lo tienes en `registro.nombre` o en alguna propiedad que guarde la referencia
    );
    const taskText = cleanPrefix(registro.titulo || "");
    const noteName = cleanPrefix(registro.nombre || "");
    debugger;
    // 2. Extraer aliases del frontmatter de la nota
    let noteAliases: string[] = [];
    if (metadataNota?.frontmatter?.aliases) {
      noteAliases = Array.isArray(metadataNota.frontmatter.aliases)
        ? metadataNota.frontmatter.aliases
        : [metadataNota.frontmatter.aliases];
    }

    // 3. Construir newAliases usando esos aliases como base
    const newAliases = [
      `RT - ${taskText}${suffix}`,
      `RT - ${noteName} / ${taskText}${suffix}`,
    ];

    // Si la nota original tiene al menos un alias, lo usas para el tercer alias
    if (noteAliases.length > 0) {
      newAliases.push(`RT - ${cleanPrefix(noteAliases[0])} / ${taskText}${suffix}`);
    }

    // 4. Finalmente, asignas `registro.aliases = newAliases;`
    registro.aliases = newAliases;
    registro.descripcion = taskText;
  }
  
  // 6. Definir el nombre final del archivo de registro (asegurarse de que id no sea null)
  if (!registro.id) {
    console.error("Error: registro.id es null o undefined");
    registro.id = Date.now(); // Asignar un valor temporal basado en timestamp para evitar errores
  }
  registro.nameFile = `${registro.folder}/RT - ${registro.id}`;
}

  /**
 * Calcula el último idSec usado para registros con el mismo título en la carpeta especificada.
 */
async calcularUltimoIdSec(titulo: string, folder: string, app: App): Promise<number> {
  const archivos = app.vault.getFiles();
  let max = 0;
  for (const archivo of archivos) {
    if (archivo.path.startsWith(folder)) {
      const metadatos = app.metadataCache.getFileCache(archivo);
      if (metadatos && metadatos.frontmatter && metadatos.frontmatter.titulo === titulo) {
        const idSec = metadatos.frontmatter.idSec;
        if (idSec !== undefined && idSec > max) {
          max = idSec;
        }
      }
    }
  }
  return max;
}

  limpiarAlias(titulo: string) {
    // Reemplaza caracteres no permitidos en nombres de archivo con un guion bajo o algún otro caracter seguro.
    const caracteresNoPermitidos = /[<>:"\/\\|?*\x00-\x1F]/g;
    let tituloLimpio = titulo.replace(caracteresNoPermitidos, "_");

    // Reemplaza espacios múltiples por un único espacio para evitar nombres de archivo excesivamente largos.
    tituloLimpio = tituloLimpio.replace(/\s+/g, " ");

    return tituloLimpio.trim();
  }
}