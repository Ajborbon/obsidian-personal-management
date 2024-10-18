export interface UpdateSL{
  
    actualizarNota(infoNota: any, campos: any): Promise<any>;
    getFecha(): Promise<string>;
    getHoraFinal(parametro: any, actual: any): Promise<string>;
    getTiempoLeido(): Promise<string>;
    getEstado(): Promise<string>;
    getPPM(): Promise<any>;
    getPaginasLeidas(): Promise<any>;
    }
