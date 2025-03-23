// src/modules/noteLifecycleManager/API/components/ProyectoCampanasComponent.ts

import { DOMUtils } from '../utils/DOMUtils';
import { NavigationUtils } from '../utils/NavigationUtils';

/**
 * Interfaz para la información de un entregable
 */
interface Entregable {
  id: string;
  titulo: string;
  path: string;
  hits: number;
  estado: string;
  fechaPublicacion?: string;
  diferenciaDias?: number;
  alias?: string;
}

/**
 * Interfaz para la información de una campaña
 */
interface Campana {
  id: string;
  titulo: string;
  path: string;
  entregables: Entregable[];
  hits: number;
  estado: string;
  fechaInicio?: string;
  fechaFin?: string;
  alias?: string;
  diferenciaDiasProximo?: number;
}

/**
 * Interfaz para la información de un proyecto GTD
 */
interface ProyectoGTD {
  id: string;
  titulo: string;
  path: string;
  campanas: Campana[];
  hits: number;
  estado: string;
  alias?: string;
}

/**
 * Componente para gestionar y mostrar la jerarquía de Proyectos GTD y sus Campañas
 */
export class ProyectoCampanasComponent {
  private plugin: any;
  
  constructor(plugin: any) {
    this.plugin = plugin;
    console.log("🔍 ProyectoCampanasComponent iniciado");
  }
  
  /**
   * Genera un componente visual para mostrar la relación entre Proyectos GTD y Campañas
   */
  async generar(dv: any, options: {
    modo?: 'hits' | 'fechas',
    proyectoActualPath?: string
  } = {}): Promise<HTMLElement> {
    console.log("🔍 Método generar iniciado con opciones:", options);
    
    try {
      // Resolver opciones con valores predeterminados
      const configuracion = {
        modo: options.modo || 'hits',
        proyectoActualPath: options.proyectoActualPath || dv.current()?.file?.path
      };
      
      console.log("🔍 Configuración final:", configuracion);

      // Crear el contenedor principal
      const container = DOMUtils.createElement('div', {
        className: 'proyecto-campanas-container'
      });
      
      // Añadir encabezado principal
      const heading = DOMUtils.createElement('h3', {
        className: 'dashboard-heading',
        textContent: 'Dashboard de Proyectos y Campañas'
      });
      container.appendChild(heading);
      
      // Agregar controles
      const controlsDiv = this.crearControles(container, configuracion, async (nuevoModo) => {
        const nuevoContainer = await this.generar(dv, { 
          ...configuracion,
          modo: nuevoModo as 'hits' | 'fechas'
        });
        container.parentNode?.replaceChild(nuevoContainer, container);
      });
      container.appendChild(controlsDiv);
      
      // Añadir indicador de carga
      const loadingDiv = DOMUtils.createLoadingIndicator("Cargando datos de proyectos y campañas...");
      container.appendChild(loadingDiv);
      
      try {
        console.log("🔍 Iniciando carga de datos");
        // Si estamos viendo un proyecto específico, solo mostrar ese
        let proyectos: ProyectoGTD[] = [];
        let estaEnProyecto = false;
        
        if (configuracion.proyectoActualPath) {
          console.log("🔍 Buscando proyecto actual:", configuracion.proyectoActualPath);
          const archivoActual = this.plugin.app.vault.getAbstractFileByPath(configuracion.proyectoActualPath);
          
          if (archivoActual) {
            console.log("🔍 Archivo encontrado:", archivoActual.path);
            const metadataActual = this.plugin.app.metadataCache.getFileCache(archivoActual)?.frontmatter;
            console.log("🔍 Frontmatter del archivo:", metadataActual);
            
            // Verificar si la nota actual es un Proyecto GTD
            if (metadataActual && metadataActual.type === "PGTD") {
              console.log("🔍 La nota actual es un PGTD");
              estaEnProyecto = true;
              // Obtener solo este proyecto
              const proyectoInfo = await this.obtenerDatosProyecto(dv, archivoActual, configuracion.modo);
              console.log("🔍 Proyecto info:", proyectoInfo);
              
              if (proyectoInfo) {
                proyectos = [proyectoInfo];
                console.log("🔍 Proyecto añadido a lista. Número de campañas:", proyectoInfo.campanas.length);
              } else {
                console.log("🔍 No se encontró información del proyecto");
              }
            } else {
              console.log("🔍 La nota actual NO es un PGTD, es:", metadataActual?.type);
            }
          } else {
            console.log("🔍 Archivo actual no encontrado");
          }
        }
        
        // Si no estamos en un proyecto o no se pudo obtener la información, obtener todos
        if (!estaEnProyecto || proyectos.length === 0) {
          console.log("🔍 Obteniendo todos los proyectos");
          proyectos = await this.obtenerTodosLosProyectos(dv, configuracion.modo);
          console.log("🔍 Proyectos obtenidos:", proyectos.length);
        }
        
        // Eliminar el indicador de carga
        container.removeChild(loadingDiv);
        
        // Si no hay proyectos
        if (proyectos.length === 0) {
          console.log("🔍 No se encontraron proyectos con campañas");
          container.appendChild(
            DOMUtils.createElement('div', {
              className: 'empty-message',
              textContent: "No se encontraron proyectos con campañas asociadas."
            })
          );
          return container;
        }
        
        console.log("🔍 Proyectos para renderizar:", proyectos.length);
        // Resumen de proyectos y campañas
        proyectos.forEach((proy, idx) => {
          console.log(`🔍 Proyecto ${idx + 1}:`, {
            titulo: proy.titulo,
            path: proy.path,
            numCampanas: proy.campanas.length
          });
        });
        
        // Crear contenedor de estadísticas globales
        const statsContainer = this.crearEstadisticasGlobales(proyectos);
        container.appendChild(statsContainer);
        
        // Crear y mostrar árbol jerárquico de proyectos y campañas
        const jerarquiaContainer = this.crearVistaJerarquica(proyectos, configuracion.modo);
        container.appendChild(jerarquiaContainer);
        
      } catch (error) {
        // Eliminar el indicador de carga
        container.removeChild(loadingDiv);
        
        console.error("🔍 Error al cargar datos:", error);
        
        // Mostrar mensaje de error
        container.appendChild(
          DOMUtils.createErrorMessage(
            `Error al cargar datos de proyectos y campañas: ${error.message}`,
            "Revisa la consola para más detalles."
          )
        );
      }
      
      return container;
    } catch (error) {
      console.error("🔍 Error general en generar:", error);
      
      // Devolver un mensaje de error
      return DOMUtils.createErrorMessage(
        `Error al generar vista de proyectos y campañas: ${error.message}`,
        "Revisa la consola para más detalles."
      );
    }
  }

