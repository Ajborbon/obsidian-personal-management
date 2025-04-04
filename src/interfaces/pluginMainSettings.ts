// src/interfaces/PluginMainSettings.ts
// Note: NotionModuleSettings is defined in its own file now, no need to import it here.
// We import it where it's used (e.g., settingsTab.ts, main.ts)

export interface PluginMainSettings {
    moduloRegistroTiempo: boolean,
    moduloAliasStatusBar: boolean,
    moduloBase: boolean,
    moduloGTD: boolean,
    moduloTabTitle: boolean,  // Modulo de cambio de titulo de las pestañas.
    moduloTaskManager: boolean;
    moduloDataviewQueries: boolean;
    taskExecutionNavigatorModule: boolean;
    moduloGTDv2: boolean; // Added setting for the new GTD v2 module
    moduloNotion: boolean; // <-- Add setting for Notion module
    // Archivos de campos
    file_camposCentral: string,

    // DEFINICION DE ESTRUCTURA DE SUBSISTEMAS
    // Anotaciones
    folder_Anotaciones: string,
    indice_Anotaciones: string,
    // Articulos Blog
    folder_ABlog: string,
    indice_ABlog: string,
    // Desarrollos y códigos
    folder_Desarrollos: string,
    indice_Desarrollos: string,
    // Estudio
    folder_Estudio: string,
    indice_Estudio: string,    
    // Lectura
    folder_RepositorioLibros: string,
    indice_RepositorioLibros: string,
    folder_Biblioteca: string,
    indice_Biblioteca: string,
    folder_KindleNotes: string,
    indice_KindleNotes: string,
    //folder_LecturaSesiones: string,
    //indice_LecturaSesiones: string,
    folder_LecturaResumenes: string,
    indice_LecturaResumenes: string,
    // Mentorias
    folder_Mentorias: string,
    indice_Mentorias: string,
    // Mercado
    folder_Mercado: string,
    indice_Mercado: string,
    // Módulos Sistema Gestión
    folder_ModulosSistema: string,
    indice_ModulosSistema: string,
    // Pagos y Transacciones
    folder_Transacciones: string,
    indice_Transacciones: string,
    // Presentaciones
    folder_Presentaciones: string,
    indice_Presentaciones: string,
    // Proyectos de Q
    folder_ProyectosQ: string,
    indice_ProyectosQ: string,
    // Publicaciones
    folder_Publicaciones: string,
    indice_Publicaciones: string,
    // Recetas
    folder_Recetas: string,
    indice_Recetas: string,
    // Recursos Recurrentes
    folder_RecursosRecurrentes: string,
    indice_RecursosRecurrentes: string,
    // Registro Tiempo
    folder_RegistroTiempo: string,
    indice_RegistroTiempo: string,
    // Contenido para Estudio
    folder_ContenidoParaEstudio: string,
    indice_ContenidoParaEstudio: string,
  
    folder_Campaña: string,
    indice_Campaña: string,  
    // Entregables Marketing
    folder_Entregable: string,
    indice_Entregable: string, 

    // Estructura
    folder_AreasVida: string,
    indice_AreasVida: string,
    nameFile_AreasVida : string,
    folder_AreasInteres: string,
    indice_AreasInteres: string,
    nameFile_AreasInteres : string,
    folder_TemasInteres: string,
    indice_TemasInteres: string,

     // GTD Proyectos, sistema y Revisiones Semanales
     file_Inbox: string,
     folder_ProyectosGTD: string,
     indice_ProyectosGTD: string,
     folder_RSGTD: string,
     indice_RSGTD: string,
     folder_SistemaGTD: string,
     indice_SistemaGTD: string,
     


     // JOURNAL
     folder_Diario: string,
     indice_Diario: string,
     folder_Semanal: string,
     indice_Semanal: string,
     folder_Mensual: string,
     indice_Mensual: string,
     folder_Trimestral: string,
     indice_Trimestral: string,
     folder_Anual: string,
     indice_Anual: string,

     // COMPASS
    folder_CompassAnual: string,
    indice_CompassAnual: string,
    folder_CompassTrimestral: string,
    indice_CompassTrimestral: string,
    folder_ObjCompassAnual: string,
    indice_ObjCompassAnual: string,
    folder_ObjCompassTrimestral: string,
    indice_ObjCompassTrimestral: string,

    // Registros Personales
    folder_Agradecimientos: string,
    indice_Agradecimientos: string,
    folder_Reflexiones: string,
    indice_Reflexiones: string,
    folder_RegistrosAkashikos: string,
    indice_RegistrosAkashikos: string,

    // Notion specific settings (nested object)
    notionSettings: import("../modules/moduloNotion/settings").NotionModuleSettings; // Use inline import for clarity
    }
