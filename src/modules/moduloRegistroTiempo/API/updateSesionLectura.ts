import {utilsAPI} from './utilsAPI'
import { TFile } from 'obsidian';
import { UpdateSL } from '../Interfaces/UpdateSL';
import { YAMLUpdaterAPI } from '../../noteLifecycleManager/API/YAMLUpdaterAPI'
import {DateTime} from 'luxon';

export class updateSesionLectura extends YAMLUpdaterAPI implements UpdateSL{
    private utilsApi: utilsAPI;
    protected nota: object;
    protected infoSubsistema: any; 

    constructor(private plugin: Plugin) {
      super(plugin);
      this.plugin = plugin;
      this.utilsApi = new utilsAPI(plugin);
      this.tp = plugin.tp;
      this.nota = {};
      this.infoNota = {};
    }


    //actualizarNota(infoNota: any, campos: any): Promise<any>;
    //getFecha(): Promise<string>;
    //getHoraFinal(): Promise<string>;
    

    //getTiempoLeido(): Promise<string>;
    
    async getTiempoLeido(parametro, actual){  
        debugger;      
        let horaInicioStr = this.infoNota.horaInicio;
        let cierre;
        // Suponiendo que el formato es "YYYY-MM-DD dddd HH:mm" y quieres convertirlo a un formato reconocido por Date
        // Primero, elimina la parte del día de la semana, ya que Date() no la necesita
        let [fecha, , hora] = horaInicioStr.split(' ');
        let fechaHoraISO = `${fecha}T${hora}`;
        // Crear objetos Date
        let horaInicio = new Date(fechaHoraISO);
        if (parametro == undefined){    
        cierre = new Date();

        }else{
            let [fechaCierre, ,horaCierre] = parametro.split(' ');   
            let fechaHoraCierreISO = `${fechaCierre}T${horaCierre}`;
            cierre = new Date(fechaHoraCierreISO);
        }        
        // Calcular la diferencia en milisegundos
        let diferenciaEnMilisegundos = cierre - horaInicio;
        return diferenciaEnMilisegundos;
    }

    async getEstado(parametro, actual){
        let campo;
        if (parametro == undefined){
        //let suggester = this.tp.system.static_functions.get("suggester");
	    //campo = await suggester(["🔵 -> Completado - Información", "🟢 -> Finalizado","🟡 -> En ejecución", "🔴 -> Detenido"],["🔵", "🟢","🟡", "🔴"], false, "Seleccione el nuevo estado:");
        campo = "🔵";
        // Verificar si el usuario presionó Esc.
        if (campo === null) {
        new Notice("Modificación de nota cancelada por el usuario.");
        return; // Termina la ejecución de la función aquí.
	    }
        }else{
            campo = parametro;
        }

        this.nota.estado = campo;
        return campo;
    }

    async getPPM(): Promise<any>{
        debugger;
        let palabrasPorHoja = parseInt(this.infoNota.palabrasPorHoja);
        let paginasLeidas = parseInt(this.nota.pagLeidas);
        let tiempoLeido = parseInt(this.nota.tiempoLeido);
        let PPM = (palabrasPorHoja * paginasLeidas)/(tiempoLeido/60000);
        return PPM;
    }

    async getPagLeidas(): Promise<any>{
        debugger;
        let pagFin = parseInt(this.nota.pagFin);
	     let paginasLeidas = pagFin - parseInt(this.infoNota.pagInicio);
         //this.nota.pagLeidas = parseInt(paginasLeidas);
         return parseInt(paginasLeidas);
    }

    async getPagFin(): Promise<any>{
        debugger;
        let prompt = this.tp.system.static_functions.get("prompt");
        let pagFin = await prompt(`¿Hasta que página leíste?`, `${this.infoNota.pagInicio}`, true)
        //this.nota.pagFin = parseInt(pagFin)
        return parseInt(pagFin);
    }

    async getPorLeer(): Promise<number>{
        debugger;
        let porLeer = parseInt(this.infoNota.paginas) - parseInt(this.nota.pagFin);
        //this.nota.porLeer = porLeer;
        return porLeer;
    }

}