  /**
   * Crea los controles para cambiar el modo de visualización
   */
  private crearControles(container: HTMLElement, config: any, onCambioModo: (modo: string) => void): HTMLElement {
    const controlsDiv = DOMUtils.createElement('div', {
      className: 'dashboard-controls'
    });
    
    // Botón de modo Hits
    const btnHits = DOMUtils.createButton("Ver por Hits", 
      () => onCambioModo('hits'),
      { 
        className: `dashboard-btn mode-btn ${config.modo === 'hits' ? 'active' : ''}`,
        icon: '📊'
      }
    );
    
    // Botón de modo Fechas
    const btnFechas = DOMUtils.createButton("Ver por Fechas", 
      () => onCambioModo('fechas'),
      { 
        className: `dashboard-btn mode-btn ${config.modo === 'fechas' ? 'active' : ''}`,
        icon: '📅'
      }
    );
    
    // Botón para refrescar
    const refreshBtn = DOMUtils.createButton("Actualizar",
      async () => {
        const dv = window.DataviewAPI; // Acceder a la API de dataview si está disponible
        if (dv) {
          const nuevoContainer = await this.generar(dv, config);
          container.parentNode?.replaceChild(nuevoContainer, container);
        }
      },
      { className: 'dashboard-btn refresh-btn', icon: '🔄' }
    );
    
    controlsDiv.appendChild(btnHits);
    controlsDiv.appendChild(btnFechas);
    controlsDiv.appendChild(refreshBtn);
    
    return controlsDiv;
  }

  /**
   * Crea un contenedor con estadísticas globales
   */
  private crearEstadisticasGlobales(proyectos: ProyectoGTD[]): HTMLElement {
    const statsContainer = DOMUtils.createElement('div', {
      className: 'dashboard-stats-container'
    });
    
    // Calcular estadísticas globales
    const totalProyectos = proyectos.length;
    
    let totalCampanas = 0;
    let totalEntregables = 0;
    let totalHits = 0;
    let entregablesVencidos = 0;
    let entregablesPorVencer = 0; // Próximos a vencer (3 días o menos)
    
    proyectos.forEach(proyecto => {
      totalCampanas += proyecto.campanas.length;
      totalHits += proyecto.hits;
      
      proyecto.campanas.forEach(campana => {
        totalEntregables += campana.entregables.length;
        
        campana.entregables.forEach(entregable => {
          if (entregable.diferenciaDias !== undefined) {
            if (entregable.diferenciaDias < 0) {
              entregablesVencidos++;
            } else if (entregable.diferenciaDias <= 3) {
              entregablesPorVencer++;
            }
          }
        });
      });
    });
    
    console.log("🔍 Estadísticas globales:", {
      totalProyectos,
      totalCampanas,
      totalEntregables,
      totalHits,
      entregablesVencidos,
      entregablesPorVencer
    });
    
    // Crear tarjetas de estadísticas
    this.crearTarjetaEstadistica(statsContainer, "📂", "Proyectos", totalProyectos);
    this.crearTarjetaEstadistica(statsContainer, "📊", "Campañas", totalCampanas);
    this.crearTarjetaEstadistica(statsContainer, "📄", "Entregables", totalEntregables);
    this.crearTarjetaEstadistica(statsContainer, "👁️", "Total Hits", totalHits);
    
    if (entregablesVencidos > 0) {
      this.crearTarjetaEstadistica(statsContainer, "⚠️", "Vencidos", entregablesVencidos, "#e74c3c");
    }
    
    if (entregablesPorVencer > 0) {
      this.crearTarjetaEstadistica(statsContainer, "⏰", "Por vencer", entregablesPorVencer, "#f39c12");
    }
    
    return statsContainer;
  }
  
