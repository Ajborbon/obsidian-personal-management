// src/defaults/defaultSettings.ts
import type { PluginMainSettings } from '../interfaces/pluginMainSettings';
import { DEFAULT_NOTION_SETTINGS } from '../modules/moduloNotion/settings'; // Import Notion defaults

export const DEFAULT_SETTINGS: PluginMainSettings = {
  moduloRegistroTiempo: true,
  moduloAliasStatusBar: true,
  moduloBase: true,
  moduloGTD: true,
  moduloTabTitle: true,  // Modulo titulo de pestañas.
  moduloTaskManager: true,
  moduloDataviewQueries: true,
  taskExecutionNavigatorModule: true,  // Activado por defecto
  moduloGTDv2: true, // Default value for the new module
  moduloNotion: false, // <-- Add default for Notion module (disabled by default)
  file_camposCentral :"Estructura/Campos Sistema Gestion/Campos Sistema Central",
  folder_Anotaciones: "Anotaciones/Notas",
  indice_Anotaciones: "Anotaciones/Indice Anotaciones",
  folder_ABlog: "Subsistemas/Articulos Blog/Articulos",
  indice_ABlog: "Subsistemas/Articulos Blog/Indice Articulos Blog",
  folder_Desarrollos: "Subsistemas/Desarrollos/Codigos",
  indice_Desarrollos: "Subsistemas/Desarrollos/Indice Desarrollo",
  folder_Estudio: "Subsistemas/Estudio/Temas",
  indice_Estudio: "Subsistemas/Estudio/Indice Estudio",
  folder_RepositorioLibros: "Subsistemas/Libros/Repositorio",
  indice_RepositorioLibros: "Subsistemas/Libros/Indice Repositorio Libros",
  folder_Biblioteca: "Subsistemas/Libros/Biblioteca",
  indice_Biblioteca: "Subsistemas/Libros/Indice Biblioteca",
  folder_KindleNotes: "Subsistemas/Libros/Kindle",
  indice_KindleNotes: "Subsistemas/Libros/Kindle/Indice Kindle",
  //folder_LecturaSesiones: "Subsistemas/Lectura/Sesiones de Lectura/Sesiones",
  //indice_LecturaSesiones: "Subsistemas/Lectura/Sesiones de Lectura/Indice Sesiones Lectura",
  folder_LecturaResumenes: "Subsistemas/Lectura/Libros/Resumenes",
  indice_LecturaResumenes: "Subsistemas/Lectura/Libros/Indice Resumenes",
  folder_Mentorias: "Subsistemas/Mentorias/Sesiones Mentoria",
  indice_Mentorias: "Subsistemas/Mentorias/Indice Mentorias",
  folder_Mercado: "Subsistemas/Mercado/Listas",
  indice_Mercado: "Subsistemas/Mercado/Indice Mercado",
  folder_ModulosSistema: "Subsistemas/Modulos Sistema Gestion/Modulos",
  indice_ModulosSistema: "Subsistemas/Modulos Sistema Gestion/Indice Modulos",
  folder_Transacciones: "Subsistemas/Transacciones",
  indice_Transacciones: "Subsistemas/Transacciones/Indice Transacciones",
  folder_Presentaciones: "Subsistemas/Presentaciones/Notas",
  indice_Presentaciones: "Subsistemas/Presentaciones/Indice Presentaciones",
  folder_Publicaciones: "Subsistemas/Publicaciones/Piezas",
  indice_Publicaciones: "Subsistemas/Publicaciones/Indice Publicaciones",
  folder_Recetas: "Subsistemas/Recetas/Recetas",
  indice_Recetas: "Subsistemas/Recetas/Indice Recetas",
  folder_RegistroTiempo: "Subsistemas/Registro Tiempo/Registros",
  indice_RegistroTiempo: "Subsistemas/Registro Tiempo/Indice Registro Tiempo",
  folder_ContenidoParaEstudio: "Subsistemas/Contenido para Estudio/Contenido",
  indice_ContenidoParaEstudio: "Subsistemas/Contenido para Estudio/Indice Contenido para Estudio",
  folder_Campaña: "Subsistemas/Marketing/Proyectos",
  indice_Campaña: "Subsistemas/Marketing/Indice Campañas",
  folder_Entregable: "Subsistemas/Marketing/Entregables",
  indice_Entregable: "Subsistemas/Marketing/Indice Entregables",

  // Estructura
  folder_AreasVida: "Estructura/Areas de Vida",
  indice_AreasVida: "Estructura/Areas de Vida/Indice Areas de Vida",
  nameFile_AreasVida: "", // Added missing default
  folder_AreasInteres: "Estructura/Areas de Interes",
  indice_AreasInteres: "Estructura/Areas de Interes/Indice Areas de Interes",
  nameFile_AreasInteres: "", // Added missing default
  folder_TemasInteres: "Estructura/Temas de Interes",
  indice_TemasInteres: "Estructura/Temas de Interes/Indice Temas de Interes",
  folder_RecursosRecurrentes: "Estructura/Recursos Recurrentes/Recursos",
  indice_RecursosRecurrentes: "Estructura/Recursos Recurrentes/Indice Recursos Recurrentes",
  folder_ProyectosQ: "Estructura/Proyectos de Q",
  indice_ProyectosQ: "Estructura/Proyectos de Q/Indice Proyectos de Q",


  file_Inbox: "Estructura/GTD/Bandeja de Entrada/Bandeja de Entrada",
  folder_ProyectosGTD: "Estructura/GTD/Proyectos GTD/Proyectos",
  indice_ProyectosGTD: "Estructura/GTD/Proyectos GTD/Indice Proyectos GTD",
  folder_RSGTD: "Estructura/GTD/Revision Semanal/Revisiones",
  indice_RSGTD: "Estructura/GTD/Revision Semanal/Indice Revision Semanal",
  folder_SistemaGTD: "Estructura/GTD/Sistema GTD/Sistema",
  indice_SistemaGTD: "Estructura/GTD/Sistema GTD/Indice Sistema GTD",
  

  // Journal
  folder_Diario: "Estructura/Journal/Diario/Notas",
  indice_Diario: "Estructura/Journal/Diario/Indice Diario",
  folder_Semanal: "Estructura/Journal/Semanal/Notas",
  indice_Semanal: "Estructura/Journal/Semanal/Indice Semanal",
  folder_Mensual: "Estructura/Journal/Mensual/Notas",
  indice_Mensual: "Estructura/Journal/Mensual/Indice Mensual",
  folder_Trimestral: "Estructura/Journal/Trimestral/Notas",
  indice_Trimestral: "Estructura/Journal/Trimestral/Indice Trimestral",
  folder_Anual: "Estructura/Journal/Anual/Notas",
  indice_Anual: "Estructura/Journal/Anual/Indice Anual",

  // COMPASS
  folder_CompassAnual: "Estructura/Compass/Reportes/Anual",
  indice_CompassAnual: "Estructura/Compass/Reportes/Indice Compass Anual",
  folder_CompassTrimestral: "Estructura/Compass/Reportes/Trimestral",
  indice_CompassTrimestral: "Estructura/Compass/Reportes/Indice Compass trimestral",
  folder_ObjCompassAnual: "Estructura/Compass/Objetivos/Anual",
  indice_ObjCompassAnual: "Estructura/Compass/Objetivos/Indice Compass Anual",
  folder_ObjCompassTrimestral: "Estructura/Compass/Objetivos/Trimestral",
  indice_ObjCompassTrimestral: "Estructura/Compass/Objetivos/Indice Compass trimestral",


   // Registros Personales
   folder_Agradecimientos: "Registros Personales/Agradecimientos/Notas",
   indice_Agradecimientos: "Registros Personales/Agradecimientos/Indice Agradecimientos",
   folder_Reflexiones: "Registros Personales/Reflexiones/Notas",
   indice_Reflexiones: "Registros Personales/Reflexiones/Indice Reflexiones",
   folder_RegistrosAkashikos: "Registros Personales/Registros Akashikos/Notas",
   indice_RegistrosAkashikos: "Registros Personales/Registros Akashikos/Indice Registros Akashikos",

   // Add default Notion settings object
   notionSettings: DEFAULT_NOTION_SETTINGS,
};
