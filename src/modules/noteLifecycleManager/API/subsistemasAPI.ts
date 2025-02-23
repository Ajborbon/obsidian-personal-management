/*
 * Filename: /src/modules/noteLifecycleManager/API/subsistemasAPI.ts
 * Path: /src/modules/noteLifecycleManager/API
 * Created Date: 2024-03-19 13:11:26
 * Author: Andrés Julián Borbón
 * -----
 * Last Modified: 2025-02-23 17:49:33
 * Modified By: Andrés Julián Borbón
 * -----
 * Copyright (c) 2025 - Andrés Julián Borbón
 */

import { TFile, TFolder } from "obsidian";

interface GrupoAV {
  grupo: string;
  av: string;
  texto: string;
}

export class subsistemasAPI {
  constructor(plugin) {
    this.plugin = plugin;
    this.pathCampos = this.plugin.settings.file_camposCentral + ".md";
  }

  // Función para crear y mostrar el botón inicial "Menú hoy"
  async mostrarBotonCrearAV(dv) {
    dv.container.innerHTML = ""; // Limpiar el contenedor

    const botonMenuHoy = document.createElement("button");
    botonMenuHoy.textContent = "Procesar Areas de Vida";
    dv.container.appendChild(botonMenuHoy);

    botonMenuHoy.onclick = async () => {
      await this.procesarAV(dv); // Mostrar los botones adicionales al hacer clic
    };
  }

  async mostrarBotonCrearAVTrimestral(dv) {
    dv.container.innerHTML = ""; // Limpiar el contenedor

    const botonMenuHoy = document.createElement("button");
    botonMenuHoy.textContent = "Procesar Areas de Vida del trimestre";
    dv.container.appendChild(botonMenuHoy);

    botonMenuHoy.onclick = async () => {
      await this.procesarAVTrimestre(dv); // Mostrar los botones adicionales al hacer clic
    };
  }

  async procesarAV(dv) {
    // Obtener Qs para preguntar el Q para el que desea crear las áreas de vida.
    const folderQ = this.plugin.settings["folder_Trimestral"];
    const filesQ = app.vault
      .getMarkdownFiles()
      .filter(
        (file) =>
          file.path.includes(folderQ) &&
          !file.path.includes("Plantillas") &&
          !file.path.includes("Archivo")
      );
    let qCreados = [];

    for (let file of filesQ) {
      let metadata = app.metadataCache.getFileCache(file)?.frontmatter;

      if (metadata?.type === "TQ" && metadata?.trimestre) {
        let qActivo = { file }; // Asumiendo que quieres guardar el path del archivo
        Object.assign(qActivo, metadata); // Agrega el metadata al objeto qActivo
        qCreados.push(qActivo); // Añade el registro activo al array
      }
    }

    let suggester = this.plugin.tp.system.static_functions.get("suggester");
    let q = await suggester(
      qCreados.map((b) => b.trimestre),
      qCreados.map((b) => b),
      true,
      `De que trimestre vamos a procesar tus Areas de Vida`
    );
    const resultadoAV: GrupoAV[] = [];
    const fileCampos = app.vault.getAbstractFileByPath(this.pathCampos);
    try {
      if (fileCampos instanceof TFile) {
        // Usa metadataCache para obtener los metadatos del archivo
        const metadata = app.metadataCache.getFileCache(fileCampos);
        const arregloAV = metadata?.frontmatter?.AreasVida || [];
        // Rellena el arreglo con los datos del arregloResult
        if (Array.isArray(arregloAV)) {
          arregloAV.forEach((item) => {
            if (Array.isArray(item) && item.length >= 2) {
              resultadoAV.push({
                grupo: item[0],
                av: item[1],
                texto: item[0] + " / " + item[1],
              });
            }
          });
        }
      }
    } catch (error) {
      console.error("Error obteniendo el archivo de campos:", error);
      // Aquí manejarías el error como sea apropiado para tu aplicación
      throw error; // O devolver un arreglo vacío como resultado de error
    }

    const allFiles = app.vault.getMarkdownFiles();
    let basePath = this.plugin.settings.folder_AreasVida;

    // -..-> Revisión de escenarios.

    for (let areaVida of resultadoAV) {
      // Verifica si la carpeta existe en la ubicación específica
      const fullFolderPath = `${basePath}/${areaVida.av}`;
      const folder = app.vault.getAbstractFileByPath(fullFolderPath);

      //P0 -> Verifica si la carpeta path/areaVida existe
      //P0 - SI
      if (folder instanceof TFolder) {
        console.log(`La carpeta ${areaVida.av} existe dentro de ${basePath}.`);
        // Ahora, verifica si la nota existe dentro de la carpeta
        const instancesOfAV = app.vault
          .getMarkdownFiles()
          .filter(
            (file) =>
              file.path.includes(fullFolderPath) &&
              !file.path.includes("Plantillas") &&
              !file.path.includes("Archivo")
          );
        // P1 Existe nodeAreaVida?
        const nodeAVExists = instancesOfAV.some(
          (file) => file.basename === areaVida.av
        );

        // P1 SI
        if (nodeAVExists) {
          console.log(
            `La nota ${areaVida.av} existe dentro de la carpeta ${areaVida.av}.`
          );
          // P2 areaVida Q Existe?
          await this.validacionAVQ(fullFolderPath, q, areaVida);
        }
        //P1 - NO (nodeAreaVida no Existe)
        else {
          debugger;
          // Caso 3 y 4
          console.log(
            `La nota ${areaVida.av} no existe dentro de la carpeta ${areaVida.av}.`
          );
          // P3 Agregar Nodo Area Vida?
          let nAV = await this.agregarNodoAreaVida(areaVida); // Quieres Agregar esta AV a tu sistema de Gestión?
          //P3 -> SI
          if (nAV) {
            // P2 .. -> Si y No
            await this.validacionAVQ(fullFolderPath, q, areaVida);
          }
          //P3 -> NO
          else if (nAV == false) {
            continue; //Sentencia que debe pasar al siguiente elemento del ciclo for.
          } else {
            return; // En caso de que se de escape.
          }
        }
      }
      // PO -> NO (La Carpeta no existe)
      else {
        console.log(
          `La carpeta ${areaVida.av} no existe aún dentro de ${basePath}.`
        );
        // P3 Agregar Nodo Area Vida?
        let nAV = await this.agregarNodoAreaVida(areaVida); // Quieres Agregar esta AV a tu sistema de Gestión?
        // P3 -> SI
        if (nAV) {
          // P2
          await this.validacionAVQ(fullFolderPath, q, areaVida);
        }
        //P3 -> NO
        else if (nAV == false) {
          continue; //Sentencia que debe pasar al siguiente elemento del ciclo for.
        }
        // P3 -> Escape
        else {
          return; // En caso de que se de escape.
        }
      }
    } // Fin For AreasVida fileCampos
  } // Fin procesarAV()