  /**
   * Crea una tarjeta de estadística
   */
  private crearTarjetaEstadistica(
    container: HTMLElement, 
    icono: string, 
    titulo: string, 
    valor: number | string,
    colorDestacado?: string
  ): void {
    const tarjeta = DOMUtils.createElement('div', {
      className: 'stats-card'
    });
    
    // Si hay color destacado, aplicarlo
    if (colorDestacado) {
      tarjeta.style.borderLeft = `4px solid ${colorDestacado}`;
    }
    
    const iconoEl = DOMUtils.createElement('div', {
      className: 'stats-card-icon',
      textContent: icono
    });
    
    const infoContainer = DOMUtils.createElement('div', {
      className: 'stats-card-info'
    });
    
    const tituloEl = DOMUtils.createElement('div', {
      className: 'stats-card-title',
      textContent: titulo
    });
    
    const valorEl = DOMUtils.createElement('div', {
      className: 'stats-card-value',
      textContent: valor.toString()
    });
    
    // Si hay color destacado, aplicarlo también al valor
    if (colorDestacado) {
      valorEl.style.color = colorDestacado;
    }
    
    infoContainer.appendChild(tituloEl);
    infoContainer.appendChild(valorEl);
    
    tarjeta.appendChild(iconoEl);
    tarjeta.appendChild(infoContainer);
    
    container.appendChild(tarjeta);
  }

  /**
   * Crea la vista jerárquica de proyectos y campañas
   */
  private crearVistaJerarquica(proyectos: ProyectoGTD[], modo: 'hits' | 'fechas'): HTMLElement {
    const container = DOMUtils.createElement('div', {
      className: 'jerarquia-container'
    });
    
    // Ordenar proyectos según el modo
    const proyectosOrdenados = this.ordenarProyectos(proyectos, modo);
    
    // Crear sección para cada proyecto
    proyectosOrdenados.forEach((proyecto, idx) => {
      console.log(`🔍 Renderizando proyecto ${idx + 1}: ${proyecto.titulo} con ${proyecto.campanas.length} campañas`);
      const proyectoSection = this.crearSeccionProyecto(proyecto, modo);
      container.appendChild(proyectoSection);
    });
    
    return container;
  }
  
  /**
   * Ordena los proyectos según el modo seleccionado
   */
  private ordenarProyectos(proyectos: ProyectoGTD[], modo: 'hits' | 'fechas'): ProyectoGTD[] {
    if (modo === 'hits') {
      // Ordenar por hits (mayor a menor)
      return [...proyectos].sort((a, b) => b.hits - a.hits);
    } else {
      // Ordenar por fecha del entregable más próximo a vencer
      return [...proyectos].sort((a, b) => {
        const proximoA = this.obtenerDiasProximoVencimiento(a);
        const proximoB = this.obtenerDiasProximoVencimiento(b);
        
        // Si alguno no tiene fechas, ponerlo al final
        if (proximoA === null && proximoB === null) return 0;
        if (proximoA === null) return 1;
        if (proximoB === null) return -1;
        
        // Ordenar por proximidad (menor número de días primero)
        return proximoA - proximoB;
      });
    }
  }
  
  /**
   * Obtiene los días hasta el próximo vencimiento en un proyecto
   */
  private obtenerDiasProximoVencimiento(proyecto: ProyectoGTD): number | null {
    let minDias: number | null = null;
    
    proyecto.campanas.forEach(campana => {
      campana.entregables.forEach(entregable => {
        if (entregable.diferenciaDias !== undefined) {
          if (minDias === null || entregable.diferenciaDias < minDias) {
            minDias = entregable.diferenciaDias;
          }
        }
      });
    });
    
    return minDias;
  }

