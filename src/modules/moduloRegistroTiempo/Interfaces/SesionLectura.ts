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