  async procesarAVTrimestre(dv) {
    
    let q = {}; 
    q.trimestre = dv.current().trimestre;
    const resultadoAV: GrupoAV[] = [];
    const fileCampos = app.vault.getAbstractFileByPath(this.pathCampos);
    try {
      if (fileCampos instanceof TFile) {
        // Usa metadataCache para obtener los metadatos del archivo
        const metadata = app.metadataCache.getFileCache(fileCampos);
        const arregloAV = metadata?.frontmatter?.AreasVida || [];
        // Rellena el arreglo con los datos del arregloResult
        if (Array.isArray(arregloAV)) {
          arregloAV.forEach((item) => {
            if (Array.isArray(item) && item.length >= 2) {
              resultadoAV.push({
                grupo: item[0],
                av: item[1],
                texto: item[0] + " / " + item[1],
              });
            }
          });
        }
      }
    } catch (error) {
      console.error("Error obteniendo el archivo de campos:", error);
      // Aquí manejarías el error como sea apropiado para tu aplicación
      throw error; // O devolver un arreglo vacío como resultado de error
    }

    const allFiles = app.vault.getMarkdownFiles();
    let basePath = this.plugin.settings.folder_AreasVida;

    // -..-> Revisión de escenarios.

    for (let areaVida of resultadoAV) {
      // Verifica si la carpeta existe en la ubicación específica
      const fullFolderPath = `${basePath}/${areaVida.av}`;
      const folder = app.vault.getAbstractFileByPath(fullFolderPath);

      //P0 -> Verifica si la carpeta path/areaVida existe
      //P0 - SI
      if (folder instanceof TFolder) {
        console.log(`La carpeta ${areaVida.av} existe dentro de ${basePath}.`);
        // Ahora, verifica si la nota existe dentro de la carpeta
        const instancesOfAV = app.vault
          .getMarkdownFiles()
          .filter(
            (file) =>
              file.path.includes(fullFolderPath) &&
              !file.path.includes("Plantillas") &&
              !file.path.includes("Archivo")
          );
        // P1 Existe nodeAreaVida?
        const nodeAVExists = instancesOfAV.some(
          (file) => file.basename === areaVida.av
        );

        // P1 SI
        if (nodeAVExists) {
          console.log(
            `La nota ${areaVida.av} existe dentro de la carpeta ${areaVida.av}.`
          );
          // P2 areaVida Q Existe?
          await this.validacionAVQ(fullFolderPath, q, areaVida);
        }
        //P1 - NO (nodeAreaVida no Existe)
        else {
          debugger;
          // Caso 3 y 4
          console.log(
            `La nota ${areaVida.av} no existe dentro de la carpeta ${areaVida.av}.`
          );
          // P3 Agregar Nodo Area Vida?
          let nAV = await this.agregarNodoAreaVida(areaVida); // Quieres Agregar esta AV a tu sistema de Gestión?
          //P3 -> SI
          if (nAV) {
            // P2 .. -> Si y No
            await this.validacionAVQ(fullFolderPath, q, areaVida);
          }
          //P3 -> NO
          else if (nAV == false) {
            continue; //Sentencia que debe pasar al siguiente elemento del ciclo for.
          } else {
            return; // En caso de que se de escape.
          }
        }
      }
      // PO -> NO (La Carpeta no existe)
      else {
        console.log(
          `La carpeta ${areaVida.av} no existe aún dentro de ${basePath}.`
        );
        // P3 Agregar Nodo Area Vida?
        let nAV = await this.agregarNodoAreaVida(areaVida); // Quieres Agregar esta AV a tu sistema de Gestión?
        // P3 -> SI
        if (nAV) {
          // P2
          await this.validacionAVQ(fullFolderPath, q, areaVida);
        }
        //P3 -> NO
        else if (nAV == false) {
          continue; //Sentencia que debe pasar al siguiente elemento del ciclo for.
        }
        // P3 -> Escape
        else {
          return; // En caso de que se de escape.
        }
      }
    } // Fin For AreasVida fileCampos
  } // Fin procesarAVTrimestre()


