// src/interfaces/PluginMainSettings.ts

export interface PluginMainSettings {
    moduloRegistroTiempo: boolean,
    moduloAliasStatusBar: boolean,
    moduloBase: boolean,
    moduloGTD: boolean,
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
    folder_LecturaSesiones: string,
    indice_LecturaSesiones: string,
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
    // Pagos
    folder_Pagos: string,
    indice_Pagos: string,
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
    
    // Estructura
    folder_AreasVida: string,
    indice_AreasVida: string,
    nameFile_AreasVida : string,
    folder_AreasInteres: string,
    indice_AreasInteres: string,
    nameFile_AreasInteres : string,
    folder_TemasInteres: string,
    indice_TemasInteres: string,

     // GTD Proyectos y Revisiones Semanales
     file_Inbox: string,
     folder_ProyectosGTD: string,
     indice_ProyectosGTD: string,
     folder_RSGTD: string,
     indice_RSGTD: string,


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
    }


