import { RTBase } from "./RTBase";

export interface RegistroTiempo extends RTBase {
    retomarRegistro(id: number | string): Promise<Registro | null>;

    retomarTarea(id: number | string): Promise<void>;
  
    detalleRegistro(id: number | string): Promise<void>;
    detalleRegistro(file: TFile): Promise<void>;
    detalleRegistro(): Promise<void>;
}