// src/modules/noteLifecycleManager/API/components/TareasInboxComponent.ts

import { DOMUtils } from '../utils/DOMUtils';
import { NavigationUtils } from '../utils/NavigationUtils';

interface TareaInbox {
  rutaArchivo: string;
  texto: string;
  textoOriginal?: string;
  lineInfo?: {
    numero?: number;
  };
  fechaVencimiento?: string;
  fechaScheduled?: string;
  fechaStart?: string;
  etiquetas: {
    contextos?: string[];
    personas?: string[];
    otras: string[];
  };
}

interface NotaConTareas {
  titulo: string;
  ruta: string;
  tareas: TareaInbox[];
}

/**
 * Componente para gestionar y mostrar tareas en la bandeja de entrada
 */
export class TareasInboxComponent {
  private plugin: any;
  
  constructor(plugin: any) {
    this.plugin = plugin;
  }
  
  /**
   * Genera un componente visual para mostrar tareas con etiqueta #inbox
   */
  async generar(dv: any): Promise<HTMLElement> {
    try {
      // Crear el contenedor principal
      const container = DOMUtils.createElement('div', {
        className: 'tareas-inbox-container'
      });
      
      // Añadir estilos inline como solución temporal
      // En una refactorización más profunda, deberían moverse a un archivo CSS
      this.añadirEstilos(container);
      
      // Añadir encabezado principal
      const heading = DOMUtils.createElement('h3', {
        className: 'inbox-heading',
        children: [
          DOMUtils.createElement('span', {
            textContent: '📥 Tareas en Bandeja de Entrada'
          })
        ]
      });
      container.appendChild(heading);
      
      // Agregar controles
      const controlsDiv = this.crearControles(container);
      container.appendChild(controlsDiv);
      
      // Añadir indicador de carga
      const loadingDiv = DOMUtils.createLoadingIndicator("Buscando tareas en bandeja de entrada...");
      container.appendChild(loadingDiv);
      
      try {
        // Obtener datos de tareas inbox a través de la API
        const { tareasPorNota, totalTareas, totalNotas } = await this.plugin.tareasAPI.getTareasInbox();
        
        // Eliminar el indicador de carga
        container.removeChild(loadingDiv);
        
        // Si no hay tareas en bandeja de entrada
        if (totalTareas === 0) {
          container.appendChild(
            DOMUtils.createElement('div', {
              className: 'empty-message',
              textContent: "¡Bandeja de entrada vacía! No se encontraron tareas con etiqueta #inbox."
            })
          );
          return container;
        }
        
        // Actualizar el encabezado con el contador
        heading.appendChild(
          DOMUtils.createElement('span', {
            className: 'stats-badge',
            textContent: `${totalTareas} tareas en ${totalNotas} notas`
          })
        );
        
        // Crear contenedor de estadísticas
        const statsContainer = this.crearContenedorEstadisticas(totalTareas, totalNotas);
        container.appendChild(statsContainer);
        
        // Ordenar notas por cantidad de tareas (descendente)
        const notasOrdenadas = Array.from(tareasPorNota.values())
          .sort((a, b) => b.tareas.length - a.tareas.length);
        
        // Crear grupos de tareas por nota
        for (const notaInfo of notasOrdenadas) {
          const grupoTareas = this.crearGrupoTareas(notaInfo, dv);
          container.appendChild(grupoTareas);
        }
        
        // Expandir el primer grupo automáticamente
        if (notasOrdenadas.length > 0) {
          const primerGrupo = container.querySelector('.tarea-group');
          if (primerGrupo) {
            const toggle = primerGrupo.querySelector('.tarea-group-toggle');
            const list = primerGrupo.querySelector('.tarea-list');
            
            if (toggle && list) {
              toggle.classList.add('open');
              (toggle as HTMLElement).textContent = "▼";
              (list as HTMLElement).classList.add('open');
              (list as HTMLElement).style.display = 'block';
            }
          }
        }
        
      } catch (error) {
        // Eliminar el indicador de carga
        container.removeChild(loadingDiv);
        
        // Mostrar mensaje de error
        container.appendChild(
          DOMUtils.createErrorMessage(
            `Error al cargar tareas de bandeja de entrada: ${error.message}`,
            "Revisa la consola para más detalles."
          )
        );
        
        console.error("Error en mostrarTareasInbox:", error);
      }
      
      return container;
    } catch (error) {
      console.error("Error general en mostrarTareasInbox:", error);
      
      // Devolver un mensaje de error
      return DOMUtils.createErrorMessage(
        `Error al cargar tareas de bandeja de entrada: ${error.message}`,
        "Revisa la consola para más detalles."
      );
    }
  }
  