  //P2 areaVida Q Existe?
  async validacionAVQ(
    fullFolderPath: string,
    q: any,
    areaVida: any
  ): Promise<void> {
    const pathAVQ = `${fullFolderPath}/${q.trimestre} - ${areaVida.av}.md`;
    const fileAVQ = app.vault.getAbstractFileByPath(pathAVQ);
    debugger;
    // Verificar si el AV de Q Existe
    // P2 SI
    // CASO 4
    // CASO 5
    if (fileAVQ instanceof TFile) {
      let suggester = this.plugin.tp.system.static_functions.get("suggester");
      let nextStep = await suggester(
        [
          "Actualizar estado del AV",
          "Borrar y Crear de nuevo el AV",
          "Dejar el AV como está ",
        ],
        ["upd", "del+cre", "continue"],
        true,
        `¿${q.trimestre} ${areaVida.av} ya existe. Elige una opción:`
      );
      switch (nextStep) {
        case "upd":
          await this.actualizarAVQ(fileAVQ);
          break;
        case "del+cre":
          await this.borrarAVQ(fileAVQ);
          await this.agregarAVQ(areaVida, q.trimestre);
          break;
        case "continue":
          console.log(`Continuar sin hacer nada con ${fileAVQ.basename}`);
          break;
      }
      // Si AV de Q existe (1) muestra el estado y permite cambiarlo.
    }
    // P2 NO
    // ->> CASO 1
    // ->> CASO 3
    // --> CASO 6
    else {
      debugger;
      // Si AV de Q no Existe (2) Agrega AreaVida de Q, preguntando en que estado quiere tener esa AV ese Q
      await this.agregarAVQ(areaVida, q.trimestre);
    }
  }

  // P3 Agregar nodoAreaVida?
  async agregarNodoAreaVida(areaVida) {
    // preguntar primero si si lo desea agregar.

    let suggester = this.plugin.tp.system.static_functions.get("suggester");
    let agregar = await suggester(
      ["Si", "No"],
      [true, false],
      true,
      `¿Deseas agregar ${areaVida.av} a tu sistema de gestión?`
    );
    // P3 SI
    if (agregar) {
      const filePath = `Plantillas/${
        this.plugin.settings[`folder_AreasVida`]
      }/Plt - nodoAreasVida.md`;
      const template = app.vault.getAbstractFileByPath(filePath);
      if (template instanceof TFile) {
        console.log("Archivo nodoAreaVida template encontrado:", template);
      } else {
        console.log("Archivo template nodoAreaVida no encontrado.");
      }

      const filename = areaVida.grupo + " - " + areaVida.av;
      let folderPath = `${this.plugin.settings[`folder_AreasVida`]}/${
        areaVida.av
      }`;
      // Se asegura de que la carpeta exista para poder crear el archivo directamente en esa carpeta
      await this.crearCarpeta(folderPath);
      const folder = app.vault.getAbstractFileByPath(folderPath);
      let crearNota: (
        template: TFile,
        filename: string,
        overwrite: boolean,
        folder: TFolder
      ) => Promise<void>;
      crearNota = this.plugin.tp.file.static_functions.get("create_new");

      try {
        let nota = await crearNota(template, filename, false, folder);
        return true;
      } catch (error) {
        console.error("Error creando NodoAreaVida: ", error);
        return error;
      }
    } else {
      return false;
    }
  }

  async agregarAVQ(areaVida: any, trimestre: string): Promise<boolean> {
    const filePath = `Plantillas/${this.plugin.settings.folder_AreasVida}/Plt - AreasVida.md`;
    const template = app.vault.getAbstractFileByPath(filePath);

    if (!(template instanceof TFile)) {
      console.log("Archivo no encontrado.");
      return false; // Asegura que la función retorna un booleano incluso en caso de error.
    }
    console.log("Archivo encontrado:", template);
    const filename = `${trimestre} -- ${areaVida.av} -- ${areaVida.grupo}`;
    let folderPath = `${this.plugin.settings[`folder_AreasVida`]}/${
      areaVida.av
    }`;
    const folder = app.vault.getAbstractFileByPath(folderPath) as TFolder; // Asegúrate de que "Inbox" realmente exista y sea un TFolder.

    // Asumiendo que el tipo de `folder` es correcto y que crearNota es una función asincrónica que devuelve void.
    let crearNota = this.plugin.tp.file.static_functions.get("create_new") as (
      template: TFile,
      filename: string,
      overwrite: boolean,
      folder: TFolder
    ) => Promise<void>;

    try {
      await crearNota(template, filename, false, folder);
      return true;
    } catch (error) {
      console.error("Error creando AreaVida: ", error);
      return false;
    }
  }

  async borrarAVQ(fileAVQ) {
    console.log(`Logica de borrado de ${fileAVQ.basename}`);
    try {
      // Asegurarse de que fileAVQ es un objeto TFile válido
      if (fileAVQ instanceof TFile) {
        await app.vault.delete(fileAVQ); // Borrar el archivo
        console.log(`${fileAVQ.basename} ha sido borrado con éxito.`);
      } else {
        console.error(
          `${fileAVQ.basename} no es un archivo válido o no existe.`
        );
      }
    } catch (err) {
      console.error(`Error al intentar borrar ${fileAVQ.basename}:`, err);
    }
  }

