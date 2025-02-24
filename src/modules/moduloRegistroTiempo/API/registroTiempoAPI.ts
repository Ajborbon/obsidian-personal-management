/*
 * Filename: /src/modules/moduloRegistroTiempo/API/registroTiempoAPI.ts
 * Path: /src/modules/moduloRegistroTiempo/API
 * Created Date: 2025-02-23 15:57:40
 * Author: Andrés Julián Borbón
 * -----
 * Last Modified: 2025-02-23 17:43:09
 * Modified By: Andrés Julián Borbón
 * -----
 * Copyright (c) 2025 - Andrés Julián Borbón
 */


import {utilsAPI} from './utilsAPI'
import { TFile } from 'obsidian';
import { RegistroTiempo } from '../Interfaces/RegistroTiempo';
import { RTBase } from './RTBase';

export class registroTiempoAPI extends RTBase implements RegistroTiempo{
    private utilsApi: utilsAPI;

    constructor(private plugin: Plugin) {
      super(plugin);
      this.plugin = plugin;
      this.utilsApi = new utilsAPI(plugin);
      this.tp = plugin.tp;
    }
    
    // Invocado desde el template de templater Paso 3 de 3

async retomarRegistro(id: string | number) {
    const folder = this.plugin.settings.folder_RegistroTiempo;
    try {
      // 1. Crear el objeto registro base
      const registro = await this.utilsApi.crearObjetoRegistro(this.plugin);
  
      // 2. Verificar si hay registro en curso
      await this.utilsApi.verificarTareasActivas(registro, this.plugin.app);
      if (registro.detener) {
        return registro;
      }
  
      // 3. Buscar la nota antigua en la carpeta configurada
      const files = this.plugin.app.vault.getMarkdownFiles();
      let registroAntiguo: { file: TFile; frontmatter: any } | undefined;
  
      for (let file of files) {
        if (file.path.startsWith(folder)) {
          const metadata = this.plugin.app.metadataCache.getFileCache(file)?.frontmatter;
          if (metadata?.id === parseInt(id as string)) {
            registroAntiguo = { file, frontmatter: metadata };
            break;
          }
        }
      }
  
      if (!registroAntiguo) {
        new Notice(`No se encontró el registro antiguo con ID: ${id}`);
        registro.detener = true;
        return registro;
      }
  
      // 4. Copiar campos relevantes y normalizar corchetes
      const fm = registroAntiguo.frontmatter;
      registro.titulo = fm.titulo ?? "Sin Titulo";
      registro.asuntoRetomado = fm.asunto ?? null;
      // Ejemplo: incrementa idSec para indicar nueva sesión
      registro.idSec = (fm.idSec ?? 0) + 1;
  
      // ---- Funciones para limpiar corchetes ----
      function quitarDobleCorchete(str: string) {
        if (str.startsWith("[[") && str.endsWith("]]")) {
          return str.slice(2, -2); // Elimina [[ y ]]
        }
        return str;
      }
  
      function normalizarArray(arr: any[]) {
        return arr.map(item => {
          if (typeof item === "string") {
            return quitarDobleCorchete(item);
          }
          return item;
        });
      }
      // -----------------------------------------
  
      // Asignar y normalizar cada campo
      registro.areaVida = "";
      if (typeof fm.areaVida === "string") {
        registro.areaVida = quitarDobleCorchete(fm.areaVida);
      }
  
      registro.areaInteres = [];
      if (Array.isArray(fm.areaInteres)) {
        registro.areaInteres = normalizarArray(fm.areaInteres);
      }
  
      registro.proyectoGTD = [];
      if (Array.isArray(fm.proyectoGTD)) {
        registro.proyectoGTD = normalizarArray(fm.proyectoGTD);
      }
  
      registro.proyectoQ = [];
      if (Array.isArray(fm.proyectoQ)) {
        registro.proyectoQ = normalizarArray(fm.proyectoQ);
      }
  
      // **Copiamos los aliases antiguos tal cual, sin perderlos**
      registro.aliases = [];
      if (Array.isArray(fm.aliases)) {
        registro.aliases = normalizarArray(fm.aliases);
      }
  
      // 5. Construir nombre y alias
      //    IMPORTANTE: construirNombreyAlias NO debe sobrescribir por completo registro.aliases,
      //    sino añadir o ajustar el alias para esta nueva sesión.
      await this.utilsApi.construirNombreyAlias(registro, this.plugin.app);
  
      // 6. Retornar el objeto registro al template
      return registro;
  
    } catch (error) {
      console.error(error);
      new Notice("No se pudo crear el objeto de registro al retomar.");
      return null;
    }
  }

  // Invocado para crear el template de Retomar Paso 1 de 3
  async retomarTarea(id) { 
    // Asegúrate de reemplazar 'ruta/al/archivo.md' con la ruta exacta del archivo que deseas obtener
    debugger;
    const filePath = `Plantillas/${this.plugin.settings[`folder_RegistroTiempo`]}/Plt - RegistroTiempo.md`;
    const template = app.vault.getAbstractFileByPath(filePath);

    if (template instanceof TFile) {
        // Ahora 'file' es tu archivo deseado, y puedes trabajar con él como necesites
        console.log("Archivo encontrado:", template);
    } else {
        // Si el archivo no se encontró, 'file' será null
        console.log("Archivo no encontrado.");
    }
    const filename = "Retomar " + id;
    const folder = app.vault.getAbstractFileByPath("Inbox");
    let crearNota = this.tp.file.static_functions.get("create_new")
    await crearNota (template, filename, false, folder).basename;
  }

  // Sobrecarga de método para los diferentes tipos de entrada
  async detalleRegistro(id: number | string): Promise<void>;
  async detalleRegistro(file: TFile): Promise<void>;
  async detalleRegistro(): Promise<void>;
  // Implementación del método con unión de tipos para el parámetro id
  async detalleRegistro(registro?: number | string | TFile): Promise<void> {
    const folder = this.plugin.settings.folder_RegistroTiempo;
    let infoNota;
    debugger;
    if (typeof registro === 'string') {
    registro = parseInt(registro);
    }
    // Lógica si 'id' es un número -> Cuando llega del boton de la tabla de registros del día.
    if (typeof registro === 'number') {
        const files = app.vault.getMarkdownFiles();
        for (let file of files) {
            if (file.path.startsWith(folder)) {
                const metadata = app.metadataCache.getFileCache(file)?.frontmatter;
                if (metadata?.id === registro) {
                    infoNota = { file };
                    Object.assign(infoNota, metadata); 
                }
            }
        }
    }
    // Lógica si 'id' es un TFile
    else if (registro instanceof TFile) {
      const metadata = app.metadataCache.getFileCache(registro)?.frontmatter;
      infoNota = {file: registro};
      Object.assign(infoNota, metadata); 
    }
    else {
        // Lógica para cuando no se proporciona argumentos, se busca la tarea activa y se cierra.
        const registro = await this.utilsApi.buscarRegistrosActivos(app);
        const metadata = app.metadataCache.getFileCache(registro)?.frontmatter;
        infoNota = {file: registro};
        Object.assign(infoNota, metadata); 
    }
    let campos = ["descripcion_RegistroTiempo"];
    debugger;
    let resultado = await this.plugin.YAMLUpdaterAPI.actualizarNota(infoNota, campos);
    let textoResultado = Object.entries(resultado).map(([propiedad, valor]) => `${propiedad}: ${valor}`).join(', ');
    new Notice(`Descripción actualizada: ${textoResultado}`);
  }

  }
  