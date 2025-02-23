/*
 * Filename: /src/modules/moduloRegistroTiempo/Interfaces/RTBase.ts
 * Path: /src/modules/moduloRegistroTiempo/Interfaces
 * Created Date: 2025-02-23 15:57:40
 * Author: Andrés Julián Borbón
 * -----
 * Last Modified: 2025-02-23 17:44:40
 * Modified By: Andrés Julián Borbón
 * -----
 * Copyright (c) 2025 - Andrés Julián Borbón
 */


export interface RTBase {
        iniciarRegistro(infoSubsistema: { folder: string; indice: string; type: string; }, campos: any): Promise<any | null>;
        iniciarRegistro(): Promise<any | null>;
        cerrarRegistro(id: number | string): Promise<void>;
        cerrarRegistro(file: TFile): Promise<void>;
        cerrarRegistro(): Promise<void>;
      }