  async actualizarAVQ(fileAVQ) {
    console.log(`Logica de actualización de estado de ${fileAVQ.basename}`);

    // Obtener acceso a funciones del sistema y metadataCache
    let suggester = this.plugin.tp.system.static_functions.get("suggester");
    let metadataCache = app.metadataCache.getFileCache(fileAVQ);

    // Inicializar variables
    let estadoActual = "";
    let nuevoEstado = "";

    // Obtener el estado actual desde el frontmatter usando metadataCache
    if (
      metadataCache.frontmatter &&
      metadataCache.frontmatter.hasOwnProperty("estado")
    ) {
      estadoActual = metadataCache.frontmatter.estado;
    } else {
      console.log("No se encontró el estado actual en el frontmatter.");
      return; // Salir si no hay estado actual
    }

    // Mostrar el suggester para seleccionar el nuevo estado
    try {
      nuevoEstado = await suggester(
        ["🔵 -> Archivado", "🟢 -> Activo", "🟡 -> En Pausa", "🔴 -> Detenido"], // opciones para mostrar
        ["🔵", "🟢", "🟡", "🔴"], // valores a retornar
        false, // permite selección múltiple
        `${fileAVQ.basename} está ${estadoActual}. Asignar estado:` // mensaje
      );

      // Verificar si se seleccionó un nuevo estado
      if (!nuevoEstado) {
        console.log("No se seleccionó un nuevo estado.");
        return; // Salir si no se seleccionó un nuevo estado
      }

      // Actualizar el estado en el frontmatter
      await app.fileManager.processFrontMatter(fileAVQ, (frontmatter) => {
        if (frontmatter.hasOwnProperty("estado")) {
          frontmatter.estado = nuevoEstado; // Actualizar el estado
          console.log("Estado actualizado con éxito a:", nuevoEstado);
        }
      });
    } catch (err) {
      console.error("Error al actualizar el estado en el frontmatter:", err);
    }
  }

  async crearCarpeta(folderPath: string) {
    try {
      // Verifica si la carpeta ya existe

      const carpetaExistente = app.vault.getAbstractFileByPath(folderPath);
      if (carpetaExistente instanceof TFolder) {
        console.log(`La carpeta '${folderPath}' ya existe.`);
        return;
      }
      // Crea la carpeta
      await app.vault.createFolder(folderPath);
      console.log(`Carpeta '${folderPath}' creada exitosamente.`);
    } catch (error) {
      console.error(`Error al crear la carpeta '${folderPath}':`, error);
    }
  }

  // PARA PROCESAR LOS COMPASS

  // Función para crear y mostrar el botón de procesar Objetivos de las AV anuales en el proceso de Compass.
  async mostrarBotonCompassAnual(dv) {
    dv.container.innerHTML = ""; // Limpiar el contenedor

    const boton = document.createElement("button");
    boton.textContent = "Procesar Objetivos AV Anual";
    dv.container.appendChild(boton);

    boton.onclick = async () => {
      await this.procesarCompassAnual(dv); // Mostrar los botones adicionales al hacer clic
    };
  }

  async mostrarBotonCompassTrimestral(dv) {
    dv.container.innerHTML = ""; // Limpiar el contenedor

    const boton = document.createElement("button");
    boton.textContent = "Procesar Objetivos AV Trimestrales";
    dv.container.appendChild(boton);

    boton.onclick = async () => {
      await this.procesarCompassTrimestral(dv); 
    };
  }

  async procesarCompassAnual(dv) {
  
    let año = dv.current().año;
    const resultadoAV: GrupoAV[] = [];
    const fileCampos = app.vault.getAbstractFileByPath(this.pathCampos);
    try {
      if (fileCampos instanceof TFile) {
        // Usa metadataCache para obtener los metadatos del archivo
        const metadata = app.metadataCache.getFileCache(fileCampos);
        const arregloAV = metadata?.frontmatter?.AreasVida || [];
        // Rellena el arreglo con los datos del arregloResult
        if (Array.isArray(arregloAV)) {
          arregloAV.forEach((item) => {
            if (Array.isArray(item) && item.length >= 2) {
              resultadoAV.push({
                grupo: item[0],
                av: item[1],
                texto: item[0] + " / " + item[1],
              });
            }
          });
        }
      }
    } catch (error) {
      console.error("Error obteniendo el archivo de campos:", error);
      // Aquí manejarías el error como sea apropiado para tu aplicación
      throw error; // O devolver un arreglo vacío como resultado de error
    }

    const allFiles = app.vault.getMarkdownFiles();
    let basePath = this.plugin.settings.folder_AreasVida;

    // -..-> Revisión de escenarios.
    debugger;
    for (let areaVida of resultadoAV) {
      // Verifica si la carpeta existe en la ubicación específica
      const fullFolderPath = `${basePath}/${areaVida.av}`;
      const folder = app.vault.getAbstractFileByPath(fullFolderPath);

      //P0 -> Verifica si la carpeta path/areaVida existe
      //P0 - SI
      if (folder instanceof TFolder) {
        console.log(`La carpeta ${areaVida.av} existe dentro de ${basePath}.`);
        // Ahora, verifica si la nota existe dentro de la carpeta
        const instancesOfAV = app.vault
          .getMarkdownFiles()
          .filter(
            (file) =>
              file.path.includes(fullFolderPath) &&
              !file.path.includes("Plantillas") &&
              !file.path.includes("Archivo")
          );
        // P1 Existe nodeAreaVida?
        const nodeAVExists = instancesOfAV.some(
          (file) => file.basename === areaVida.av
        );

        // P1 SI
        if (nodeAVExists) {
          console.log(
            `La nota ${areaVida.av} existe dentro de la carpeta ${areaVida.av}.`
          );
          // P2 areaVida Q Existe?
          // Preguntar El objetivo y guardarlo en el nodo de AV.
          await this.objetivoAnual(año, areaVida.av);
        }
        //P1 - NO (nodeAreaVida no Existe)
        else {
          // Caso 3 y 4
          console.log(
            `La nota ${areaVida.av} no existe dentro de la carpeta ${areaVida.av}.`
          );
          // P3 Agregar Nodo Area Vida?
          let nAV = await this.agregarNodoAreaVida(areaVida); // Quieres Agregar esta AV a tu sistema de Gestión?
          //P3 -> SI
          if (nAV) {
            // P2 .. -> Si y No
            await this.objetivoAnual(año, areaVida.av);
          }
          //P3 -> NO
          else if (nAV == false) {
            continue; //Sentencia que debe pasar al siguiente elemento del ciclo for.
          } else {
            return; // En caso de que se de escape.
          }
        }
      }
      // PO -> NO (La Carpeta no existe)
      else {
        console.log(
          `La carpeta ${areaVida.av} no existe aún dentro de ${basePath}.`
        );
        // P3 Agregar Nodo Area Vida?
        let nAV = await this.agregarNodoAreaVida(areaVida); // Quieres Agregar esta AV a tu sistema de Gestión?
        // P3 -> SI
        if (nAV) {
          // P2
          await this.objetivoAnual(año, areaVida.av);
        }
        //P3 -> NO
        else if (nAV == false) {
          continue; //Sentencia que debe pasar al siguiente elemento del ciclo for.
        }
        // P3 -> Escape
        else {
          return; // En caso de que se de escape.
        }
      }
    } // Fin For AreasVida fileCampos
  } // Metodo Procesar Compass Anual

