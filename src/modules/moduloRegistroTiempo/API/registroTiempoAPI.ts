import {utilsAPI} from './utilsAPI'
import { TFile } from 'obsidian';

export class registroTiempoAPI {
    private utilsApi: utilsAPI;

    constructor(private plugin: Plugin) {
      this.plugin = plugin;
      this.utilsApi = new utilsAPI(plugin);
      
    }
    

    async iniciarRegistro(){
        try {
          
        const registro = await this.utilsApi.crearObjetoRegistro(this.plugin);
        await this.utilsApi.verificarTareasActivas(registro, this.plugin.app);
        if (registro.detener) {
            return registro; // Devuelve el registro actual y detiene la ejecución aquí
        }
        await this.utilsApi.definirTipoRegistro(registro,this.plugin.app)
        if (registro.detener) {
            return registro; // Devuelve el registro actual y detiene la ejecución aquí
        }
        await this.utilsApi.construirNombreyAlias(registro, this.plugin.app)
        return registro;
        }catch (error){
                new Notice("No se pudo crear el objeto de registro.");
                return null;
        }
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
    const tp = this.getTp();
    let crearNota = tp.file.static_functions.get("create_new")
    await crearNota (template, filename, false, folder).basename;
  }



  // Sobrecarga de método para los diferentes tipos de entrada
  async cerrarRegistro(id: number | string): Promise<void>;
  async cerrarRegistro(file: TFile): Promise<void>;
  async cerrarRegistro(): Promise<void>;
  // Implementación del método con unión de tipos para el parámetro id
  async cerrarRegistro(registro?: number | string | TFile): Promise<void> {
    const folder = this.plugin.settings.folder_RegistroTiempo;
    if (typeof registro === 'string') {
    registro = parseInt(registro);
    }
    // Lógica si 'id' es un número -> Cuando llega del boton de la tabla de registros del día.
    if (typeof registro === 'number') {
        const files = app.vault.getMarkdownFiles();
        let infoNota;
        for (let file of files) {
            if (file.path.startsWith(folder)) {
                const metadata = app.metadataCache.getFileCache(file)?.frontmatter;
                if (metadata?.id === registro) {
                    infoNota = { file };
                    Object.assign(infoNota, metadata); 
                }
            }
        }
        let campos = ["fecha","horaFinal","tiempoTrabajado"];
        let resultado = await this.plugin.YAMLUpdaterAPI.archivarNota(infoNota, campos);
        let textoResultado = Object.entries(resultado).map(([propiedad, valor]) => `${propiedad}: ${valor}`).join(', ');
        new Notice(`Tarea cerrada. Campos actualizados: ${textoResultado}`);
    }
    // Lógica si 'id' es un TFile
    else if (registro instanceof TFile) {
      const metadata = app.metadataCache.getFileCache(registro)?.frontmatter;
      let infoNota = {file: registro};
      Object.assign(infoNota, metadata); 
      let campos = ["fecha","horaFinal","tiempoTrabajado"];
      let resultado = await this.plugin.YAMLUpdaterAPI.archivarNota(infoNota, campos);
      let textoResultado = Object.entries(resultado).map(([propiedad, valor]) => `${propiedad}: ${valor}`).join(', ');
      new Notice(`Tarea cerrada. Campos actualizados: ${textoResultado}`);
    }
    else {
        // Lógica para cuando no se proporciona argumentos, se busca la tarea activa y se cierra.
        const registro = await this.utilsApi.buscarRegistrosActivos(app);
        const metadata = app.metadataCache.getFileCache(registro)?.frontmatter;
        let infoNota = {file: registro};
        Object.assign(infoNota, metadata); 
        let campos = ["fecha","horaFinal","tiempoTrabajado"];
        let resultado = await this.plugin.YAMLUpdaterAPI.archivarNota(infoNota, campos);
        let textoResultado = Object.entries(resultado).map(([propiedad, valor]) => `${propiedad}: ${valor}`).join(', ');
        new Notice(`Tarea cerrada. Campos actualizados: ${textoResultado}`);
    }
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

  getTp(){
    if (!this.plugin || !this.plugin.app.plugins.enabledPlugins.has('templater-obsidian')) {
        console.error('El plugin Templater no está habilitado.');
        return;
    }   
    let tpGen = this.plugin.app.plugins.plugins["templater-obsidian"].templater;
    tpGen = tpGen.functions_generator.internal_functions.modules_array;
    let tp = {}
    // get an instance of modules
    tp.file = tpGen.find(m => m.name == "file");
    tp.system = tpGen.find(m => m.name == "system");

    if (!tp.file) {
    console.error("No se pudo acceder al objeto de funciones actuales de Templater.");
    return;
    }
    console.log('tp con propiedades "file" se ha cargado satisfactoriamente');
    return tp;
}


  }
  