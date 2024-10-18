export interface RTBase {
        iniciarRegistro(infoSubsistema: { folder: string; indice: string; type: string; }, campos: any): Promise<any | null>;
        iniciarRegistro(): Promise<any | null>;
        cerrarRegistro(id: number | string): Promise<void>;
        cerrarRegistro(file: TFile): Promise<void>;
        cerrarRegistro(): Promise<void>;
      }