  async procesarCompassTrimestral(dv) {
    debugger;
    let trimestre = dv.current().trimestre;
    const resultadoAV: GrupoAV[] = [];
    const fileCampos = app.vault.getAbstractFileByPath(this.pathCampos);
    try {
      if (fileCampos instanceof TFile) {
        // Usa metadataCache para obtener los metadatos del archivo
        const metadata = app.metadataCache.getFileCache(fileCampos);
        const arregloAV = metadata?.frontmatter?.AreasVida || [];
        // Rellena el arreglo con los datos del arregloResult
        if (Array.isArray(arregloAV)) {
          arregloAV.forEach((item) => {
            if (Array.isArray(item) && item.length >= 2) {
              resultadoAV.push({
                grupo: item[0],
                av: item[1],
                texto: item[0] + " / " + item[1],
              });
            }
          });
        }
      }
    } catch (error) {
      console.error("Error obteniendo el archivo de campos:", error);
      // Aquí manejarías el error como sea apropiado para tu aplicación
      throw error; // O devolver un arreglo vacío como resultado de error
    }

    const allFiles = app.vault.getMarkdownFiles();
    let basePath = this.plugin.settings.folder_AreasVida;

    // -..-> Revisión de escenarios.
    for (let areaVida of resultadoAV) {
      // Verifica si la carpeta existe en la ubicación específica
      const fullFolderPath = `${basePath}/${areaVida.av}`;
      const folder = app.vault.getAbstractFileByPath(fullFolderPath);

      //P0 -> Verifica si la carpeta path/areaVida existe
      //P0 - SI
      if (folder instanceof TFolder) {
        console.log(`La carpeta ${areaVida.av} existe dentro de ${basePath}.`);
        // Ahora, verifica si la nota existe dentro de la carpeta
        const instancesOfAV = app.vault
          .getMarkdownFiles()
          .filter(
            (file) =>
              file.path.includes(fullFolderPath) &&
              !file.path.includes("Plantillas") &&
              !file.path.includes("Archivo")
          );
        // P1 Existe nodeAreaVida?
        const nodeAVExists = instancesOfAV.some(
          (file) => file.basename === areaVida.av
        );

        // P1 SI
        if (nodeAVExists) {
          console.log(
            `La nota ${areaVida.av} existe dentro de la carpeta ${areaVida.av}.`
          );
          // P2 areaVida Q Existe?
          // Preguntar El objetivo y guardarlo en el nodo de AV.
          await this.objetivoTrimestral(trimestre, areaVida.av);
        }
        //P1 - NO (nodeAreaVida no Existe)
        else {
          // Caso 3 y 4
          console.log(
            `La nota ${areaVida.av} no existe dentro de la carpeta ${areaVida.av}.`
          );
          // P3 Agregar Nodo Area Vida?
          let nAV = await this.agregarNodoAreaVida(areaVida); // Quieres Agregar esta AV a tu sistema de Gestión?
          //P3 -> SI
          if (nAV) {
            // P2 .. -> Si y No
            await this.objetivoTrimestral(trimestre, areaVida.av);
          }
          //P3 -> NO
          else if (nAV == false) {
            continue; //Sentencia que debe pasar al siguiente elemento del ciclo for.
          } else {
            return; // En caso de que se de escape.
          }
        }
      }
      // PO -> NO (La Carpeta no existe)
      else {
        console.log(
          `La carpeta ${areaVida.av} no existe aún dentro de ${basePath}.`
        );
        // P3 Agregar Nodo Area Vida?
        let nAV = await this.agregarNodoAreaVida(areaVida); // Quieres Agregar esta AV a tu sistema de Gestión?
        // P3 -> SI
        if (nAV) {
          // P2
          await this.objetivoTrimestral(trimestre, areaVida.av);
        }
        //P3 -> NO
        else if (nAV == false) {
          continue; //Sentencia que debe pasar al siguiente elemento del ciclo for.
        }
        // P3 -> Escape
        else {
          return; // En caso de que se de escape.
        }
      }
    } // Fin For AreasVida fileCampos
  } // Metodo Procesar Compass Trimestral 


