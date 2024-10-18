import { utilsAPI } from './utilsAPI';
import { TFile } from 'obsidian';
import { Plugin } from 'obsidian'; // Asegúrate de importar Plugin si no está importado
import { SesionLectura } from '../Interfaces/SesionLectura';

export class RTBase {
    protected utilsApi: utilsAPI;
    protected nota: object;
    protected infoSubsistema: any; // Cambié el tipo a any para permitir cualquier objeto
    protected plugin: Plugin;
    protected tp: any;

    constructor(plugin: Plugin) {
        this.plugin = plugin;
        this.utilsApi = new utilsAPI(plugin);
        this.tp = plugin.tp;
        this.infoSubsistema = {};
    }

    async iniciarRegistro(infoSubsistema: { folder: string; indice: string; type: string; }, campos: any): Promise<any | null>;
    async iniciarRegistro(): Promise<any | null>;
    async iniciarRegistro(infoSubsistema?: { folder: string; indice: string; type: string; }, campos?: any): Promise<any | null> {
        debugger;
        if (typeof infoSubsistema === 'object' && infoSubsistema !== null) {
            if (!campos || !Array.isArray(campos)) {
                throw new Error("Campos debe ser un array definido.");
            }
    
            this.nota = {};
            let nota;
            Object.assign(this.infoSubsistema, infoSubsistema);
            debugger;
            if (this.infoSubsistema.defined) {
                this.infoSubsistema.folder = this.plugin.settings[infoSubsistema.folder];
                this.infoSubsistema.indice = this.plugin.settings[infoSubsistema.indice];
                Object.assign(this.nota, infoSubsistema);
            }
    
            let fieldHandler: SesionLectura;
            switch (this.infoSubsistema.type) {
                case "SL":
                    const SesionLectura = await import('./SesionLectura');
                    fieldHandler = new SesionLectura.SesionLectura(this.plugin, this.infoSubsistema);
                    break;
                default:
                    throw new Error(`No se ha definido un manejador de campos para el tipo ${this.infoSubsistema.type}`);
            }
    
            try {
                for (let campo of campos) {
                    const functionName = `get${campo.charAt(0).toUpperCase() + campo.slice(1)}`;
                    if (typeof fieldHandler[functionName] === 'function') {
                        this.nota[campo] = await fieldHandler[functionName]();
                        nota = await fieldHandler.getNota();
                        for (const key in nota) {
                            if (!(key in this.nota)) {
                                this.nota[key] = nota[key];
                            }
                        }
                    } else {
                        console.error(`La función ${functionName} no está definida.`);
                    }
                }
            } catch (error) {
                console.error("No se pudo crear el objeto de registro.", error);
                new Notice("No se pudo crear el objeto de registro.");
                return null;
            }
            return this.nota;
        } else {
            // Lógica original de iniciarRegistro
            try {
                const registro = await this.utilsApi.crearObjetoRegistro(this.plugin);
                await this.utilsApi.verificarTareasActivas(registro, this.plugin.app);
                if (registro.detener) {
                    return registro; // Devuelve el registro actual y detiene la ejecución aquí
                }
                await this.utilsApi.definirTipoRegistro(registro, this.plugin.app);
                if (registro.detener) {
                    return registro; // Devuelve el registro actual y detiene la ejecución aquí
                }
                await this.utilsApi.construirNombreyAlias(registro, this.plugin.app);
                return registro;
            } catch (error) {
                new Notice("No se pudo crear el objeto de registro.");
                return null;
            }
        }
    }

    // Sobrecarga de método para los diferentes tipos de entrada
    async cerrarRegistro(id: number | string): Promise<void>;
    async cerrarRegistro(file: TFile): Promise<void>;
    async cerrarRegistro(): Promise<void>;
    async cerrarRegistro(registro?: number | string | TFile): Promise<void> {
        const folder = this.plugin.settings.folder_RegistroTiempo;
        if (typeof registro === 'string') {
            registro = parseInt(registro);
        }
        // Lógica si 'id' es un número -> Cuando llega del botón de la tabla de registros del día.
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
            let campos = ["fecha", "horaFinal", "tiempoTrabajado"];
            let resultado = await this.plugin.YAMLUpdaterAPI.archivarNota(infoNota, campos);
            let textoResultado = Object.entries(resultado).map(([propiedad, valor]) => `${propiedad}: ${valor}`).join(', ');
            new Notice(`Tarea cerrada. Campos actualizados: ${textoResultado}`);
        }
        // Lógica si 'id' es un TFile
        else if (registro instanceof TFile) {
            const metadata = app.metadataCache.getFileCache(registro)?.frontmatter;
            let infoNota = { file: registro };
            Object.assign(infoNota, metadata);
            let campos = ["fecha", "horaFinal", "tiempoTrabajado"];
            let resultado = await this.plugin.YAMLUpdaterAPI.archivarNota(infoNota, campos);
            let textoResultado = Object.entries(resultado).map(([propiedad, valor]) => `${propiedad}: ${valor}`).join(', ');
            new Notice(`Tarea cerrada. Campos actualizados: ${textoResultado}`);
        } else {
            // Lógica para cuando no se proporciona argumentos, se busca la tarea activa y se cierra.
            const registro = await this.utilsApi.buscarRegistrosActivos(app);
            const metadata = app.metadataCache.getFileCache(registro)?.frontmatter;
            let infoNota = { file: registro };
            Object.assign(infoNota, metadata);
            let campos = ["fecha", "horaFinal", "tiempoTrabajado"];
            let resultado = await this.plugin.YAMLUpdaterAPI.archivarNota(infoNota, campos);
            let textoResultado = Object.entries(resultado).map(([propiedad, valor]) => `${propiedad}: ${valor}`).join(', ');
            new Notice(`Tarea cerrada. Campos actualizados: ${textoResultado}`);
        }
    }
}