  /**
   * Crea una sección para un proyecto
   */
  private crearSeccionProyecto(proyecto: ProyectoGTD, modo: 'hits' | 'fechas'): HTMLElement {
    console.log(`🔍 Creando sección para proyecto: ${proyecto.titulo}. Campañas: ${proyecto.campanas.length}`);
    
    const proyectoSection = DOMUtils.createElement('details', {
      className: 'proyecto-section',
      attributes: {
        'open': 'true' // Abierto por defecto
      }
    });
    
    // Crear encabezado del proyecto (summary)
    const proyectoHeader = DOMUtils.createElement('summary', {
      className: 'proyecto-header'
    });
    
    // Añadir estado
    if (proyecto.estado) {
      const estadoSpan = DOMUtils.createElement('span', {
        className: 'estado-badge',
        textContent: proyecto.estado
      });
      proyectoHeader.appendChild(estadoSpan);
    }
    
    // Título con enlace
    try {
      const tituloContainer = DOMUtils.createElement('div', {
        className: 'proyecto-titulo-container'
      });
      
      const iconoProyecto = DOMUtils.createElement('span', {
        className: 'proyecto-icono',
        textContent: '📂'
      });
      tituloContainer.appendChild(iconoProyecto);
      
      const enlaceProyecto = DOMUtils.createElement('a', {
        className: 'proyecto-link',
        textContent: proyecto.titulo || proyecto.alias || 'Proyecto sin título',
        attributes: {
          'data-href': proyecto.path
        },
        events: {
          click: (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.plugin.app.workspace.openLinkText(proyecto.path, "", true);
          }
        }
      });
      tituloContainer.appendChild(enlaceProyecto);
      
      proyectoHeader.appendChild(tituloContainer);
    } catch (e) {
      console.error(`🔍 Error al crear enlace del proyecto: ${e.message}`);
      const textoProyecto = DOMUtils.createElement('span', {
        className: 'proyecto-titulo',
        textContent: proyecto.titulo || proyecto.alias || 'Proyecto sin título'
      });
      proyectoHeader.appendChild(textoProyecto);
    }
    
    // Métricas del proyecto
    const metricasContainer = DOMUtils.createElement('div', {
      className: 'proyecto-metricas'
    });
    
    // Contador de campañas
    const campanasCount = DOMUtils.createElement('span', {
      className: 'campanas-count',
      textContent: `${proyecto.campanas.length} ${proyecto.campanas.length === 1 ? 'campaña' : 'campañas'}`
    });
    metricasContainer.appendChild(campanasCount);
    
    // Mostrar hits o fechas según el modo
    if (modo === 'hits') {
      const hitsCount = DOMUtils.createElement('span', {
        className: 'hits-count',
        textContent: `${proyecto.hits} hits`
      });
      metricasContainer.appendChild(hitsCount);
    } else {
      // Mostrar el próximo vencimiento si existe
      const proximoVencimiento = this.obtenerDiasProximoVencimiento(proyecto);
      if (proximoVencimiento !== null) {
        const vencimientoSpan = DOMUtils.createElement('span', {
          className: `vencimiento-badge ${this.obtenerClaseVencimiento(proximoVencimiento)}`,
          textContent: this.formatearDiasVencimiento(proximoVencimiento)
        });
        metricasContainer.appendChild(vencimientoSpan);
      }
    }
    
    proyectoHeader.appendChild(metricasContainer);
    proyectoSection.appendChild(proyectoHeader);
    
    // Contenido del proyecto (campañas)
    const proyectoContent = DOMUtils.createElement('div', {
      className: 'proyecto-content'
    });
    
    // Ordenar campañas según el modo
    const campanasOrdenadas = this.ordenarCampanas(proyecto.campanas, modo);
    
    if (campanasOrdenadas.length === 0) {
      console.log(`🔍 ⚠️ El proyecto ${proyecto.titulo} no tiene campañas asociadas`);
      const infoNoData = DOMUtils.createElement('div', {
        className: 'empty-message',
        textContent: "Este proyecto no tiene campañas asociadas."
      });
      proyectoContent.appendChild(infoNoData);
    } else {
      console.log(`🔍 Renderizando ${campanasOrdenadas.length} campañas para el proyecto ${proyecto.titulo}`);
    
      // Crear sección para cada campaña
      campanasOrdenadas.forEach((campana, idx) => {
        console.log(`🔍 Creando elemento para campaña ${idx + 1}: ${campana.titulo}`);
        const campanaElement = this.crearElementoCampana(campana, modo);
        proyectoContent.appendChild(campanaElement);
      });
    }
    
    proyectoSection.appendChild(proyectoContent);
    
    return proyectoSection;
  }
  
  /**
   * Ordena las campañas según el modo seleccionado
   */
  private ordenarCampanas(campanas: Campana[], modo: 'hits' | 'fechas'): Campana[] {
    if (campanas.length === 0) {
      return []; // No hay campañas para ordenar
    }
    
    if (modo === 'hits') {
      // Ordenar por hits (mayor a menor)
      return [...campanas].sort((a, b) => b.hits - a.hits);
    } else {
      // Ordenar por fecha del entregable más próximo a vencer
      return [...campanas].sort((a, b) => {
        if (a.diferenciaDiasProximo === undefined && b.diferenciaDiasProximo === undefined) return 0;
        if (a.diferenciaDiasProximo === undefined) return 1;
        if (b.diferenciaDiasProximo === undefined) return -1;
        
        // Ordenar por proximidad (menor número de días primero)
        return a.diferenciaDiasProximo - b.diferenciaDiasProximo;
      });
    }
  }