  async objetivoAnual(año: any, areaVida: any): Promise<void> {
    // Buscar si ya hay objetivos creados para ese año y esa area de vida.

    const folderObj = this.plugin.settings["folder_ObjCompassAnual"];
    const filesObj = app.vault
      .getMarkdownFiles()
      .filter(
        (file) =>
          file.path.includes(folderObj) &&
          !file.path.includes("Plantillas") &&
          !file.path.includes("Archivo")
      );
    let objCreados = [];

    for (let file of filesObj) {
      debugger;
      let metadata = app.metadataCache.getFileCache(file)?.frontmatter;
      const regex = /\[\[\s*(.*?)\s*\]\]/;
      let fileAV = metadata?.areaVida.match(regex)[1];
      const sameAV = fileAV === areaVida;

      if (metadata?.año === año && sameAV) {
        let objActivo = { file }; // Asumiendo que quieres guardar el path del archivo
        Object.assign(objActivo, metadata); // Agrega el metadata al objeto qActivo
        objCreados.push(objActivo); // Añade el registro activo al array
      }
    }
    let prompt = this.plugin.tp.system.static_functions.get("prompt");
    let suggester = this.plugin.tp.system.static_functions.get("suggester");
    let objetivos = [];
    let deseaAgregarObjetivo;
    if (objCreados.length > 0) {
        // Si hay objetivos creados.
        // Logica cuando ya hay objetivos creados.
      let nextStep = await suggester(
        [
          "Agregar Objetivos",
          "Borrar y Crear de nuevo los objetivos",
          "Dejar los objetivos como están ",
        ],
        ["upd", "del+cre", "continue"],
        true,
        `¿Ya hay ${objCreados.length} objetivos creados para ${areaVida} en el ${año}. Elige una opción:`
      );

        switch (nextStep) {
          case "upd":
            do {
              let objetivo = await this.crearObjetivo(areaVida, año);

              // Preguntar nuevamente si desea agregar otro objetivo.
              deseaAgregarObjetivo = await suggester(
                ["Si", "No"],
                [true, false],
                true,
                `¿Desea agregar otro objetivo para ${areaVida} en ${año}?`
              );
            } while (deseaAgregarObjetivo);
            break;
          case "del+cre":
            await this.borrarObjetivos(objCreados);
            deseaAgregarObjetivo = await suggester(
              ["Si", "No"],
              [true, false],
              true,
              `¿Desea agregar algún objetivo para ${areaVida} en ${año}?`
            );
            while (deseaAgregarObjetivo) {
              let objetivo = await this.crearObjetivo(areaVida, año);
              // Borrar los objetivos anteriores.
              // Preguntar nuevamente si desea agregar otro objetivo.
              deseaAgregarObjetivo = await suggester(
                ["Si", "No"],
                [true, false],
                true,
                `¿Desea agregar otro objetivo para ${areaVida} en ${año}?`
              );
            }
            break;
          case "continue":
            console.log(`Continuar sin hacer nada con los objetivos de ${areaVida}`);
            break;
        }
      }
      // No hay objetivos creados.
      else {
        // Verificar si desea agregar algún objetivo.
        deseaAgregarObjetivo = await suggester(
          ["Si", "No"],
          [true, false],
          true,
          `¿Desea agregar algún objetivo para ${areaVida} en ${año}?`
        );
        while (deseaAgregarObjetivo) {
          let objetivo = await this.crearObjetivo(areaVida, año);
          objetivos.push([objetivo]);

          // Preguntar nuevamente si desea agregar otro objetivo.
          deseaAgregarObjetivo = await suggester(
            ["Si", "No"],
            [true, false],
            true,
            `¿Desea agregar otro objetivo para ${areaVida} en ${año}?`
          );
        }
      }
  } // Método objetivoAnual.
  
