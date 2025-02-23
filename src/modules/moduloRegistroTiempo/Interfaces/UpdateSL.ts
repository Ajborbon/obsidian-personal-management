/*
 * Filename: /src/modules/moduloRegistroTiempo/Interfaces/UpdateSL.ts
 * Path: /src/modules/moduloRegistroTiempo/Interfaces
 * Created Date: 2025-02-23 15:57:40
 * Author: Andrés Julián Borbón
 * -----
 * Last Modified: 2025-02-23 17:45:07
 * Modified By: Andrés Julián Borbón
 * -----
 * Copyright (c) 2025 - Andrés Julián Borbón
 */


export interface UpdateSL{
  
    actualizarNota(infoNota: any, campos: any): Promise<any>;
    getFecha(): Promise<string>;
    getHoraFinal(parametro: any, actual: any): Promise<string>;
    getTiempoLeido(): Promise<string>;
    getEstado(): Promise<string>;
    getPPM(): Promise<any>;
    getPaginasLeidas(): Promise<any>;
    }