  /**
   * Crea un elemento para mostrar una campaña
   */
  private crearElementoCampana(campana: Campana, modo: 'hits' | 'fechas'): HTMLElement {
    const campanaElement = DOMUtils.createElement('details', {
      className: 'campana-element',
      attributes: {
        'open': 'true' // Abierto por defecto
      }
    });
    
    // Crear encabezado de la campaña (summary)
    const campanaHeader = DOMUtils.createElement('summary', {
      className: 'campana-header'
    });
    
    // Añadir estado
    if (campana.estado) {
      const estadoSpan = DOMUtils.createElement('span', {
        className: 'estado-badge',
        textContent: campana.estado
      });
      campanaHeader.appendChild(estadoSpan);
    }
    
    // Título con enlace
    try {
      const tituloContainer = DOMUtils.createElement('div', {
        className: 'campana-titulo-container'
      });
      
      const iconoCampana = DOMUtils.createElement('span', {
        className: 'campana-icono',
        textContent: '📊'
      });
      tituloContainer.appendChild(iconoCampana);
      
      const enlaceCampana = DOMUtils.createElement('a', {
        className: 'campana-link',
        textContent: campana.titulo || campana.alias || 'Campaña sin título',
        attributes: {
          'data-href': campana.path
        },
        events: {
          click: (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.plugin.app.workspace.openLinkText(campana.path, "", true);
          }
        }
      });
      tituloContainer.appendChild(enlaceCampana);
      
      campanaHeader.appendChild(tituloContainer);
    } catch (e) {
      console.error(`🔍 Error al crear enlace de campaña: ${e.message}`);
      const textoCampana = DOMUtils.createElement('span', {
        className: 'campana-titulo',
        textContent: campana.titulo || campana.alias || 'Campaña sin título'
      });
      campanaHeader.appendChild(textoCampana);
    }
    
    // Métricas de la campaña
    const metricasContainer = DOMUtils.createElement('div', {
      className: 'campana-metricas'
    });
    
    // Contador de entregables
    const entregablesCount = DOMUtils.createElement('span', {
      className: 'entregables-count',
      textContent: `${campana.entregables.length} ${campana.entregables.length === 1 ? 'entregable' : 'entregables'}`
    });
    metricasContainer.appendChild(entregablesCount);
    
    // Mostrar hits o fechas según el modo
    if (modo === 'hits') {
      const hitsCount = DOMUtils.createElement('span', {
        className: 'hits-count',
        textContent: `${campana.hits} hits`
      });
      metricasContainer.appendChild(hitsCount);
    } else {
      // Mostrar el próximo vencimiento si existe
      if (campana.diferenciaDiasProximo !== undefined) {
        const vencimientoSpan = DOMUtils.createElement('span', {
          className: `vencimiento-badge ${this.obtenerClaseVencimiento(campana.diferenciaDiasProximo)}`,
          textContent: this.formatearDiasVencimiento(campana.diferenciaDiasProximo)
        });
        metricasContainer.appendChild(vencimientoSpan);
      }
    }
    
    campanaHeader.appendChild(metricasContainer);
    campanaElement.appendChild(campanaHeader);
    
    // Contenido de la campaña (entregables)
    const campanaContent = DOMUtils.createElement('div', {
      className: 'campana-content'
    });
    
    if (campana.entregables.length === 0) {
      console.log(`🔍 ⚠️ La campaña ${campana.titulo} no tiene entregables asociados`);
      const infoNoData = DOMUtils.createElement('div', {
        className: 'empty-message',
        textContent: "Esta campaña no tiene entregables asociados."
      });
      campanaContent.appendChild(infoNoData);
    } else {
      console.log(`🔍 Renderizando ${campana.entregables.length} entregables para la campaña ${campana.titulo}`);
      
      // Ordenar entregables según el modo
      const entregablesOrdenados = this.ordenarEntregables(campana.entregables, modo);
      
      // Crear tabla de entregables
      const tablaEntregables = this.crearTablaEntregables(entregablesOrdenados, modo);
      campanaContent.appendChild(tablaEntregables);
    }
    
    campanaElement.appendChild(campanaContent);
    
    return campanaElement;
  }
  
  /**
   * Ordena los entregables según el modo seleccionado
   */
  private ordenarEntregables(entregables: Entregable[], modo: 'hits' | 'fechas'): Entregable[] {
    if (entregables.length === 0) {
      return []; // No hay entregables para ordenar
    }
    
    if (modo === 'hits') {
      // Ordenar por hits (mayor a menor)
      return [...entregables].sort((a, b) => b.hits - a.hits);
    } else {
      // Ordenar por fecha de publicación (más cercanos a vencer primero)
      return [...entregables].sort((a, b) => {
        if (a.diferenciaDias === undefined && b.diferenciaDias === undefined) return 0;
        if (a.diferenciaDias === undefined) return 1;
        if (b.diferenciaDias === undefined) return -1;
        
        // Ordenar por proximidad (menor número de días primero)
        return a.diferenciaDias - b.diferenciaDias;
      });
    }
  }

