/*
 * Filename: /src/modules/moduloRegistroTiempo/Interfaces/RegistroTiempo.ts
 * Path: /src/modules/moduloRegistroTiempo/Interfaces
 * Created Date: 2025-02-23 15:57:40
 * Author: Andrés Julián Borbón
 * -----
 * Last Modified: 2025-02-23 17:44:30
 * Modified By: Andrés Julián Borbón
 * -----
 * Copyright (c) 2025 - Andrés Julián Borbón
 */


import { RTBase } from "./RTBase";

export interface RegistroTiempo extends RTBase {
    retomarRegistro(id: number | string): Promise<Registro | null>;

    retomarTarea(id: number | string): Promise<void>;
  
    detalleRegistro(id: number | string): Promise<void>;
    detalleRegistro(file: TFile): Promise<void>;
    detalleRegistro(): Promise<void>;
}