  /**
   * Crea los controles para la gestión de tareas inbox
   */
  private crearControles(container: HTMLElement): HTMLElement {
    const controlsDiv = DOMUtils.createElement('div', {
      className: 'tareas-controls'
    });
    
    // Botón para expandir todo
    const expandBtn = DOMUtils.createButton("Expandir Todo", 
      () => this.expandirTodas(container),
      { className: 'tareas-btn expand-btn', icon: '📂' }
    );
    
    // Botón para colapsar todo
    const collapseBtn = DOMUtils.createButton("Colapsar Todo", 
      () => this.colapsarTodas(container),
      { className: 'tareas-btn collapse-btn', icon: '📁' }
    );
    
    // Botón para refrescar
    const refreshBtn = DOMUtils.createButton("Actualizar",
      async () => {
        const nuevoContainer = await this.generar(dv);
        container.parentNode?.replaceChild(nuevoContainer, container);
      },
      { className: 'tareas-btn refresh-btn', icon: '🔄' }
    );
    
    // Botón para procesar inbox
    const procesarBtn = DOMUtils.createButton("Procesar Inbox", 
      () => {
        // Mostrar indicación para procesar las tareas
        new this.plugin.app.Notice("Para procesar una tarea, haz clic en ella para abrirla y clasificarla", 5000);
      },
      { 
        className: 'tareas-btn process-btn', 
        icon: '🔍',
        styles: {
          backgroundColor: 'var(--interactive-accent)',
          color: 'white'
        }
      }
    );
    
    controlsDiv.appendChild(expandBtn);
    controlsDiv.appendChild(collapseBtn);
    controlsDiv.appendChild(refreshBtn);
    controlsDiv.appendChild(procesarBtn);
    
    return controlsDiv;
  }
  
  /**
   * Crea un contenedor con tarjetas de estadísticas
   */
  private crearContenedorEstadisticas(totalTareas: number, totalNotas: number): HTMLElement {
    const statsContainer = DOMUtils.createElement('div', {
      className: 'inbox-stats-container',
      styles: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        margin: '10px 0 20px'
      }
    });
    
    // Agregar tarjetas de estadísticas
    this.crearTarjetaEstadistica(statsContainer, "📥", "Tareas totales", totalTareas);
    this.crearTarjetaEstadistica(statsContainer, "📝", "Notas con tareas", totalNotas);
    
