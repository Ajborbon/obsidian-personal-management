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
import {SeleccionModal} from "../../modales/seleccionModal"
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
    const modalMenu1 = new SeleccionModal(app, opcionesTitulo, valoresOpcion, placeholder);
  
    try {
      const selection = await modalMenu1.openAndAwaitSelection();
      registro.tipoRegistro = selection;
  
      switch (registro.tipoRegistro) {
        case "Nota":
          if (registro.activo) {
            registro.titulo = registro.nombre;
            registro.siAsunto = true;
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

  async encontrarTareasPendientes(
    app: App
  ): Promise<{ tarea: string; archivo: TFile }[]> {
    let tareasPendientes: { tarea: string; archivo: TFile }[] = [];
    const archivos = app.vault.getMarkdownFiles();
    const archivosRelevantes = archivos.filter(
      (archivo: { path: string }) => !archivo.path.includes("Plantillas")
    );

    for (const archivo of archivosRelevantes) {
      const contenido = await app.vault.read(archivo);
      const coincidencias = contenido.match(/^ *- \[\/\] .*/gm) || [];

      // Para cada tarea encontrada, crea un objeto con la tarea limpia y el archivo actual, y lo agrega al arreglo
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
    tareasPendientes: any
  ) {
    const placeholder = "Elige la tarea que vas a registrar.";

    // Map para extraer y limpiar solo las tareas
    let promesasLimpias = tareasPendientes.map((tareaObj: { tarea: string }) =>
      this.limpiarTextoTarea(tareaObj.tarea)
    );

    try {
      // Espera a que todas las promesas en promesasLimpias se resuelvan
      const tareasLimpias = await Promise.all(promesasLimpias);

      // Reconstruir los objetos con las tareas limpias manteniendo la referencia al archivo
      const tareasLimpiasConArchivo = tareasPendientes.map(
        (tareaObj: { archivo: any }, index: string | number) => {
          return {
            tarea: tareasLimpias[index], // Tarea limpia
            archivo: tareaObj.archivo, // Referencia al archivo original
          };
        }
      );

      // Estas dos líneas me generan un arreglo de indices para suministrar el valor al modal.
      const longitud = tareasLimpiasConArchivo.length;
      const arregloDeIndices = Array.from(
        { length: longitud },
        (_, indice) => indice
      );

      const modalMenu = new SeleccionModal(
        app,
        tareasLimpiasConArchivo.map((b: { tarea: any }) => b.tarea),
        arregloDeIndices,
        placeholder
      );
      try {
        // Espera a que el usuario haga una selección en el modal
        const selectedIndex = await modalMenu.openAndAwaitSelection();

        // Asegúrate de que la selección corresponda al índice correcto en tareasLimpiasConArchivo
        const seleccion = tareasLimpiasConArchivo[selectedIndex];
        registro.titulo = seleccion.tarea; // o cómo hayas decidido manejar la selección limpia
        registro.nombre = seleccion.archivo.basename;
        registro.siAsunto = true;
      } catch (error) {
        // Este bloque catch maneja errores o cierre del modal sin selección
        registro.detener = true;
        console.error("Error o modal cerrado sin selección:", error);
      }
    } catch (error) {
      // Este bloque catch maneja errores en la limpieza de tareas
      console.error("Hubo un error al limpiar las tareas:", error);
    }
  }

  limpiarTextoTarea(titulo: string): Promise<string> {
    return new Promise((resolve) => {
      // Elimina todo después del primer salto de línea.
      let textoLimpio = titulo.split("\n")[0];

      // Elimina los tags de estilo Markdown.
      textoLimpio = textoLimpio.replace(/#[\w-/]+/g, "");

      // Elimina los campos de estilo Dataview.
      textoLimpio = textoLimpio.replace(/\[\w+::[^\]]+\]/g, "");

      // Elimina el patrón " - [/]" al inicio de la cadena, incluyendo posibles espacios antes o después.
      textoLimpio = textoLimpio.replace(/^\s*-\s*\[\/\]\s*/, "");

      // Reemplaza caracteres no permitidos en nombres de archivo con un guion bajo o algún otro caracter seguro.
      const caracteresNoPermitidos = /[<>:"\/\\|?*\x00-\x1F]/g;
      textoLimpio = textoLimpio.replace(caracteresNoPermitidos, "_");

      // Reemplaza espacios múltiples por un único espacio para evitar nombres de archivo excesivamente largos.
      textoLimpio = textoLimpio.replace(/\s+/g, " ");

      // Retorna el texto limpio, ahora envuelto en una promesa.
      resolve(textoLimpio.trim());
    });
  }

  async construirNombreyAlias(registro: any, app: App) {
    // Construir la ruta base para el nombre del archivo
    let nombreBase = `${registro.folder}/RT - ${registro.id}`;
  
    // Limpiar y recortar el título para formar el alias base
    let aliasBase = this.limpiarAlias(registro.titulo);
    aliasBase = aliasBase.length > 195 ? aliasBase.slice(0, 195) : aliasBase;
  
    // Variable que usaremos para construir el alias actual
    let aliasLimpio = aliasBase;
    
    // Buscar en todos los archivos de la bóveda aquellos que pertenezcan a la carpeta y tengan el mismo título
    const archivos = app.vault.getFiles();
    let registrosConMismoTitulo = [];
    for (const archivo of archivos) {
      if (archivo.path.startsWith(registro.folder)) {
        const metadatos = app.metadataCache.getFileCache(archivo);
        if (
          metadatos &&
          metadatos.frontmatter &&
          metadatos.frontmatter.titulo === registro.titulo
        ) {
          const idSec = metadatos.frontmatter.idSec;
          if (idSec !== undefined) {
            registrosConMismoTitulo.push({ archivo, idSec });
          }
        }
      }
    }
  
    // Ordenar los registros encontrados por idSec en orden descendente
    registrosConMismoTitulo.sort((a, b) => b.idSec - a.idSec);
  
    // Calcular el idSec para el registro actual
    registro.idSec =
      registrosConMismoTitulo.length > 0
        ? parseInt(registrosConMismoTitulo[0].idSec) + 1
        : 1;
    
    // Si hay más de una sesión, se añade el idSec al alias
    if (registro.idSec > 1) {
      aliasLimpio += ` - ${registro.idSec}`;
    }
    
    const nuevoAlias = `RT - ${aliasLimpio}`;
  
    // Si ya existen aliases en el registro, se conservan; si no, se inicializa el arreglo.
    if (!Array.isArray(registro.aliases)) {
      registro.aliases = [];
    }
  
    // Cuando hay sesión anterior, eliminamos de registro.aliases cualquier alias
    // que sea del mismo "alias base" con una sesión anterior (por ejemplo, "RT - PGTD - 47 - 2")
    // usando una comprobación que filtre los que comiencen con "RT - {aliasBase} - " y sean distintos al nuevoAlias.
    if (registro.idSec > 1) {
      registro.aliases = registro.aliases.filter(a => {
        if (a.startsWith(`RT - ${aliasBase} - `) && a !== nuevoAlias) {
          return false;
        }
        return true;
      });
    }
  
    // Agregar el alias para la sesión actual si no está ya presente, colocándolo al inicio.
    if (!registro.aliases.includes(nuevoAlias)) {
      registro.aliases.unshift(nuevoAlias);
    }
  
    // Si el tipo de registro es "Nota", intentar obtener los aliases del archivo activo
    // y agregarlos (con prefijo) sin duplicar lo que ya existe.
    if (registro.tipoRegistro === "Nota") {
      const archivoActivo = app.workspace.getActiveFile();
      if (archivoActivo) {
        const metadatosActivo = app.metadataCache.getFileCache(archivoActivo);
        const aliasesActivo =
          metadatosActivo && metadatosActivo.frontmatter
            ? metadatosActivo.frontmatter.aliases
            : undefined;
        if (aliasesActivo) {
          const additionalAliases = Array.isArray(aliasesActivo)
            ? aliasesActivo
            : [aliasesActivo];
          additionalAliases.forEach((alias) => {
            const aliasConPrefijo = `RT - ${alias}`;
            if (!registro.aliases.includes(aliasConPrefijo)) {
              registro.aliases.push(aliasConPrefijo);
            }
          });
        }
      }
    }
  
    // Asigna el nombre base (ruta) para el archivo
    registro.nameFile = nombreBase;
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