  async objetivoTrimestral(trimestre: any, areaVida: any): Promise<void> {
    debugger;
    // Buscar si ya hay objetivos creados para ese año y esa area de vida.

    const folderObj = this.plugin.settings["folder_ObjCompassAnual"];
    const filesObj = app.vault
      .getMarkdownFiles()
      .filter(
        (file) =>
          file.path.includes(folderObj) &&
          !file.path.includes("Plantillas") &&
          !file.path.includes("Archivo")
      );
    let objCreados = [];

    for (let file of filesObj) {
      debugger;
      let metadata = app.metadataCache.getFileCache(file)?.frontmatter;
      const regex = /\[\[\s*(.*?)\s*\]\]/;
      let fileAV = metadata?.areaVida.match(regex)[1];
      const sameAV = fileAV === areaVida;

      if (metadata?.trimestre?.path && typeof (metadata.trimestre.path === 'string') &&  metadata.trimestre.path.includes(trimestre) && sameAV) {
        let objActivo = { file }; // Asumiendo que quieres guardar el path del archivo
        Object.assign(objActivo, metadata); // Agrega el metadata al objeto qActivo
        objCreados.push(objActivo); // Añade el registro activo al array
      }
    }
    let prompt = this.plugin.tp.system.static_functions.get("prompt");
    let suggester = this.plugin.tp.system.static_functions.get("suggester");
    let objetivos = [];
    let deseaAgregarObjetivo;
    if (objCreados.length > 0) {
        // Si hay objetivos creados.
        // Logica cuando ya hay objetivos creados.
      let nextStep = await suggester(
        [
          "Agregar Objetivos",
          "Borrar y Crear de nuevo los objetivos",
          "Dejar los objetivos como están ",
        ],
        ["upd", "del+cre", "continue"],
        true,
        `¿Ya hay ${objCreados.length} objetivos creados para ${areaVida} en el ${trimestre}. Elige una opción:`
      );

        switch (nextStep) {
          case "upd":
            do {
              let objetivo = await this.crearObjetivoTrimestre(areaVida, trimestre);

              // Preguntar nuevamente si desea agregar otro objetivo.
              deseaAgregarObjetivo = await suggester(
                ["Si", "No"],
                [true, false],
                true,
                `¿Desea agregar otro objetivo para ${areaVida} en ${trimestre}?`
              );
            } while (deseaAgregarObjetivo);
            break;
          case "del+cre":
            await this.borrarObjetivos(objCreados);
            deseaAgregarObjetivo = await suggester(
              ["Si", "No"],
              [true, false],
              true,
              `¿Desea agregar algún objetivo para ${areaVida} en ${trimestre}?`
            );
            while (deseaAgregarObjetivo) {
              let objetivo = await this.crearObjetivoTrimestre(areaVida, trimestre);
              // Borrar los objetivos anteriores.
              // Preguntar nuevamente si desea agregar otro objetivo.
              deseaAgregarObjetivo = await suggester(
                ["Si", "No"],
                [true, false],
                true,
                `¿Desea agregar otro objetivo para ${areaVida} en ${trimestre}?`
              );
            }
            break;
          case "continue":
            console.log(`Continuar sin hacer nada con los objetivos de ${areaVida}`);
            break;
        }
      }
      // No hay objetivos creados.
      else {
        // Verificar si desea agregar algún objetivo.
        deseaAgregarObjetivo = await suggester(
          ["Si", "No"],
          [true, false],
          true,
          `¿Desea agregar algún objetivo para ${areaVida} en ${trimestre}?`
        );
        while (deseaAgregarObjetivo) {
          let objetivo = await this.crearObjetivoTrimestre(areaVida, trimestre);
          objetivos.push([objetivo]);

          // Preguntar nuevamente si desea agregar otro objetivo.
          deseaAgregarObjetivo = await suggester(
            ["Si", "No"],
            [true, false],
            true,
            `¿Desea agregar otro objetivo para ${areaVida} en ${trimestre}?`
          );
        }
      }
  } // Método objetivoTrimestral.



/* 
----------------------------------------------------------------
Método que crea el botón que se agrega en la tabla de proyectos en el 
Compass Anual, para crear el proyecto a cada Objetivo.
----------------------------------------------------------------
*/ 
  createButtonTable(dv, objetivo) {
    const buttonContainer = dv.el("div", "");
    const button = dv.el("button", "Nuevo Proyecto");
    button.addEventListener("click", async (event) => {
        event.preventDefault();
        await this.crearProyectoObjetivo(dv, objetivo);
    });
    buttonContainer.appendChild(button);
    return buttonContainer;
}

/* 
----------------------------------------------------------------
Metodo invocado por el boton de la tabla del compass anual "Nuevo Proyecto" 
para crear proyecto a un objetivo anual establecido.
----------------------------------------------------------------
*/ 
async crearProyectoObjetivo(dv, objetivo){
  debugger;
  let suggester = this.plugin.tp.system.static_functions.get("suggester");
  let tipoProyecto = await suggester(
    ["Proyecto GTD", "Proyecto de Q"],
    [true, false],
    true,
    `¿El proyecto ${objetivo.file.name} requiere un Proyecto GTD o Proyecto de Q?`
  );
  let proyecto;
  if (tipoProyecto){
    proyecto = this.crearProyectoGTD(objetivo);// Crear Proyecto GTD
  }else{
    /* 
    Buscando optimizar el uso del método crear proyectoQ, 
    vamos a confirmar el trimestre desde crearProyectoObjetivo; 
    */
    debugger;
    const regexTrim = /\[?\[?(\d{4}-Q[1-4])\]?\]?/g;
    const trimestre = objetivo.trimestre.path.match(regexTrim);

    const confirmaTrim = await suggester(
      ["Si", "No"],
      [true, false],
      true,
      `¿Vamos a crear el proyecto ${objetivo.file.name} en el trimestre ${trimestre}?`
    );
   
    if (!confirmaTrim){  
      const q = await this.establecerTrimestre("objetivo del año");
      //objetivo.trimestre.path = q.trimestre;
      debugger;
      await this.actualizarYAMLs({trimestre: `[[${q.trimestre}]]`}, objetivo.file.path);
      }
    proyecto = await this.crearProyectoQ(objetivo);
  }
}

/* 
----------------------------------------------------------------
Metodo que inicializa la creación de la plantilla de objetivo Compass.
----------------------------------------------------------------
*/ 
async crearObjetivo(areaVida, año){
  debugger;
  const templatePath = `Plantillas/${this.plugin.settings["folder_ObjCompassAnual"]}/Plt - ObjCompassAnual.md`;
  const template = app.vault.getAbstractFileByPath(templatePath);
  const folder = app.vault.getAbstractFileByPath("Inbox");
  let crearNota = this.plugin.tp.file.static_functions.get("create_new") 
  let filename = `${año} - Objetivo para ${areaVida}`;
  let objetivo = await crearNota (template, filename, false, folder);
  return objetivo;
}

async crearObjetivoTrimestre(areaVida, trimestre){
  debugger;
  const templatePath = `Plantillas/${this.plugin.settings["folder_ObjCompassAnual"]}/Plt - ObjCompassAnual.md`;
  const template = app.vault.getAbstractFileByPath(templatePath);
  const folder = app.vault.getAbstractFileByPath("Inbox");
  let crearNota = this.plugin.tp.file.static_functions.get("create_new") 
  let filename = `Trimestre ${trimestre} - Objetivo para ${areaVida}`;
  let objetivo = await crearNota (template, filename, false, folder);
  return objetivo;
}

/* 
----------------------------------------------------------------
Metodo invocado desde crearProyectoObjetivo(dv, objetivo)
Esté método hace parte del proceso de Compass Anual.
Facilita la creación del un proyecto de Q para un objetivo anual establecido.
----------------------------------------------------------------
*/ 
async crearProyectoQ(objetivo){
  let suggester = this.plugin.tp.system.static_functions.get("suggester");
  debugger;
  const templatePath = `Plantillas/${this.plugin.settings["folder_ProyectosQ"]}/Plt - ProyectosQ.md`;
  const template = app.vault.getAbstractFileByPath(templatePath);
  const folder = app.vault.getAbstractFileByPath("Inbox");
  let crearNota = this.plugin.tp.file.static_functions.get("create_new") 
  let filename = `Proyecto para Objetivo Compass Anual - ${objetivo.id}`;
  let proyecto = await crearNota(template, filename, true, folder);
  return proyecto;
}

async crearProyectoGTD(objetivo){
  debugger;
  const templatePath = `Plantillas/${this.plugin.settings["folder_ProyectosGTD"]}/Plt - ProyectosGTD.md`;
  const template = app.vault.getAbstractFileByPath(templatePath);
  const folder = app.vault.getAbstractFileByPath("Inbox");
  let crearNota = this.plugin.tp.file.static_functions.get("create_new") 
  let filename = `Proyecto para Objetivo Compass Anual - ${objetivo.id}`;
  let proyecto = await crearNota (template, filename, true, folder);
  return proyecto;
}


/* 
----------------------------------------------------------------
Metodo invocado en el proceso de Compass Anual, cuando elijo volver
a crear todos los proyectos de un area de vida para un año.
----------------------------------------------------------------
*/ 
async borrarObjetivos(objetivos){
  debugger;
  for (let objetivo of objetivos){ 
    try {
      // Intenta borrar el archivo actual del arreglo
      await app.vault.delete(objetivo.file);
      console.log(`Archivo borrado: ${objetivo.file.path}`);
    } catch (error) {
        console.error(`Error al borrar el archivo ${objetivo.file.path}: ${error}`);
     }
  }

  }


/* 
----------------------------------------------------------------
Metodo que permite para cualquier caso en el que se requiera elegir 
un trimestre para continuar un proceso, hacer la verificación sobre los
trimestres que esten creados a partir de la nota TQ.  
----------------------------------------------------------------
*/
  async establecerTrimestre(temaTrimestre){
    // Obtener Qs para preguntar el Q para el que desea crear las áreas de vida.
    const folderQ = this.plugin.settings["folder_Trimestral"];
    const filesQ = app.vault
      .getMarkdownFiles()
      .filter(
        (file) =>
          file.path.includes(folderQ) &&
          !file.path.includes("Plantillas") &&
          !file.path.includes("Archivo")
      );
    let qCreados = [];

    for (let file of filesQ) {
      let metadata = app.metadataCache.getFileCache(file)?.frontmatter;

      if (metadata?.type === "TQ" && metadata?.trimestre) {
        let qActivo = { file }; // Asumiendo que quieres guardar el path del archivo
        Object.assign(qActivo, metadata); // Agrega el metadata al objeto qActivo
        qCreados.push(qActivo); // Añade el registro activo al array
      }
    }

    let suggester = this.plugin.tp.system.static_functions.get("suggester");
    try {
      let q = await suggester(
        qCreados.map((b) => b.trimestre),
        qCreados.map((b) => b),
        true,
        `De que trimestre vamos a procesar tus ${temaTrimestre}`
      );
  
      // Aquí asumimos que si q es undefined, el usuario canceló la operación.
      if (q === undefined) {
          console.log("Operación cancelada por el usuario.");
          // Maneja el escape o cancelación aquí. Por ejemplo, podrías salir de la función actual o hacer otra cosa.
          return; // Sale de la función si el usuario cancela.
      }
  
      // Continuar con la lógica después de que el usuario ha seleccionado una opción
        console.log("El usuario seleccionó:", q);
        return q;
      } catch (error) {
          console.error("Error en el suggester:", error);
      }
  }

/* 
----------------------------------------------------------------
Con este método puedo actualizar valores en las notas ya existentes.
Lo utilizo en esta clase, para actualizar el trimestre.
Esta función solo actualiza, no crea el campos si no existe. 
----------------------------------------------------------------
*/
  async actualizarYAMLs(campos, ruta) {
        
    try {
        const file = app.vault.getAbstractFileByPath(ruta);
        await app.fileManager.processFrontMatter(file, frontmatter => {
            // Iterar sobre cada propiedad del objeto 'nota'
            for (const campo in campos) {
                
                if (frontmatter.hasOwnProperty(campo)) {
                    // Actualizar el campo en el frontmatter con el valor correspondiente
                    frontmatter[campo] = campos[campo];
                }
            }
        });
        console.log("Frontmatter actualizado con éxito");
    } catch (err) {
        console.error("Error al actualizar el frontmatter", err);
    }
}

}