    return statsContainer;
  }
  
  /**
   * Crea una tarjeta de estadística
   */
  private crearTarjetaEstadistica(
    container: HTMLElement, 
    icono: string, 
    titulo: string, 
    valor: number | string
  ): void {
    const tarjeta = DOMUtils.createElement('div', {
      className: 'stats-card',
      styles: {
        flex: '1',
        minWidth: '150px',
        backgroundColor: 'var(--background-secondary)',
        padding: '15px',
        borderRadius: '8px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }
    });
    
    const iconoEl = DOMUtils.createElement('div', {
      textContent: icono,
      styles: {
        fontSize: '24px',
        marginBottom: '5px'
      }
    });
    
    const tituloEl = DOMUtils.createElement('div', {
      textContent: titulo,
      styles: {
        fontSize: '12px',
        color: 'var(--text-muted)',
        marginBottom: '5px'
      }
    });
    
    const valorEl = DOMUtils.createElement('div', {
      textContent: valor.toString(),
      styles: {
        fontWeight: 'bold',
        fontSize: '18px'
      }
    });
    
    tarjeta.appendChild(iconoEl);
    tarjeta.appendChild(tituloEl);
    tarjeta.appendChild(valorEl);
    
    container.appendChild(tarjeta);
  }
  
  /**
   * Crea un grupo de tareas para una nota específica
   */
  private crearGrupoTareas(notaInfo: NotaConTareas, dv: any): HTMLElement {
    const { titulo, ruta, tareas } = notaInfo;
    
    // Contenedor para la lista de tareas (inicialmente oculto)
    const tareasList = DOMUtils.createElement('div', {
      className: 'tarea-list',
      styles: {
        display: 'none'
      }
    });
    
    // Añadir cada tarea
    for (const tarea of tareas) {
      const tareaElement = this.crearTareaElement(tarea, dv);
      tareasList.appendChild(tareaElement);
    }
    
    // Crear el título con enlace
    let titleElement;
    
    try {
      const enlaceNota = DOMUtils.createElement('a', {
        className: 'internal-link',
        textContent: titulo,
        attributes: {
          'data-href': ruta
        },
        events: {
          click: (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.plugin.app.workspace.openLinkText(ruta, "", true);
          }
        }
      });
      
      titleElement = DOMUtils.createElement('div', {
        className: 'tarea-group-title',
        children: [
          DOMUtils.createElement('span', {
            className: 'tarea-group-toggle',
            textContent: '▶'
          }),
          enlaceNota
        ]
      });
    } catch (e) {
      // Si falla la creación del enlace, mostrar solo texto
      titleElement = DOMUtils.createElement('div', {
        className: 'tarea-group-title',
        children: [
          DOMUtils.createElement('span', {
            className: 'tarea-group-toggle',
            textContent: '▶'
          }),
          DOMUtils.createElement('span', {
            textContent: titulo
          })
        ]
      });
    }
    
    // Crear el header con contador
    const headerDiv = DOMUtils.createElement('div', {
      className: 'tarea-group-header',
      children: [
        titleElement,
        DOMUtils.createElement('span', {
          className: 'tarea-group-count',
          textContent: tareas.length.toString()
        })
      ]
    });
    
    // Crear contenedor del grupo
    const grupoDiv = DOMUtils.createElement('div', {
      className: 'tarea-group',
      children: [headerDiv, tareasList]
    });
    
    // Agregar evento para mostrar/ocultar lista de tareas
    headerDiv.addEventListener('click', (event) => {
      // No colapsar si se hizo clic en un enlace
      if (event.target instanceof HTMLAnchorElement) return;
      
      const toggleSpan = titleElement.querySelector('.tarea-group-toggle') as HTMLElement;
      if (!toggleSpan) return;
      
      toggleSpan.classList.toggle('open');
      tareasList.classList.toggle('open');
      
      if (toggleSpan.classList.contains('open')) {
        toggleSpan.textContent = "▼";
        tareasList.style.display = "block";
      } else {
        toggleSpan.textContent = "▶";
        tareasList.style.display = "none";
      }
    });
    
    return grupoDiv;
  }
  
  /**
   * Crea un elemento DOM para una tarea de bandeja de entrada
   */
  private crearTareaElement(tarea: TareaInbox, dv: any): HTMLElement {
    // Elemento principal
    const tareaDiv = DOMUtils.createElement('div', {
      className: 'tarea-item',
      styles: {
        borderLeft: '4px solid #E67E22' // Color naranja para mostrar que está en inbox
      }
    });
    
    // Texto de la tarea
    const textoDiv = DOMUtils.createElement('div', {
      className: 'tarea-texto'
    });
    
    // Checkbox (visual, no funcional)
    const checkboxSpan = DOMUtils.createElement('span', {
      className: 'tarea-checkbox',
      textContent: '☐',
      attributes: {
        'data-path': tarea.rutaArchivo,
        'data-line': String(tarea.lineInfo?.numero || 0)
      },
      events: {
        click: () => {
          NavigationUtils.navegarATareaConResaltado(
            tarea.rutaArchivo,
            tarea.lineInfo?.numero || 0,
            tarea.textoOriginal || tarea.texto,
            true
          );
        }
      }
    });
    textoDiv.appendChild(checkboxSpan);
    
    // Contenido de la tarea
    const contenidoSpan = DOMUtils.createElement('span', {
      className: 'tarea-contenido',
      textContent: tarea.texto,
      attributes: {
        'data-path': tarea.rutaArchivo,
        'data-line': String(tarea.lineInfo?.numero || 0)
      },
      styles: {
        cursor: 'pointer'
      },
      events: {
        click: () => {
          NavigationUtils.navegarATareaConResaltado(
            tarea.rutaArchivo,
            tarea.lineInfo?.numero || 0,
            tarea.textoOriginal || tarea.texto,
            true
          );
        }
      }
    });
    textoDiv.appendChild(contenidoSpan);
    tareaDiv.appendChild(textoDiv);
    
    // Metadatos
    const metadatosDiv = DOMUtils.createElement('div', {
      className: 'tarea-metadatos'
    });
    
    // Añadir metadatos
    this.añadirMetadatosUbicacion(tarea, metadatosDiv);
    this.añadirMetadatosFechas(tarea, metadatosDiv);
    this.añadirMetadatosPersonas(tarea, metadatosDiv);
    this.añadirMetadatosContextos(tarea, metadatosDiv);
    this.añadirMetadatosEtiquetas(tarea, metadatosDiv);
    
    // Añadir botones de acción para clasificar la tarea
    this.añadirBotonesAccion(tarea, metadatosDiv);
    
    tareaDiv.appendChild(metadatosDiv);
    
    return tareaDiv;
  }
  
  /**
   * Añade metadatos de ubicación a una tarea
   */
  private añadirMetadatosUbicacion(tarea: TareaInbox, container: HTMLElement): void {
    const ubicacionDiv = DOMUtils.createElement('div', {
      className: 'tarea-meta-item'
    });
    
    const iconoUbicacion = DOMUtils.createElement('span', {
      className: 'metadato-icono',
      textContent: '📍'
    });
    ubicacionDiv.appendChild(iconoUbicacion);
    
    const valorUbicacion = DOMUtils.createElement('span', {
      className: 'ubicacion-valor',
      textContent: tarea.lineInfo?.numero 
        ? `Línea ${tarea.lineInfo.numero}` 
        : "Posición desconocida"
    });
    
    ubicacionDiv.appendChild(valorUbicacion);
    container.appendChild(ubicacionDiv);
  }
  
  /**
   * Añade metadatos de fechas a una tarea
   */
  private añadirMetadatosFechas(tarea: TareaInbox, container: HTMLElement): void {
    if (!tarea.fechaVencimiento && !tarea.fechaScheduled && !tarea.fechaStart) {
      return;
    }
    
    const fechasDiv = DOMUtils.createElement('div', {
      className: 'tarea-meta-item'
    });
    
    const iconoFecha = DOMUtils.createElement('span', {
      className: 'metadato-icono',
      textContent: '📅'
    });
    fechasDiv.appendChild(iconoFecha);
    
    const valorFechas = DOMUtils.createElement('span');
    
    let textofechas = [];
    if (tarea.fechaVencimiento) {
      textofechas.push(`Vence: ${tarea.fechaVencimiento}`);
    }
    if (tarea.fechaScheduled) {
      textofechas.push(`Programada: ${tarea.fechaScheduled}`);
    }
    if (tarea.fechaStart) {
      textofechas.push(`Inicia: ${tarea.fechaStart}`);
    }
    
    valorFechas.textContent = textofechas.join(' | ');
    fechasDiv.appendChild(valorFechas);
    
    container.appendChild(fechasDiv);
  }
  
  /**
   * Añade metadatos de personas asignadas a una tarea
   */
  private añadirMetadatosPersonas(tarea: TareaInbox, container: HTMLElement): void {
    if (!tarea.etiquetas.personas?.length) {
      return;
    }
    
    const personasDiv = DOMUtils.createElement('div', {
      className: 'tarea-meta-item'
    });
    
    const iconoPersonas = DOMUtils.createElement('span', {
      className: 'metadato-icono',
      textContent: '👤'
    });
    personasDiv.appendChild(iconoPersonas);
    
    const valorPersonas = DOMUtils.createElement('span', {
      textContent: tarea.etiquetas.personas.join(' | ')
    });
    personasDiv.appendChild(valorPersonas);
    
    container.appendChild(personasDiv);
  }
  
  /**
   * Añade metadatos de contextos a una tarea
   */
  private añadirMetadatosContextos(tarea: TareaInbox, container: HTMLElement): void {
    if (!tarea.etiquetas.contextos?.length) {
      return;
    }
    
    const contextosDiv = DOMUtils.createElement('div', {
      className: 'tarea-meta-item'
    });
    
    const iconoContextos = DOMUtils.createElement('span', {
      className: 'metadato-icono',
      textContent: '🗂️'
    });
    contextosDiv.appendChild(iconoContextos);
    
    const valorContextos = DOMUtils.createElement('span', {
      textContent: tarea.etiquetas.contextos.join(' | ')
    });
    contextosDiv.appendChild(valorContextos);
    
    container.appendChild(contextosDiv);
  }
  
  /**
   * Añade metadatos de etiquetas (excluyendo #inbox) a una tarea
   */
  private añadirMetadatosEtiquetas(tarea: TareaInbox, container: HTMLElement): void {
    // Otras etiquetas (excluyendo #inbox)
    const otrasEtiquetas = tarea.etiquetas.otras.filter(tag => tag.toLowerCase() !== '#inbox');
    if (!otrasEtiquetas.length) {
      return;
    }
    
    const etiquetasDiv = DOMUtils.createElement('div', {
      className: 'tarea-meta-item'
    });
    
    const iconoEtiquetas = DOMUtils.createElement('span', {
      className: 'metadato-icono',
      textContent: '🏷️'
    });
    etiquetasDiv.appendChild(iconoEtiquetas);
    
    const valorEtiquetas = DOMUtils.createElement('span', {
      textContent: otrasEtiquetas.join(' ')
    });
    etiquetasDiv.appendChild(valorEtiquetas);
    
    container.appendChild(etiquetasDiv);
  }
  
  /**
   * Añade botones de acción rápida para clasificar la tarea
   */
  private añadirBotonesAccion(tarea: TareaInbox, container: HTMLElement): void {
    const accionesDiv = DOMUtils.createElement('div', {
      className: 'tarea-acciones',
      styles: {
        marginTop: '8px',
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap'
      }
    });
    
    // Estilos comunes para botones
    const estilosBotones = {
      fontSize: '12px',
      padding: '3px 8px',
      borderRadius: '4px',
      border: '1px solid var(--background-modifier-border)',
      backgroundColor: 'var(--background-secondary)',
      cursor: 'pointer'
    };
    
    // Botón para editar/abrir la tarea
    const btnEditar = DOMUtils.createElement('button', {
      className: 'tarea-accion-btn',
      textContent: '✏️ Editar',
      styles: estilosBotones,
      events: {
        click: () => {
          NavigationUtils.navegarATareaConResaltado(
            tarea.rutaArchivo,
            tarea.lineInfo?.numero || 0,
            tarea.textoOriginal || tarea.texto,
            true
          );
        }
      }
    });
    accionesDiv.appendChild(btnEditar);
    
    // Añadir botones de acción rápida para clasificar por contextos comunes
    const contextosComunes = ["#cx/trabajo", "#cx/personal", "#cx/hogar"];
    
    for (const contexto of contextosComunes) {
      const btnContexto = DOMUtils.createElement('button', {
        className: 'tarea-accion-btn contexto-btn',
        textContent: contexto,
        styles: estilosBotones,
        events: {
          click: () => {
            // De momento, simplemente abrir la tarea - una implementación más completa podría añadir
            // el contexto directamente a la tarea, pero requeriría más integración con el plugin
            NavigationUtils.navegarATareaConResaltado(
              tarea.rutaArchivo,
              tarea.lineInfo?.numero || 0,
              tarea.textoOriginal || tarea.texto,
              true
            );
            
            new this.plugin.app.Notice(
              `Para añadir "${contexto}" a esta tarea, edítala en el archivo abierto.`, 
              5000
            );
          }
        }
      });
      
      accionesDiv.appendChild(btnContexto);
    }
    
    container.appendChild(accionesDiv);
  }
  
  /**
   * Expande todos los grupos de tareas en el contenedor
   */
  private expandirTodas(container: HTMLElement): void {
    // Obtener todos los toggles de grupos de tareas
    const toggles = container.querySelectorAll('.tarea-group-toggle');
    const listas = container.querySelectorAll('.tarea-list');
    
    // Expandir cada uno
    toggles.forEach((toggle, index) => {
      toggle.classList.add('open');
      (toggle as HTMLElement).textContent = "▼";
      
      // Asegurarse de que la lista correspondiente esté visible
      if (listas[index]) {
        listas[index].classList.add('open');
        (listas[index] as HTMLElement).style.display = "block"; // Asegurar visibilidad directamente
      }
    });
  }
  
  /**
   * Colapsa todos los grupos de tareas en el contenedor
   */
  private colapsarTodas(container: HTMLElement): void {
    // Obtener todos los toggles de grupos de tareas
    const toggles = container.querySelectorAll('.tarea-group-toggle');
    const listas = container.querySelectorAll('.tarea-list');
    
    // Colapsar cada uno
    toggles.forEach((toggle, index) => {
      toggle.classList.remove('open');
      (toggle as HTMLElement).textContent = "▶";
      
      // Asegurarse de que la lista correspondiente esté oculta
      if (listas[index]) {
        listas[index].classList.remove('open');
        (listas[index] as HTMLElement).style.display = "none"; // Ocultar directamente
      }
    });
  }
  
  /**
   * Añade estilos inline al contenedor (solución temporal)
   * En una refactorización completa, estos estilos deberían moverse a un archivo CSS
   */
  private añadirEstilos(container: HTMLElement): void {
    const styleEl = DOMUtils.createElement('style', {
      textContent: `
      .tareas-inbox-container {
          font-size: 0.95em;
          width: 100%;
          max-width: 100%;
          margin: 0;
          padding: 0;
      }
      
      .inbox-heading {
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          border-bottom: 1px solid var(--background-modifier-border);
          padding-bottom: 6px;
          font-weight: 600;
          font-size: 1.3em;
          display: flex;
          align-items: center;
          justify-content: space-between;
      }
      
      .stats-badge {
          background-color: var(--interactive-accent);
          color: white;
          border-radius: 12px;
          padding: 2px 10px;
          font-size: 0.8em;
          font-weight: normal;
      }
      
      .tareas-controls {
          display: flex;
          gap: 10px;
          margin-bottom: 1rem;
          justify-content: center;
      }
      
      .tareas-btn {
          background-color: var(--background-secondary-alt);
          border: 1px solid var(--background-modifier-border);
          border-radius: 6px;
          padding: 6px 12px;
          cursor: pointer;
          transition: all 0.2s ease;
      }
      
      .tareas-btn:hover {
          background-color: var(--background-modifier-hover);
      }
      
      .expand-btn:hover {
          background-color: var(--interactive-accent);
          color: white;
      }
      
      .tarea-group {
          background-color: var(--background-secondary);
          border-radius: 8px;
          margin-bottom: 1rem;
          overflow: hidden;
      }
      
      .tarea-group-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background-color: var(--background-secondary-alt);
          cursor: pointer;
          user-select: none;
      }
      
      .tarea-group-header:hover {
          background-color: var(--background-modifier-hover);
      }
      
      .tarea-group-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
      }
      
      .tarea-group-toggle {
          font-family: monospace;
          transition: transform 0.2s ease;
      }
      
      .tarea-group-toggle.open {
          transform: rotate(90deg);
      }
      
      .tarea-group-count {
          background-color: var(--interactive-accent);
          color: white;
          border-radius: 12px;
          padding: 1px 8px;
          font-size: 0.85em;
      }
      
      .tarea-list {
          padding: 0 12px 12px;
      }
      
      .tarea-item {
          margin: 8px 0;
          padding: 8px;
          border-radius: 6px;
          background-color: var(--background-primary);
          border: 1px solid var(--background-modifier-border);
          transition: all 0.2s ease;
      }
      
      .tarea-item:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
          border-color: var(--interactive-accent);
      }
      
      .tarea-texto {
          margin-bottom: 6px;
          display: flex;
          gap: 8px;
          align-items: flex-start;
      }
      
      .tarea-checkbox {
          color: var(--text-faint);
          font-size: 1.1em;
          flex-shrink: 0;
          cursor: pointer;
      }
      
      .tarea-contenido {
          flex-grow: 1;
          line-height: 1.4;
      }
      
      .tarea-metadatos {
          margin-left: 28px;
          font-size: 0.9em;
          color: var(--text-muted);
      }
      
      .tarea-meta-item {
          margin-bottom: 3px;
          display: flex;
          align-items: baseline;
      }
      
      .metadato-icono {
          margin-right: 6px;
          width: 16px;
          text-align: center;
      }
      
      .loading-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          color: var(--text-muted);
      }
      
      .spinner {
          border: 3px solid rgba(0, 0, 0, 0.1);
          border-radius: 50%;
          border-top: 3px solid var(--interactive-accent);
          width: 30px;
          height: 30px;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
      }
      
      @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
      }
      
      .error-message {
          color: var(--text-error);
          background-color: rgba(var(--text-error-rgb), 0.1);
          padding: 10px;
          border-radius: 6px;
          text-align: center;
          margin: 10px 0;
      }
      
      .empty-message {
          color: var(--text-muted);
          text-align: center;
          padding: 2rem;
          font-style: italic;
      }
      `
    });
    
    container.appendChild(styleEl);
  }
}