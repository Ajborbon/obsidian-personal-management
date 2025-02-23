/*
 * Filename: /src/modules/moduloRegistroTiempo/Interfaces/SesionLectura.ts
 * Path: /src/modules/moduloRegistroTiempo/Interfaces
 * Created Date: 2025-02-23 15:57:40
 * Author: Andrés Julián Borbón
 * -----
 * Last Modified: 2025-02-23 17:44:53
 * Modified By: Andrés Julián Borbón
 * -----
 * Copyright (c) 2025 - Andrés Julián Borbón
 */


import { RTBase } from "./RTBase";

export interface SesionLectura extends RTBase {
  
getId(): Promise<number>;
getFecha(): Promise<string>;
getTitulo(): Promise<string>;
getDescripcion(): Promise<string>;
getEstado(): Promise<string>;
getAliases(): Promise<string[]>;
getRename(): Promise<string>;
getNota(): Promise<any>;
}