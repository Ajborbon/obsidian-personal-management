// src/modules/noteLifecycleManager/API/utils/DOMUtils.ts

/**
 * Utilidades para crear y manipular elementos DOM de manera reutilizable
 */
export class DOMUtils {
    /**
     * Crea un elemento con atributos, clases y eventos opcionales
     */
    static createElement<K extends keyof HTMLElementTagNameMap>(
      tag: K,
      options: {
        className?: string;
        textContent?: string;
        attributes?: Record<string, string>;
        styles?: Partial<CSSStyleDeclaration>;
        children?: HTMLElement[];
        events?: Record<string, EventListener>;
      } = {}
    ): HTMLElementTagNameMap[K] {
      const element = document.createElement(tag);
      
      if (options.className) {
        element.className = options.className;
      }
      
      if (options.textContent) {
        element.textContent = options.textContent;
      }
      
      if (options.attributes) {
        Object.entries(options.attributes).forEach(([key, value]) => {
          element.setAttribute(key, value);
        });
      }
      
      if (options.styles) {
        Object.assign(element.style, options.styles);
      }
      
      if (options.children) {
        options.children.forEach(child => element.appendChild(child));
      }
      
      if (options.events) {
        Object.entries(options.events).forEach(([event, listener]) => {
          element.addEventListener(event, listener);
        });
      }
      
      return element;
    }
    
    /**
     * Crea un botón con opciones comunes
     */
    static createButton(
      text: string, 
      onClick: EventListener, 
      options: {
        className?: string;
        icon?: string;
        styles?: Partial<CSSStyleDeclaration>;
      } = {}
    ): HTMLButtonElement {
      const buttonText = options.icon 
        ? `${options.icon} ${text}`
        : text;
        
      return this.createElement('button', {
        className: options.className || 'default-button',
        textContent: buttonText,
        styles: options.styles,
        events: { click: onClick }
      });
    }
    
    /**
     * Crea una sección colapsable
     */
    static createCollapsibleSection(
      headerContent: string | HTMLElement,
      bodyContent: HTMLElement,
      options: {
        isExpanded?: boolean;
        headerClassName?: string;
        bodyClassName?: string;
        containerClassName?: string;
        toggleIconExpanded?: string;
        toggleIconCollapsed?: string;
      } = {}
    ): HTMLElement {
      const isExpanded = options.isExpanded || false;
      const toggleIconExpanded = options.toggleIconExpanded || "▼";
      const toggleIconCollapsed = options.toggleIconCollapsed || "▶";
      
      // Crear el toggle
      const toggleSpan = this.createElement('span', {
        className: `toggle-icon ${isExpanded ? 'open' : ''}`,
        textContent: isExpanded ? toggleIconExpanded : toggleIconCollapsed
      });
      
      // Crear el header
      const header = this.createElement('div', {
        className: options.headerClassName || 'collapsible-header'
      });
      
      if (typeof headerContent === 'string') {
        const headerTextSpan = this.createElement('span', {
          textContent: headerContent
        });
        header.appendChild(toggleSpan);
        header.appendChild(headerTextSpan);
      } else {
        header.appendChild(toggleSpan);
        header.appendChild(headerContent);
      }
      
      // Crear el contenedor del body
      const body = this.createElement('div', {
        className: options.bodyClassName || 'collapsible-body',
        styles: {
          display: isExpanded ? 'block' : 'none'
        },
        children: [bodyContent]
      });
      
      // Crear el contenedor principal
      const container = this.createElement('div', {
        className: options.containerClassName || 'collapsible-container',
        children: [header, body]
      });
      
      // Añadir funcionalidad de toggle
      header.addEventListener('click', (event) => {
        // No colapsar si se hizo clic en un enlace u otro elemento interactivo
        if (event.target instanceof HTMLAnchorElement || 
            event.target instanceof HTMLButtonElement) {
          return;
        }
        
        const isCurrentlyExpanded = toggleSpan.classList.contains('open');
        
        if (isCurrentlyExpanded) {
          toggleSpan.classList.remove('open');
          toggleSpan.textContent = toggleIconCollapsed;
          body.style.display = 'none';
        } else {
          toggleSpan.classList.add('open');
          toggleSpan.textContent = toggleIconExpanded;
          body.style.display = 'block';
        }
      });
      
      return container;
    }
    
    /**
     * Crea un elemento de carga (spinner)
     */
    static createLoadingIndicator(message: string = "Cargando..."): HTMLElement {
      const spinner = this.createElement('div', {
        className: 'spinner'
      });
      
      const loadingText = this.createElement('div', {
        textContent: message
      });
      
      return this.createElement('div', {
        className: 'loading-indicator',
        children: [spinner, loadingText]
      });
    }
    
    /**
     * Crea un mensaje de error
     */
    static createErrorMessage(message: string, details?: string): HTMLElement {
      const container = this.createElement('div', {
        className: 'error-message',
        textContent: message
      });
      
      if (details) {
        const detailsElement = this.createElement('small', {
          textContent: details,
          styles: {
            display: 'block',
            marginTop: '8px'
          }
        });
        container.appendChild(detailsElement);
      }
      
      return container;
    }
  }