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
    async retomarRegistro(id){
      const folder = this.plugin.settings.folder_RegistroTiempo
      try {
      const registro = await this.utilsApi.crearObjetoRegistro(this.plugin);
      await this.utilsApi.verificarTareasActivas(registro, this.plugin.app);
      if (registro.detener) {
          return registro; // Devuelve el registro actual y detiene la ejecución aquí
      }
      const files = app.vault.getMarkdownFiles();
      let registroAntiguo;
      
      for (let file of files) {
          if (file.path.startsWith(folder)) {
              const metadata = app.metadataCache.getFileCache(file)?.frontmatter;
              if (metadata?.id === parseInt(id)) {
                  registroAntiguo = { file, frontmatter: metadata };
              }
          }
      }
      debugger
      registro.titulo = registroAntiguo?.frontmatter.titulo ? registroAntiguo.frontmatter.titulo : "Sin Titulo";
      registro.asuntoRetomado = registroAntiguo?.frontmatter.asunto ? registroAntiguo.frontmatter.asunto : null;
      await this.utilsApi.construirNombreyAlias(registro, this.plugin.app)
      return registro;
      }catch (error){
              new Notice("No se pudo crear el objeto de registro.");
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
  