  /**
   * Crea una tabla para mostrar los entregables
   */
  private crearTablaEntregables(entregables: Entregable[], modo: 'hits' | 'fechas'): HTMLElement {
    const tabla = DOMUtils.createElement('table', {
      className: 'entregables-tabla'
    });
    
    // Crear encabezado de la tabla
    const thead = DOMUtils.createElement('thead');
    const headerRow = DOMUtils.createElement('tr');
    
    // Columnas comunes
    const columnas = [
      { id: 'estado', texto: 'Estado', className: 'col-estado', width: '40px' },
      { id: 'titulo', texto: 'Entregable', className: 'col-titulo', width: '50%' }
    ];
    
    // Columnas específicas según el modo
    if (modo === 'hits') {
      columnas.push({ id: 'hits', texto: 'Hits', className: 'col-hits', width: '80px' });
    } else {
      columnas.push({ id: 'fecha', texto: 'Publicación', className: 'col-fecha', width: '120px' });
      columnas.push({ id: 'dias', texto: 'Días', className: 'col-dias', width: '80px' });
    }
    
    // Crear celdas de encabezado
    columnas.forEach(columna => {
      const th = DOMUtils.createElement('th', {
        className: columna.className,
        textContent: columna.texto,
        styles: {
          width: columna.width
        }
      });
      headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    tabla.appendChild(thead);
    
    // Crear cuerpo de la tabla
    const tbody = DOMUtils.createElement('tbody');
    
    // Crear filas para cada entregable
    entregables.forEach(entregable => {
      const row = DOMUtils.createElement('tr', {
        className: `entregable-row ${this.obtenerClaseParaEstado(entregable.estado)}`
      });
      
      // Columnas comunes
      
      // Estado
      const estadoCell = DOMUtils.createElement('td', {
        className: 'col-estado'
      });
      const estadoBadge = DOMUtils.createElement('span', {
        className: 'estado-badge-small',
        textContent: entregable.estado
      });
      estadoCell.appendChild(estadoBadge);
      row.appendChild(estadoCell);
      
      // Título con enlace
      const tituloCell = DOMUtils.createElement('td', {
        className: 'col-titulo'
      });
      
      try {
        const enlaceEntregable = DOMUtils.createElement('a', {
          className: 'entregable-link',
          textContent: entregable.titulo || entregable.alias || 'Entregable sin título',
          attributes: {
            'data-href': entregable.path
          },
          events: {
            click: (event) => {
              event.preventDefault();
              this.plugin.app.workspace.openLinkText(entregable.path, "", true);
            }
          }
        });
        tituloCell.appendChild(enlaceEntregable);
      } catch (e) {
        console.error(`🔍 Error al crear enlace del entregable: ${e.message}`);
        const textoEntregable = DOMUtils.createElement('span', {
          textContent: entregable.titulo || entregable.alias || 'Entregable sin título'
        });
        tituloCell.appendChild(textoEntregable);
      }
      
      row.appendChild(tituloCell);
      
      // Columnas específicas según el modo
      if (modo === 'hits') {
        const hitsCell = DOMUtils.createElement('td', {
          className: 'col-hits',
          textContent: String(entregable.hits || 0)
        });
        row.appendChild(hitsCell);
      } else {
        // Fecha de publicación
        // Fecha de publicación formateada
        const fechaCell = DOMUtils.createElement('td', {
          className: 'col-fecha',
          textContent: this.formatearFechaPublicacion(entregable.fechaPublicacion)
        });
        row.appendChild(fechaCell);
        
        // Días hasta/desde la fecha
        const diasCell = DOMUtils.createElement('td', {
          className: 'col-dias'
        });
        
        if (entregable.diferenciaDias !== undefined) {
          const diasSpan = DOMUtils.createElement('span', {
            className: `dias-badge ${this.obtenerClaseVencimiento(entregable.diferenciaDias)}`,
            textContent: this.formatearDiasVencimiento(entregable.diferenciaDias)
          });
          diasCell.appendChild(diasSpan);
        } else {
          diasCell.textContent = "—";
        }
        
        row.appendChild(diasCell);
      }
      
      tbody.appendChild(row);
    });
    
    tabla.appendChild(tbody);
    return tabla;
  }

  /**
   * Obtiene la clase CSS correspondiente al estado de un entregable
   */
  private obtenerClaseParaEstado(estado: string): string {
    switch (estado) {
      case "🟢": return "estado-activo";
      case "🟡": return "estado-espera";
      case "🔴": return "estado-detenido";
      case "🔵": return "estado-archivado";
      default: return "";
    }
  }

  /**
   * Obtiene la clase CSS correspondiente a los días de vencimiento
   */
  private obtenerClaseVencimiento(dias: number): string {
    if (dias < 0) return "vencido"; // Ya vencido
    if (dias <= 1) return "hoy"; // Hoy o mañana
    if (dias <= 3) return "proximo"; // Próximos 3 días
    if (dias <= 7) return "cercano"; // Próxima semana
    return "futuro"; // Más de una semana
  }
  
  /**
   * Formatea los días para mostrar de forma legible
   */
  private formatearDiasVencimiento(dias: number): string {
    if (dias === 0) return "Hoy";
    if (dias === 1) return "Mañana";
    if (dias < 0) {
      const diasAbs = Math.abs(dias);
      return `Vencido (${diasAbs} ${diasAbs === 1 ? 'día' : 'días'})`;
    }
    return `${dias} días`;
  }

/**
 * Obtiene todos los proyectos GTD con sus campañas y entregables asociados - Versión optimizada
 */
private async obtenerTodosLosProyectos(dv: any, modo: 'hits' | 'fechas'): Promise<ProyectoGTD[]> {
  try {
    console.log("🔍 Método obtenerTodosLosProyectos iniciado");
    
    // Obtener fecha actual para calcular diferencias
    const hoy = window.moment().startOf('day');
    
    // 1. Obtener todos los proyectos GTD activos
    console.log("🔍 Consultando proyectos PGTD activos");
    const proyectosGTD = dv.pages()
      .where(p => p.type === "PGTD" && p.estado === "🟢")
      .array();
    console.log(`🔍 Encontrados ${proyectosGTD.length} proyectos PGTD activos`);
    
    // Mostrar resumen de proyectos encontrados para diagnóstico
    proyectosGTD.forEach((proy, idx) => {
      console.log(`🔍 Proyecto PGTD ${idx + 1}: ${proy.titulo || proy.file.basename}`);
      console.log(`    - Path: ${proy.file.path}`);
      console.log(`    - Estado: ${proy.estado}`);
    });
    
    // 2. Obtener todas las campañas activas 
    console.log("🔍 Consultando campañas activas");
    const todasLasCampanas = dv.pages()
      .where(p => p.type === "Cp" && (p.estado === "🟢" || p.estado === "🟡"))
      .array();
    console.log(`🔍 Encontradas ${todasLasCampanas.length} campañas activas`);
    
    // Diagnóstico: mostrar todas las campañas encontradas
    todasLasCampanas.forEach((campana, idx) => {
      console.log(`🔍 Campaña ${idx + 1}: ${campana.titulo || campana.file.basename}`);
      console.log(`    - Path: ${campana.file.path}`);
      console.log(`    - Estado: ${campana.estado}`);
      console.log(`    - ProyectoGTD: ${JSON.stringify(campana.proyectoGTD)}`);
    });
    
    // 3. Obtener todos los entregables
    console.log("🔍 Consultando entregables");
    const todosLosEntregables = dv.pages()
      .where(p => p.type === "EMkt" && (p.estado === "🟢" || p.estado === "🟡"))
      .array();
    console.log(`🔍 Encontrados ${todosLosEntregables.length} entregables activos`);
    
    // 4. Mapear los datos a nuestras interfaces
    const proyectos: ProyectoGTD[] = [];
    
    // Función mejorada para verificar si una referencia apunta a un proyecto
    const referenciaApuntaA = (ref: any, targetPath: string, targetBasename: string, targetTitulo?: string): boolean => {
      // Caso 1: referencia es un objeto con path
      if (ref && typeof ref === 'object' && ref.path) {
        const coincide = ref.path === targetPath;
        if (coincide) {
          console.log(`🔍 Coincidencia por objeto.path: ${ref.path} === ${targetPath}`);
        }
        return coincide;
      }
      
      // Caso 2: referencia es una cadena
      if (ref && typeof ref === 'string') {
        // Caso 2.1: Es un wikilink [[ruta|alias]]
        const wikiLinkMatch = ref.match(/\[\[(.*?)(?:\|(.*?))?\]\]/);
        if (wikiLinkMatch) {
          const path = wikiLinkMatch[1];
          // Intenta coincidir con la ruta, el nombre del archivo o el título
          const coincidePorPath = path === targetPath;
          const coincidePorNombre = path === targetBasename;
          const coincidePorTitulo = targetTitulo && path === targetTitulo;
          
          if (coincidePorPath || coincidePorNombre || coincidePorTitulo) {
            console.log(`🔍 Coincidencia por wikilink: ${path} coincide con ${targetPath}, ${targetBasename} o ${targetTitulo}`);
          }
          
          return coincidePorPath || coincidePorNombre || coincidePorTitulo;
        }
        
        // Caso 2.2: Es solo el nombre del archivo o título sin formato wikilink
        const coincidePorPath = ref === targetPath;
        const coincidePorNombre = ref === targetBasename;
        const coincidePorTitulo = targetTitulo && ref === targetTitulo;
        
        if (coincidePorPath || coincidePorNombre || coincidePorTitulo) {
          console.log(`🔍 Coincidencia directa: ${ref} coincide con ${targetPath}, ${targetBasename} o ${targetTitulo}`);
        }
        
        return coincidePorPath || coincidePorNombre || coincidePorTitulo;
      }
      
      return false;
    };
    
    // Para cada proyecto, encontrar sus campañas y entregables
    for (const proy of proyectosGTD) {
      console.log(`🔍 Procesando proyecto: ${proy.titulo || proy.file.basename}`);
      
      // Encontrar campañas asociadas a este proyecto
      const campanasDelProyecto = todasLasCampanas.filter(camp => {
        if (!camp.proyectoGTD) {
          return false; // No tiene referencia a proyecto
        }
        
        // Normalizar a array (podría ser string u objeto)
        const referencias = Array.isArray(camp.proyectoGTD) ? camp.proyectoGTD : [camp.proyectoGTD];
        
        // Verificar si alguna referencia apunta a este proyecto
        for (const ref of referencias) {
          if (referenciaApuntaA(ref, proy.file.path, proy.file.basename, proy.titulo)) {
            console.log(`🔍 ✅ La campaña ${camp.titulo || camp.file.basename} está asociada al proyecto ${proy.titulo || proy.file.basename}`);
            return true;
          }
        }
        
        return false;
      });
      
      console.log(`🔍 Encontradas ${campanasDelProyecto.length} campañas para el proyecto ${proy.titulo || proy.file.basename}`);
      
      // Si no tiene campañas asociadas, pasar al siguiente proyecto
      if (campanasDelProyecto.length === 0) {
        console.log(`🔍 ⚠️ El proyecto ${proy.titulo || proy.file.basename} no tiene campañas asociadas, se omitirá`);
        continue;
      }
      
      // Procesar campañas y entregables
      const campanasProcessed: Campana[] = [];
      let totalHitsProyecto = 0;
      
      for (const camp of campanasDelProyecto) {
        console.log(`🔍 Procesando campaña: ${camp.titulo || camp.file.basename}`);
        
        // CAMBIO AQUÍ: Encontrar entregables asociados a esta campaña usando el campo asunto
        const entregablesDeCampana = todosLosEntregables.filter(ent => {
          if (!ent.asunto) {
            return false; // No tiene referencia a campaña
          }
          
          // Normalizar a array
          const referencias = Array.isArray(ent.asunto) ? ent.asunto : [ent.asunto];
          
          // Verificar si alguna referencia apunta a esta campaña
          for (const ref of referencias) {
            if (referenciaApuntaA(ref, camp.file.path, camp.file.basename, camp.titulo)) {
              console.log(`🔍 ✅ El entregable ${ent.titulo || ent.file.basename} está asociado a la campaña ${camp.titulo || camp.file.basename}`);
              return true;
            }
          }
          
          return false;
        });
        
        console.log(`🔍 Encontrados ${entregablesDeCampana.length} entregables para la campaña ${camp.titulo || camp.file.basename}`);
        
        // Procesar entregables
        const entregablesProcessed: Entregable[] = [];
        let totalHitsCampana = 0;
        let minDiasCampana: number | undefined;
        
        for (const ent of entregablesDeCampana) {
          // Calcular días hasta publicación
          let diferenciaDias: number | undefined;
          
          if (ent.publicacion) {
            try {
              const fechaPublicacion = window.moment(ent.publicacion.toString(), "YYYY-MM-DD");
              if (fechaPublicacion.isValid()) {
                diferenciaDias = fechaPublicacion.diff(hoy, 'days');
                console.log(`🔍 Entregable ${ent.titulo || ent.file.basename}: publicación ${ent.publicacion} (${diferenciaDias} días)`);
              }
            } catch (e) {
              console.warn(`🔍 Error procesando fecha para ${ent.file.path}: ${e.message}`);
            }
          }
          
          // Actualizar mínimo para la campaña
          if (diferenciaDias !== undefined) {
            if (minDiasCampana === undefined || diferenciaDias < minDiasCampana) {
              minDiasCampana = diferenciaDias;
            }
          }
          
          // Procesar hits
          let hits = 0;
          if (ent.hits !== undefined && ent.hits !== null) {
            // Intentar convertir a número
            hits = typeof ent.hits === 'number'
              ? ent.hits
              : parseFloat(ent.hits) || 0;
          }
          
          // Crear objeto entregable
          const entregableInfo: Entregable = {
            id: ent.id || `ent-${entregablesProcessed.length}`,
            titulo: ent.titulo || ent.file.basename,
            path: ent.file.path,
            hits: hits,
            estado: ent.estado || "🟡",
            fechaPublicacion: ent.publicacion,
            diferenciaDias,
            alias: ent.aliases?.[0]
          };
          
          entregablesProcessed.push(entregableInfo);
          totalHitsCampana += hits;
        }
        
        // Crear objeto campaña
        const campanaInfo: Campana = {
          id: camp.id || `camp-${campanasProcessed.length}`,
          titulo: camp.titulo || camp.file.basename,
          path: camp.file.path,
          entregables: entregablesProcessed,
          hits: totalHitsCampana,
          estado: camp.estado || "🟡",
          fechaInicio: camp.fechaInicio,
          fechaFin: camp.fechaFin,
          alias: camp.aliases?.[0],
          diferenciaDiasProximo: minDiasCampana
        };
        
        campanasProcessed.push(campanaInfo);
        totalHitsProyecto += totalHitsCampana;
        
        console.log(`🔍 Campaña ${campanaInfo.titulo} añadida con ${entregablesProcessed.length} entregables y ${totalHitsCampana} hits`);
      }
      
      // Crear objeto proyecto
      const proyectoInfo: ProyectoGTD = {
        id: proy.id || `proy-${proyectos.length}`,
        titulo: proy.titulo || proy.file.basename,
        path: proy.file.path,
        campanas: campanasProcessed,
        hits: totalHitsProyecto,
        estado: proy.estado || "🟡",
        alias: proy.aliases?.[0]
      };
      
      proyectos.push(proyectoInfo);
      
      console.log(`🔍 Proyecto ${proyectoInfo.titulo} añadido con ${campanasProcessed.length} campañas y ${totalHitsProyecto} hits`);
    }
    
    console.log(`🔍 Total de proyectos procesados con campañas: ${proyectos.length}`);
    
    return proyectos;
  } catch (error) {
    console.error("🔍 Error al obtener datos de proyectos y campañas:", error);
    throw error;
  }
}


  /**
   * Obtiene los datos de un proyecto específico
   */
  private async obtenerDatosProyecto(dv: any, archivoProyecto: any, modo: 'hits' | 'fechas'): Promise<ProyectoGTD | null> {
    try {
      console.log(`🔍 Obteniendo datos específicos para el proyecto: ${archivoProyecto.path}`);
      
      const proyectos = await this.obtenerTodosLosProyectos(dv, modo);
      
      // Buscar el proyecto específico
      const proyectoEncontrado = proyectos.find(p => p.path === archivoProyecto.path);
      
      if (proyectoEncontrado) {
        console.log(`🔍 Proyecto encontrado: ${proyectoEncontrado.titulo} con ${proyectoEncontrado.campanas.length} campañas`);
      } else {
        console.log(`🔍 ⚠️ No se encontró el proyecto en la lista de proyectos procesados`);
      }
      
      return proyectoEncontrado || null;
    } catch (error) {
      console.error(`🔍 Error al obtener datos del proyecto ${archivoProyecto.path}:`, error);
      throw error;
    }
  }


  /**
 * Formatea una fecha en formato ISO a un formato más legible
 * @param fechaStr String de fecha en formato ISO o similar
 * @returns Fecha formateada como "dddd, dd de mm del yyyy"
 */
private formatearFechaPublicacion(fechaStr: string | undefined): string {
  if (!fechaStr) return 'No definida';
  
  try {
    // Intentar parsear la fecha con moment
    const fecha = window.moment(fechaStr.toString());
    
    if (!fecha.isValid()) {
      console.log(`🔍 Error: Fecha inválida ${fechaStr}`);
      return fechaStr; // Devolver original si no es válida
    }
    
    // Configurar moment para usar español
    const locale = window.moment.locale();
    if (locale !== 'es') {
      window.moment.locale('es');
    }
    
    // Formatear la fecha al estilo "sábado, 22 de marzo del 2025"
    // El formato en moment.js usa:
    // dddd = nombre día semana, DD = día (número), MMMM = mes (nombre), YYYY = año completo
    const fechaFormateada = fecha.format('dddd, DD [de] MMMM [del] YYYY');
    
    // Restaurar el locale original si fue cambiado
    if (locale !== 'es') {
      window.moment.locale(locale);
    }
    
    return fechaFormateada;
  } catch (e) {
    console.warn(`🔍 Error al formatear fecha: ${e.message}`);
    return fechaStr || 'No definida';
  }
}
}