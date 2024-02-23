import {utilsAPI} from './utilsAPI'

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

    miMetodo() {
      // Tu lógica aquí
      return "Resultado de mi Metodo";
    }
  
    otroMetodo(param) {
      // Lógica utilizando param
      return `Resultado de otroMetodo con ${param}`;
    }
  }
  