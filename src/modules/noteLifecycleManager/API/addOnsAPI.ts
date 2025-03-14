/*
 * Filename: /src/modules/noteLifecycleManager/API/addOnsAPI.ts
 * Path: /src/modules/noteLifecycleManager/API
 * Created Date: 2024-03-19 09:32:03
 * Author: Andrés Julián Borbón
 * -----
 * Last Modified: 2025-02-23 17:48:35
 * Modified By: Andrés Julián Borbón
 * -----
 * Copyright (c) 2025 - Andrés Julián Borbón
 */


export class addOnsAPI {
    constructor(plugin) {
      this.plugin = plugin;
    }
  
    crearPrevNext(paginas, pagIndice, dv) {
        let pagina = dv.current();
        let indice;
        for (let a = 0; a < paginas.length; a++) {
            if (paginas[a].file.name == pagina.file.name) {
                indice = a;
            }
        }
    
        let links = [];
        if (indice == 0 && paginas.length == 1) {
            links[0] = "";
            links[1] = "";
        } else if (indice == 0) {
            links[0] = "";
            links[1] = "➡️ " + dv.func.link(paginas[indice + 1].file.path, this.determinarTextoEnlace(paginas[indice + 1]));
        } else if (indice == (paginas.length - 1)) {
            links[0] = dv.func.link(paginas[indice - 1].file.path, this.determinarTextoEnlace(paginas[indice - 1])) + " ⬅️";
            links[1] = "";
        } else {
            links[0] = dv.func.link(paginas[indice - 1].file.path, this.determinarTextoEnlace(paginas[indice - 1])) + " ⬅️";
            links[1] = "➡️ " + dv.func.link(paginas[indice + 1].file.path, this.determinarTextoEnlace(paginas[indice + 1]));
        }
    
        dv.paragraph(links[0] + " ==" + dv.func.link(pagIndice.file.path, pagIndice.titulo || pagIndice.file.name) + "== " + links[1]);
    }

    determinarTextoEnlace(pagina) {
        if (pagina.titulo) {
            return pagina.titulo;
        } else if (pagina.aliases && pagina.aliases.length > 0) {
            return pagina.aliases[0];
        } else {
            return pagina.file.name;
        }
    }
  


/**
 * Genera texto de relaciones con enlaces funcionales y formateado con CSS
 * @param pagina La página actual obtenida a través de dv.current()
 * @param dv El objeto dataview para acceder a sus funciones
 * @returns Objeto HTML para ser usado con dv.paragraph()
 */
generarTextoRelaciones(pagina, dv) {
    // Primero generamos el texto con enlaces funcionales
    let texto = `${pagina.typeName || "Entregable"} relacionado a `;
    const relaciones = [];
    
    // Asunto
    if (pagina.asunto && Array.isArray(pagina.asunto)) {
        const asuntoLinks = [];
        for (const entryObj of pagina.asunto) {
            const path = entryObj.path || entryObj;
            if (typeof path === 'string' && path.length > 0) {
                try {
                    const asuntoPage = dv.page(path);
                    if (asuntoPage && asuntoPage.file) {
                        const alias = asuntoPage.file.aliases?.[0] || asuntoPage.titulo || asuntoPage.file.name;
                        asuntoLinks.push(dv.fileLink(asuntoPage.file.path, false, alias));
                    } else {
                        asuntoLinks.push("asunto no encontrado");
                    }
                } catch (e) {
                    asuntoLinks.push("asunto no encontrado");
                }
            }
        }
        
        if (asuntoLinks.length > 0) {
            relaciones.push(`asunto: ${asuntoLinks.join(", ")}`);
        } else {
            relaciones.push("asunto: asunto no encontrado");
        }
    }

    // Proyectos GTD
    if (pagina.proyectoGTD && (Array.isArray(pagina.proyectoGTD) || typeof pagina.proyectoGTD === 'string')) {
        const proyectoLinks = [];
        const proyectoArray = Array.isArray(pagina.proyectoGTD) 
            ? pagina.proyectoGTD 
            : [pagina.proyectoGTD];
        
        for (const entryObj of proyectoArray) {
            const path = entryObj.path || entryObj;
            if (typeof path === 'string' && path.length > 0) {
                try {
                    const proyectoPage = dv.page(path);
                    if (proyectoPage && proyectoPage.file) {
                        const alias = proyectoPage.file.aliases?.[0] || proyectoPage.titulo || proyectoPage.file.name;
                        proyectoLinks.push(dv.fileLink(proyectoPage.file.path, false, alias));
                    }
                } catch (e) {
                    // Si la página no se encuentra, podemos extraer el título del path o la entrada original
                    if (typeof entryObj === 'string' && entryObj.includes('|')) {
                        const partes = entryObj.split('|');
                        proyectoLinks.push(partes[partes.length - 1].replace(']]', ''));
                    } else {
                        // Intentamos encontrar el nombre desde el path
                        const pathParts = path.split('/');
                        const fileName = pathParts[pathParts.length - 1].replace('.md', '');
                        proyectoLinks.push(fileName);
                    }
                }
            }
        }
        
        if (proyectoLinks.length > 0) {
            relaciones.push(`PGTD: ${proyectoLinks.join(", ")}`);
        }
    }

    // Áreas de interés
    if (pagina.areaInteres && (Array.isArray(pagina.areaInteres) || typeof pagina.areaInteres === 'string')) {
        const areaLinks = [];
        const areaArray = Array.isArray(pagina.areaInteres) 
            ? pagina.areaInteres 
            : [pagina.areaInteres];
        
        for (const entryObj of areaArray) {
            const path = entryObj.path || entryObj;
            if (typeof path === 'string' && path.length > 0) {
                try {
                    const areaPage = dv.page(path);
                    if (areaPage && areaPage.file) {
                        const alias = areaPage.file.aliases?.[0] || areaPage.titulo || areaPage.file.name;
                        areaLinks.push(dv.fileLink(areaPage.file.path, false, alias));
                    }
                } catch (e) {
                    // Si la página no se encuentra, podemos extraer el título del path o la entrada original
                    if (typeof entryObj === 'string' && entryObj.includes('|')) {
                        const partes = entryObj.split('|');
                        areaLinks.push(partes[partes.length - 1].replace(']]', ''));
                    } else {
                        // Intentamos encontrar el nombre desde el path
                        const pathParts = path.split('/');
                        const fileName = pathParts[pathParts.length - 1].replace('.md', '');
                        areaLinks.push(fileName);
                    }
                }
            }
        }
        
        if (areaLinks.length > 0) {
            relaciones.push(`AI: ${areaLinks.join(", ")}`);
        }
    }

    // Área de vida
    if (pagina.areaVida) {
        let areaVidaText = pagina.areaVida;
        
        // Si el área de vida es una referencia, procesar de manera similar
        if (typeof pagina.areaVida === 'string' && pagina.areaVida.includes('[[')) {
            // Es una referencia wiki, obtener el nombre amigable
            const match = pagina.areaVida.match(/\[\[(.*?)\|(.*?)\]\]/);
            if (match && match.length >= 3) {
                areaVidaText = match[2];
            } else {
                areaVidaText = pagina.areaVida.replace(/\[\[|\]\]/g, '');
            }
        }
        
        relaciones.push(`AV: ${areaVidaText}`);
    }

    // Unir todas las relaciones
    texto += relaciones.join(", ");
    
    // Añadir el estado al final
    if (pagina.estado) {
        texto += ` en estado ${pagina.estado}`;
    }
    
    // Envolver el contenido en un span con clase para estilos CSS
    // Creamos un elemento HTML utilizando las funciones de Dataview
    return dv.el("span", texto, { cls: "nota-relaciones" });
}


/**
 * Genera un árbol de referencias a la nota actual de forma recursiva con elementos toggle
 * @param paginaActual La página actual
 * @param dv Objeto dataview para acceder a sus funciones
 * @param profundidadMaxima Profundidad máxima de recursión (defecto: 3)
 * @param visitadas Set de IDs de páginas ya visitadas para evitar ciclos
 * @param profundidadActual Profundidad actual de recursión
 * @returns Elemento HTML con la estructura de árbol
 */

generarArbolReferencias(paginaActual, dv, profundidadMaxima = 3, visitadas = new Set(), profundidadActual = 0) {
    // Validar que paginaActual tenga las propiedades necesarias
    if (!paginaActual || !paginaActual.file) {
        console.error("Error: paginaActual no tiene las propiedades necesarias", paginaActual);
        return dv.el("div", "Error: No se puede generar el árbol de referencias.", { cls: "backlinks-tree-error" });
    }
    
    // Crear el contenedor principal
    const contenedor = document.createElement("div");
    contenedor.className = "backlinks-tree";
    
    if (profundidadActual === 0) {
        // Añadir título personalizado solo en la raíz
        const tipoNota = paginaActual.typeName || "Nota";
        const alias = paginaActual.file.aliases && paginaActual.file.aliases.length > 0 
            ? paginaActual.file.aliases[0] 
            : (paginaActual.titulo || paginaActual.file.name);
            
        const titulo = document.createElement("h3");
        titulo.className = "backlinks-tree-title";
        titulo.textContent = `Referencias a ${tipoNota} "${alias}"`;
        contenedor.appendChild(titulo);
    }
    
    // Si hemos llegado a la profundidad máxima, no seguimos explorando
    if (profundidadActual >= profundidadMaxima) {
        return contenedor;
    }
    
    // Marcar esta página como visitada para evitar ciclos
    visitadas.add(paginaActual.file.path);
    
    // Obtener todas las páginas que hacen referencia directa a la página actual
    let todasLasPaginas;
    try {
        todasLasPaginas = dv.pages();
    } catch (e) {
        console.error("Error al obtener páginas:", e);
        const errorMsg = document.createElement("p");
        errorMsg.className = "backlinks-tree-error";
        errorMsg.textContent = "Error al obtener páginas de Dataview";
        contenedor.appendChild(errorMsg);
        return contenedor;
    }
    
    // Filtrar las páginas que referencian a la actual a través de 'asunto'
    let referenciasDirectas = [];
    try {
        referenciasDirectas = todasLasPaginas.filter(p => {
            if (!p.asunto) return false;
            
            // Normalizar asunto a array
            const asuntos = Array.isArray(p.asunto) ? p.asunto : [p.asunto];
            
            for (const asunto of asuntos) {
                // Si asunto es un objeto con path y coincide con la página actual
                if (asunto && typeof asunto === 'object' && asunto.path === paginaActual.file.path) {
                    return true;
                }
                
                // Si asunto es una cadena con el formato [[ruta|alias]]
                if (typeof asunto === 'string' && asunto.includes(paginaActual.file.path)) {
                    return true;
                }
                
                // Si asunto es una cadena y coincide con el alias o nombre de la página actual
                if (typeof asunto === 'string') {
                    // Verificar coincidencia con aliases
                    const aliases = paginaActual.file.aliases || [];
                    for (const alias of aliases) {
                        if (asunto.includes(alias)) {
                            return true;
                        }
                    }
                    
                    // Verificar coincidencia con el nombre del archivo
                    if (asunto.includes(paginaActual.file.name)) {
                        return true;
                    }
                }
            }
            
            return false;
        });
    } catch (e) {
        console.error("Error al filtrar referencias:", e);
        const errorMsg = document.createElement("p");
        errorMsg.className = "backlinks-tree-error";
        errorMsg.textContent = "Error al procesar referencias";
        contenedor.appendChild(errorMsg);
        return contenedor;
    }
    
    // Si no hay referencias, mostrar mensaje
    if (referenciasDirectas.length === 0) {
        if (profundidadActual === 0) {
            const mensaje = document.createElement("p");
            mensaje.className = "backlinks-tree-empty";
            mensaje.textContent = "No se encontraron referencias a esta nota";
            contenedor.appendChild(mensaje);
        }
        return contenedor;
    }
    
    // NUEVO: Ordenar las referencias según los criterios especificados
    referenciasDirectas = this.ordenarReferencias(referenciasDirectas);
    
    // Crear lista para mostrar referencias
    const lista = document.createElement("ul");
    lista.className = `backlinks-tree-level-${profundidadActual}`;
    
    // Añadir cada referencia a la lista
    for (const referencia of referenciasDirectas) {
        try {
            // Evitar ciclos
            if (visitadas.has(referencia.file.path)) {
                continue;
            }
            
            // Crear elemento de lista
            const item = document.createElement("li");
            item.className = "backlinks-tree-item";
            
            // Crear contenedor para el elemento toggle y su contenido
            const itemContainer = document.createElement("div");
            itemContainer.className = "backlinks-tree-item-container";
            
            // Añadir tipo y enlace al contenedor principal
            const tipo = referencia.typeName || "Nota";
            const tipoEl = document.createElement("span");
            tipoEl.className = "backlinks-tree-type";
            tipoEl.textContent = `[${tipo}] `;
            itemContainer.appendChild(tipoEl);
            
            // Añadir el estado entre el tipo y el enlace
            const estado = referencia.estado || "";
            if (estado) {
                const estadoEl = document.createElement("span");
                estadoEl.className = "backlinks-tree-estado";
                estadoEl.textContent = `${estado} `;
                estadoEl.style.marginRight = "4px";
                itemContainer.appendChild(estadoEl);
            }
            
            // Determinar el texto para mostrar en el enlace
            let nombreMostrado = "";
            try {
                nombreMostrado = referencia.file.aliases && referencia.file.aliases.length > 0
                    ? referencia.file.aliases[0] 
                    : (referencia.titulo || referencia.file.name);
            } catch (e) {
                nombreMostrado = referencia.file.name || "Sin nombre";
            }
            
           // Manejo de enlaces para abrir en nueva pestaña
            const enlace = document.createElement("a");
            enlace.textContent = nombreMostrado;
            enlace.className = "internal-link";

            // En lugar de construir una URL obsidian://, usamos data-href para almacenar la ruta del archivo
            enlace.setAttribute("data-href", referencia.file.path);

            // Usamos la API de Obsidian para manejar el clic y la apertura del archivo en nueva pestaña
            enlace.addEventListener("click", (event) => {
                event.preventDefault();
                const path = event.target.getAttribute("data-href");
                if (path) {
                    // El tercer parámetro en 'true' le indica a Obsidian que abra en una nueva hoja
                    app.workspace.openLinkText(path, "", true);
                }
            });

            itemContainer.appendChild(enlace);
            
            // Intentar obtener recursivamente referencias a esta referencia
            try {
                // Nuevo conjunto de visitadas para no afectar otros niveles
                const nuevoVisitadas = new Set([...visitadas]);
                nuevoVisitadas.add(referencia.file.path);
                
                // Verificar si hay subreferencias antes de crear el toggle
                const subReferencias = this.generarArbolReferencias(
                    referencia, dv, profundidadMaxima, 
                    nuevoVisitadas, profundidadActual + 1
                );
                
                // Si hay contenido útil en las subreferencias
                if (subReferencias.children && subReferencias.children.length > 0) {
                    // Verificar si hay más que solo el título
                    const tieneContenidoUtil = subReferencias.children.length > 1 || 
                        (subReferencias.children.length === 1 && 
                         !subReferencias.children[0].classList.contains("backlinks-tree-title"));
                    
                    if (tieneContenidoUtil) {
                        // Crear el elemento toggle (botón que indica si hay subreferencias)
                        const toggleButton = document.createElement("span");
                        toggleButton.className = "backlinks-tree-toggle";
                        toggleButton.textContent = "►"; // Triángulo a la derecha (cerrado)
                        
                        // Insertar el toggle al inicio del itemContainer
                        itemContainer.insertBefore(toggleButton, itemContainer.firstChild);
                        
                        // Añadir contenedor para subreferencias que será toggleable
                        const subContainer = document.createElement("div");
                        subContainer.className = "backlinks-tree-subcontainer";
                        subContainer.style.display = "none"; // Oculto por defecto
                        subContainer.appendChild(subReferencias);
                        
                        // Añadir evento al toggle
                        toggleButton.addEventListener("click", () => {
                            if (subContainer.style.display === "none") {
                                subContainer.style.display = "block";
                                toggleButton.textContent = "▼"; // Triángulo hacia abajo (abierto)
                                toggleButton.classList.add("open");
                            } else {
                                subContainer.style.display = "none";
                                toggleButton.textContent = "►"; // Triángulo a la derecha (cerrado)
                                toggleButton.classList.remove("open");
                            }
                        });
                        
                        // Añadir el subcontainer después del itemContainer
                        item.appendChild(itemContainer);
                        item.appendChild(subContainer);
                    } else {
                        // Si no hay subreferencias útiles, solo añadir el itemContainer
                        item.appendChild(itemContainer);
                    }
                } else {
                    // Si no hay ninguna subreferencia, solo añadir el itemContainer
                    item.appendChild(itemContainer);
                }
            } catch (e) {
                console.error("Error en la recursión para " + referencia.file.path, e);
                const errorMsg = document.createElement("span");
                errorMsg.className = "backlinks-tree-error";
                errorMsg.textContent = " (Error al obtener subreferencias)";
                itemContainer.appendChild(errorMsg);
                item.appendChild(itemContainer);
            }
            
            // Añadir el item completo a la lista
            lista.appendChild(item);
            
        } catch (e) {
            console.error("Error al procesar referencia:", e);
            // Continuar con la siguiente referencia
            continue;
        }
    }
    
    // Añadir la lista al contenedor
    try {
        contenedor.appendChild(lista);
    } catch (e) {
        console.error("Error al añadir lista al contenedor:", e);
        const errorMsg = document.createElement("p");
        errorMsg.className = "backlinks-tree-error";
        errorMsg.textContent = "Error al generar estructura de árbol";
        contenedor.appendChild(errorMsg);
    }
    
    return contenedor;
}

/**
 * Ordena un array de referencias según tres criterios jerárquicos:
 * 1. Por tipo de nota (typeName)
 * 2. Por estado (sin estado → 🟢 → 🟡 → 🔴 → 🔵)
 * 3. Por fecha de creación (más reciente primero)
 * 
 * @param {Array} referencias - Array de referencias a ordenar
 * @returns {Array} - Array ordenado de referencias
 */
ordenarReferencias(referencias) {
    // Función para obtener el peso del estado para ordenamiento
    const pesoEstado = (estado) => {
        if (!estado) return 0; // Sin estado (primero)
        switch (estado) {
            case '🟢': return 1;
            case '🟡': return 2;
            case '🔴': return 3;
            case '🔵': return 4;
            default: return 5; // Cualquier otro estado
        }
    };
    
    // Ordenar referencias por los tres criterios
    return [...referencias].sort((a, b) => {
        // 1. Ordenar por typeName (tipo de nota)
        const tipoA = a.typeName || '';
        const tipoB = b.typeName || '';
        if (tipoA !== tipoB) {
            return tipoA.localeCompare(tipoB);
        }
        
        // 2. Ordenar por estado
        const estadoA = pesoEstado(a.estado);
        const estadoB = pesoEstado(b.estado);
        if (estadoA !== estadoB) {
            return estadoA - estadoB;
        }
        
        // 3. Ordenar por fecha de creación (más reciente primero)
        // Intentar obtener fecha de creación del file.ctime (timestamp de creación)
        let fechaA = a.file && a.file.ctime ? a.file.ctime : 0;
        let fechaB = b.file && b.file.ctime ? b.file.ctime : 0;
        
        // Si no hay ctime, intenta obtener la fecha del frontmatter
        if (!fechaA && a.fecha) {
            try {
                fechaA = new Date(a.fecha).getTime();
            } catch (e) {
                fechaA = 0;
            }
        }
        
        if (!fechaB && b.fecha) {
            try {
                fechaB = new Date(b.fecha).getTime();
            } catch (e) {
                fechaB = 0;
            }
        }
        
        // Ordenar descendente (más reciente primero)
        return fechaB - fechaA;
    });
}


/**
 * Muestra enlaces sincronizados en Notion desde el frontmatter 
 * que comienzan con el prefijo "link-"
 * @param dv El objeto dataview para acceder a sus funciones
 * @param pagina La página actual (normalmente dv.current())
 * @returns El contenedor con los resultados
 */
mostrarEnlacesSincronizados(dv, pagina) {
    // Crear contenedor para los resultados
    const contenedor = dv.el("div", "", { cls: "notion-links-container" });
    
    try {
        // Obtener el frontmatter
        const meta = pagina.file.frontmatter;
        if (!meta) {
            // Si no hay frontmatter, no mostramos nada para ahorrar espacio
            return contenedor;
        }
        
        // Obtener el valor de typeName si existe
        const typeName = meta.typeName || "Elemento";
        
        // Función para verificar si una URL es válida (más que solo https://)
        const isValidUrl = (url) => {
            return typeof url === 'string' && 
                   url.startsWith('http') && 
                   url.length > 8; // Más largo que solo "https://"
        };
        
        // Recopilamos todos los enlaces relevantes
        const enlaces = [];
        
        // 1. Enlaces que comienzan con "link-" (Notion)
        Object.entries(meta)
            .filter(([key, value]) => key.startsWith("link-") && isValidUrl(value))
            .forEach(([key, value]) => enlaces.push({
                label: "Notion",
                url: value
            }));
        
        // 2. Enlaces específicos según el tipo de elemento
        if (typeName === "Campaña" && isValidUrl(meta.indicadores)) {
            enlaces.push({
                label: "Indicadores de campaña",
                url: meta.indicadores
            });
        }
        
        if (typeName === "Entregable") {
            if (isValidUrl(meta.piezaNube)) {
                enlaces.push({
                    label: "Pieza en la nube",
                    url: meta.piezaNube
                });
            }
            
            if (isValidUrl(meta.urlCanva)) {
                enlaces.push({
                    label: "Diseño en Canva",
                    url: meta.urlCanva
                });
            }
        }
        
        // Si no hay enlaces, no mostramos nada
        if (enlaces.length === 0) {
            return contenedor;
        }
        
        // Mostrar cada enlace
        enlaces.forEach(enlace => {
            // Crear un párrafo para cada enlace
            const parrafo = document.createElement("p");
            parrafo.classList.add("notion-link-item");
            
            // Crear texto con la etiqueta específica
            parrafo.textContent = `${typeName} - ${enlace.label} en `;
            
            // Crear enlace
            const linkElement = document.createElement("a");
            linkElement.href = enlace.url;
            linkElement.textContent = enlace.url;
            linkElement.target = "_blank"; // Abrir en nueva pestaña
            linkElement.rel = "noopener noreferrer"; // Seguridad para enlaces externos
            
            // Añadir el enlace al párrafo
            parrafo.appendChild(linkElement);
            
            // Añadir el párrafo al contenedor
            contenedor.appendChild(parrafo);
        });
        
    } catch (error) {
        console.error("Error al procesar enlaces sincronizados:", error);
        // No mostramos mensaje de error para ahorrar espacio
    }
    
    return contenedor;
}
// -------

/**
 * Procesa y prepara las estadísticas de tiempo para un proyecto
 * @param proyectoPath Ruta completa del archivo del proyecto
 * @returns Objeto con todas las estadísticas y registros procesados
 */
async obtenerEstadisticasTiempo(proyectoPath) {
    try {
      // Obtener carpeta de registros de tiempo desde la configuración
      const folderRT = this.plugin.settings.folder_RegistroTiempo;
      
      // Función para formatear duración en milisegundos a formato legible
      const formatDuration = (ms) => {
        if (ms === null || ms === undefined || isNaN(ms)) {
          return "No definido";
        } else {
          // Convertir milisegundos a minutos, horas y días
          let minutos = Math.floor(ms / (1000 * 60));
          let horas = Math.floor(minutos / 60);
          minutos = minutos % 60;
          let dias = Math.floor(horas / 24);
          horas = horas % 24;
          
          // Formatear el string de salida
          if (dias > 0) {
            return `${dias} d ${horas} h ${minutos} min`;
          } else if (horas > 0) {
            return `${horas} h ${minutos} min`;
          } else {
            return `${minutos} min`;
          }
        }
      };
      
      // Función para calcular tiempo transcurrido desde una fecha
      const tiempoDesde = (fechaString) => {
        if (!fechaString) return "Desconocido";
        
        try {
          // Extraer fecha y hora de formatos comunes
          let fecha;
          if (fechaString.includes(' ')) {
            // Formato "YYYY-MM-DD día HH:mm"
            const partes = fechaString.split(' ');
            const fechaSolo = partes[0]; // YYYY-MM-DD
            const horaSolo = partes[partes.length - 1]; // HH:mm
            fecha = new Date(`${fechaSolo}T${horaSolo}`);
          } else {
            fecha = new Date(fechaString);
          }
          
          if (isNaN(fecha.getTime())) {
            return "Fecha inválida";
          }
          
          const ahora = new Date();
          const diferencia = ahora.getTime() - fecha.getTime();
          
          // Convertir a días/horas/minutos
          const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
          const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
          
          if (dias > 30) {
            return `hace ${Math.floor(dias / 30)} meses`;
          } else if (dias > 0) {
            return `hace ${dias} días`;
          } else if (horas > 0) {
            return `hace ${horas} horas`;
          } else {
            return `hace ${minutos} minutos`;
          }
        } catch (e) {
          console.error("Error al procesar fecha:", e);
          return "Error en fecha";
        }
      };
      
      // Obtener el proyecto y su alias/título
      const proyectoFile = app.vault.getAbstractFileByPath(proyectoPath);
      if (!proyectoFile) {
        return { error: "Proyecto no encontrado" };
      }
      
      const metadataProyecto = app.metadataCache.getFileCache(proyectoFile)?.frontmatter;
      const proyectoAlias = metadataProyecto?.aliases?.[0] || metadataProyecto?.titulo || proyectoFile.basename;
      
      // Fecha actual y límites para los períodos
      const ahora = new Date();
      const limite7Dias = new Date(ahora);
      limite7Dias.setDate(ahora.getDate() - 7);
      const limite30Dias = new Date(ahora);
      limite30Dias.setDate(ahora.getDate() - 30);
      
      // Buscar todos los registros de tiempo relacionados con este proyecto
      // Esto es lo más pesado y lo hacemos una sola vez en el plugin
      let registros = [];
      const allFiles = app.vault.getMarkdownFiles()
        .filter(file => file.path.startsWith(folderRT + "/"));
      
      // Procesar cada archivo de registro de tiempo
      for (const file of allFiles) {
        try {
          const metadata = app.metadataCache.getFileCache(file)?.frontmatter;
          if (!metadata) continue;
          
          // Verificar si este registro está relacionado con el proyecto actual
          let estaRelacionado = false;
          
          // Comprobar proyectoGTD
          if (metadata.proyectoGTD) {
            if (Array.isArray(metadata.proyectoGTD)) {
              // Para cada elemento del array proyectoGTD
              for (const proyecto of metadata.proyectoGTD) {
                // Eliminar corchetes de wiklinks
                const proyectoLimpio = proyecto.replace(/\[\[|\]\]/g, '');
                
                // Comprobar si contiene la ruta o el nombre del proyecto
                if (proyectoLimpio.includes(proyectoPath) || 
                    proyectoLimpio.includes(proyectoFile.basename) ||
                    (proyectoAlias && proyectoLimpio.includes(proyectoAlias))) {
                  estaRelacionado = true;
                  break;
                }
              }
            } else if (typeof metadata.proyectoGTD === 'string') {
              // Si es un string, hacer la misma comprobación
              const proyectoLimpio = metadata.proyectoGTD.replace(/\[\[|\]\]/g, '');
              if (proyectoLimpio.includes(proyectoPath) || 
                  proyectoLimpio.includes(proyectoFile.basename) ||
                  (proyectoAlias && proyectoLimpio.includes(proyectoAlias))) {
                estaRelacionado = true;
              }
            }
          }
          
          // Si está relacionado, añadirlo a los registros
          if (estaRelacionado) {
            // Obtener información de asunto si existe
            let asuntoAlias = null;
            if (metadata.asunto && metadata.asunto.length > 0) {
              try {
                // Intentar extraer el asunto (formato wiki)
                const asuntoStr = metadata.asunto[0];
                // Extraer la ruta del asunto de formato [[ruta|alias]]
                const asuntoMatch = asuntoStr.match(/\[\[(.*?)(?:\|(.*?))?\]\]/);
                if (asuntoMatch) {
                  const asuntoPath = asuntoMatch[1];
                  const asuntoFile = app.vault.getAbstractFileByPath(asuntoPath + ".md");
                  if (asuntoFile) {
                    const asuntoMetadata = app.metadataCache.getFileCache(asuntoFile)?.frontmatter;
                    asuntoAlias = asuntoMetadata?.aliases?.[0] || asuntoMetadata?.titulo || asuntoFile.basename;
                  }
                }
              } catch (e) {
                console.error("Error procesando asunto:", e);
              }
            }
            
            // Crear objeto de registro con toda la información necesaria
            const registro = {
              path: file.path,
              basename: file.basename,
              descripcion: metadata.descripcion || "Sin descripción",
              tiempoTrabajado: metadata.tiempoTrabajado || 0,
              estado: metadata.estado || "🔄",
              horaInicio: metadata.horaInicio || metadata.fecha || "Desconocido",
              horaFinal: metadata.horaFinal || "",
              asuntoAlias: asuntoAlias,
              aliases: metadata.aliases || [],
            };
            
            registros.push(registro);
          }
        } catch (error) {
          console.error(`Error procesando archivo ${file.path}:`, error);
        }
      }
      
      // Ordenar registros por horaFinal descendente
      registros.sort((a, b) => {
        // Primero intentamos ordenar por horaFinal
        if (a.horaFinal && b.horaFinal) {
          return new Date(b.horaFinal).getTime() - new Date(a.horaFinal).getTime();
        }
        // Si no hay horaFinal, ordenamos por horaInicio
        return new Date(b.horaInicio).getTime() - new Date(a.horaInicio).getTime();
      });
      
      // Calcular estadísticas
      let totalTiempoTrabajado = 0;
      let ultimaActividad = registros.length > 0 ? (registros[0].horaFinal || registros[0].horaInicio) : null;
      let tiempoUltimos7Dias = 0;
      let tiempoUltimos30Dias = 0;
      
      // Procesar cada registro para calcular estadísticas
      for (let registro of registros) {
        // Sumar tiempo total
        totalTiempoTrabajado += registro.tiempoTrabajado;
        
        // Verificar si está en los últimos períodos
        let fechaRegistro;
        if (registro.horaFinal) {
          // Extraer fecha de formato "YYYY-MM-DD día HH:mm"
          const partes = registro.horaFinal.split(' ');
          const fechaSolo = partes[0]; // YYYY-MM-DD
          fechaRegistro = new Date(fechaSolo);
        } else if (registro.horaInicio) {
          // Extraer fecha de otros formatos posibles
          const partesFecha = registro.horaInicio.split(' ');
          fechaRegistro = new Date(partesFecha[0]);
        }
        
        if (fechaRegistro) {
          if (fechaRegistro >= limite7Dias) {
            tiempoUltimos7Dias += registro.tiempoTrabajado;
          }
          if (fechaRegistro >= limite30Dias) {
            tiempoUltimos30Dias += registro.tiempoTrabajado;
          }
        }
        
        // Añadir propiedad formateada para mostrar en la tabla
        registro.tiempoFormateado = formatDuration(registro.tiempoTrabajado);
      }
      
      // Crear y retornar objeto con toda la información procesada
      return {
        proyecto: {
          path: proyectoPath,
          nombre: proyectoFile.basename,
          alias: proyectoAlias
        },
        estadisticas: {
          totalTiempoTrabajado: {
            valor: totalTiempoTrabajado,
            formateado: formatDuration(totalTiempoTrabajado)
          },
          numSesiones: registros.length,
          ultimaActividad: {
            fecha: ultimaActividad,
            tiempoDesde: ultimaActividad ? tiempoDesde(ultimaActividad) : "Sin actividad"
          },
          ultimos7Dias: {
            valor: tiempoUltimos7Dias,
            formateado: formatDuration(tiempoUltimos7Dias)
          },
          ultimos30Dias: {
            valor: tiempoUltimos30Dias,
            formateado: formatDuration(tiempoUltimos30Dias)
          }
        },
        registros: registros
      };
    } catch (error) {
      console.error("Error en obtenerEstadisticasTiempo:", error);
      return { error: "Error procesando estadísticas de tiempo: " + error.message };
    }
  }
  
  /**
   * Genera el HTML para mostrar las estadísticas de tiempo
   * @param dv Objeto dataview para crear elementos
   * @param datos Objeto con los datos obtenidos de obtenerEstadisticasTiempo
   * @returns Elemento HTML con las estadísticas visualizadas
   */

  mostrarEstadisticasTiempo(dv, datos) {
    try {
      // Si hay error, mostrar mensaje
      if (datos.error) {
        const errorDiv = document.createElement("div");
        errorDiv.className = "tiempo-stats-error";
        errorDiv.textContent = datos.error;
        return errorDiv;
      }
      
      // Obtener estadísticas y registros
      const { estadisticas, registros, proyecto } = datos;
      
      // Crear contenedor principal
      const contenedor = document.createElement("div");
      contenedor.className = "tiempo-stats-container";
      contenedor.style.padding = "16px 0"; // Mantener padding vertical, eliminar horizontal
      contenedor.style.width = "100%";
      contenedor.style.boxSizing = "border-box";
      
      // Si no hay registros, mostrar mensaje y salir
      if (!registros || registros.length === 0) {
        const mensajeVacio = document.createElement("p");
        mensajeVacio.className = "tiempo-stats-empty-message";
        mensajeVacio.textContent = "No se encontraron registros de tiempo para este proyecto.";
        contenedor.appendChild(mensajeVacio);
        return contenedor;
      }
      
      // === SECCIÓN 1: ESTADÍSTICAS PRINCIPALES ===
      const statsContainer = document.createElement("div");
      statsContainer.className = "tiempo-stats-summary";
      
      // Crear tarjetas de estadísticas
      const infoEstadisticas = [
        {
          titulo: "Tiempo Total",
          valor: estadisticas.totalTiempoTrabajado.formateado,
          icono: "⏱️"
        },
        {
          titulo: "Sesiones",
          valor: estadisticas.numSesiones,
          icono: "🔄"
        },
        {
          titulo: "Última Actividad",
          valor: estadisticas.ultimaActividad.tiempoDesde,
          icono: "🕒"
        },
        {
          titulo: "Últimos 7 días",
          valor: estadisticas.ultimos7Dias?.formateado || "N/A",
          icono: "📅"
        },
        {
          titulo: "Últimos 30 días",
          valor: estadisticas.ultimos30Dias?.formateado || "N/A",
          icono: "📆"
        }
      ];
      
      // Crear grid para las tarjetas
      const statsGrid = document.createElement("div");
      statsGrid.className = "tiempo-stats-grid";
      
      // Añadir cada tarjeta al grid
      for (const stat of infoEstadisticas) {
        const tarjeta = document.createElement("div");
        tarjeta.className = "tiempo-stat-card";
        
        const icono = document.createElement("span");
        icono.className = "tiempo-stat-icon";
        icono.textContent = stat.icono;
        
        const titulo = document.createElement("div");
        titulo.className = "tiempo-stat-title";
        titulo.textContent = stat.titulo;
        
        const valor = document.createElement("div");
        valor.className = "tiempo-stat-value";
        valor.textContent = stat.valor;
        
        tarjeta.appendChild(icono);
        tarjeta.appendChild(titulo);
        tarjeta.appendChild(valor);
        
        statsGrid.appendChild(tarjeta);
      }
      
      statsContainer.appendChild(statsGrid);
      contenedor.appendChild(statsContainer);
      
      // === SECCIÓN 2: SESIÓN ACTIVA (si existe) ===
      if (estadisticas.sesionActiva) {
        const activoContainer = document.createElement("div");
        activoContainer.className = "tiempo-sesion-activa-container";
        
        // Título de la sección
        const tituloActivo = document.createElement("h3");
        tituloActivo.className = "tiempo-activo-title";
        tituloActivo.textContent = "Sesión activa";
        activoContainer.appendChild(tituloActivo);
        
        // Encontrar el registro activo
        const registroActivo = registros.find(r => r.estado === "🟢");
        
        if (registroActivo) {
          // Crear tarjeta de sesión activa
          const tarjetaActiva = document.createElement("div");
          tarjetaActiva.className = "tiempo-activo-card";
          
          // Descripción
          const descActiva = document.createElement("div");
          descActiva.className = "tiempo-activo-descripcion";
          descActiva.textContent = registroActivo.descripcion;
          tarjetaActiva.appendChild(descActiva);
          
          // Tiempo en ejecución
          const tiempoEjecucion = document.createElement("div");
          tiempoEjecucion.className = "tiempo-ejecucion";
          tiempoEjecucion.id = `tiempo-ejecucion-${estadisticas.sesionActiva.id}`;
          tiempoEjecucion.textContent = estadisticas.sesionActiva.tiempoFormateado;
          tarjetaActiva.appendChild(tiempoEjecucion);
          
          // Botón para ir al registro
          const enlaceRegistro = document.createElement("a");
          enlaceRegistro.className = "tiempo-activo-enlace internal-link";
          enlaceRegistro.href = registroActivo.path;
          enlaceRegistro.setAttribute("data-href", registroActivo.path);
          enlaceRegistro.textContent = "Ver registro completo";
          
          // Hacer clicable el enlace
          enlaceRegistro.addEventListener("click", (event) => {
            event.preventDefault();
            const href = enlaceRegistro.getAttribute("data-href");
            if (href) {
              app.workspace.openLinkText(href, "", false);
            }
          });
          
          tarjetaActiva.appendChild(enlaceRegistro);
          activoContainer.appendChild(tarjetaActiva);
        }
        
        contenedor.appendChild(activoContainer);
      }
      
      // === SECCIÓN 3: TABLA DE REGISTROS ===
      // Título de la sección
      const tituloTabla = document.createElement("h3");
      tituloTabla.className = "tiempo-table-title";
      tituloTabla.textContent = "Registros de tiempo";
      contenedor.appendChild(tituloTabla);
      
      // Crear la tabla con estilos directos para evitar espacios no deseados
      const tabla = document.createElement("table");
      tabla.className = "tiempo-registros-table";
      tabla.style.width = "100%";
      tabla.style.tableLayout = "fixed";
      tabla.style.borderCollapse = "collapse";
      tabla.style.margin = "0";
      tabla.style.padding = "0";
      
      // Crear encabezados
      const encabezado = document.createElement("thead");
      const filaEncabezado = document.createElement("tr");
      
      // Definir encabezados y sus estilos
      const encabezados = [
        { texto: "Descripción", ancho: "60%", align: "left" },
        { texto: "Duración", ancho: "15%", align: "center" },
        { texto: "Fecha", ancho: "25%", align: "left" }
      ];
      
      for (const { texto, ancho, align } of encabezados) {
        const th = document.createElement("th");
        th.textContent = texto;
        th.style.width = ancho;
        th.style.textAlign = align;
        th.style.padding = "10px";
        if (texto === "Descripción") {
          th.style.paddingLeft = "0"; // Eliminar padding izquierdo del primer encabezado
        }
        filaEncabezado.appendChild(th);
      }
      
      encabezado.appendChild(filaEncabezado);
      tabla.appendChild(encabezado);
      
      // Crear cuerpo de la tabla
      const cuerpo = document.createElement("tbody");
      
      // Añadir filas con los datos
      for (const registro of registros) {
        const fila = document.createElement("tr");
        
        // Columna: Descripción con enlace a la nota
        const celdaDescripcion = document.createElement("td");
        celdaDescripcion.style.width = "60%";
        celdaDescripcion.style.paddingLeft = "0"; // Eliminar padding izquierdo
        celdaDescripcion.style.whiteSpace = "normal";
        celdaDescripcion.style.wordWrap = "break-word";
        celdaDescripcion.style.wordBreak = "break-word";
        celdaDescripcion.style.overflowWrap = "break-word";
        
        try {
          // Contenedor para la descripción que fuerce el salto de línea
          const descripcionDiv = document.createElement("div");
          descripcionDiv.style.display = "inline";
          descripcionDiv.style.whiteSpace = "normal";
          descripcionDiv.style.wordWrap = "break-word";
          descripcionDiv.style.wordBreak = "break-word";
          descripcionDiv.textContent = registro.descripcion || "Sin descripción";
          celdaDescripcion.appendChild(descripcionDiv);
          
          // Agregar enlace
          const enlaceSpan = document.createElement("span");
          enlaceSpan.className = "tiempo-ver-mas";
          enlaceSpan.appendChild(document.createTextNode(" ("));
          
          // Crear enlace
          const enlace = document.createElement("a");
          enlace.className = "internal-link";
          enlace.href = registro.path;
          enlace.setAttribute("data-href", registro.path);
          enlace.textContent = "ver";
          
          // Hacer clicable el enlace
          enlace.addEventListener("click", (event) => {
            event.preventDefault();
            const href = enlace.getAttribute("data-href");
            if (href) {
              app.workspace.openLinkText(href, "", false);
            }
          });
          
          enlaceSpan.appendChild(enlace);
          enlaceSpan.appendChild(document.createTextNode(")"));
          celdaDescripcion.appendChild(enlaceSpan);
        } catch (e) {
          celdaDescripcion.textContent = registro.descripcion || "Sin descripción";
        }
        
        fila.appendChild(celdaDescripcion);
        
        // Columna: Duración (centrada)
        const celdaDuracion = document.createElement("td");
        celdaDuracion.style.width = "15%";
        celdaDuracion.style.textAlign = "center";
        celdaDuracion.textContent = registro.tiempoFormateado;
        fila.appendChild(celdaDuracion);
        
        // Columna: Fecha
        const celdaFecha = document.createElement("td");
        celdaFecha.style.width = "25%";
        celdaFecha.style.whiteSpace = "normal";
        celdaFecha.style.wordWrap = "break-word";
        celdaFecha.textContent = registro.horaFinal || registro.horaInicio;
        fila.appendChild(celdaFecha);
        
        cuerpo.appendChild(fila);
      }
      
      tabla.appendChild(cuerpo);
      contenedor.appendChild(tabla);
      
      return contenedor;
    } catch (error) {
      console.error("Error al mostrar estadísticas de tiempo:", error);
      const errorDiv = document.createElement("div");
      errorDiv.className = "tiempo-stats-error";
      errorDiv.textContent = "Error al mostrar estadísticas: " + error.message;
      return errorDiv;
    }
  }

// ---- TAREAS

/**
 * Genera un árbol de tareas pendientes y en progreso de la nota actual y sus referencias
 * @param {Object} paginaActual - La página actual obtenida a través de dv.current()
 * @param {Object} dv - El objeto dataview para acceder a sus funciones
 * @param {Number} profundidadMaxima - Profundidad máxima de recursión (defecto: 3)
 * @param {Set} visitadas - Set de IDs de páginas ya visitadas para evitar ciclos
 * @param {Number} profundidadActual - Profundidad actual de recursión
 * @param {Boolean} esReferenciaNidada - Indica si es una referencia nidada (para evitar duplicación)
 * @returns {HTMLElement} - Elemento HTML con la estructura de árbol de tareas
 */
async generarArbolTareas(paginaActual, dv, profundidadMaxima = 3, visitadas = new Set(), profundidadActual = 0, esReferenciaNidada = false) {
    // Validar que paginaActual tenga las propiedades necesarias
    if (!paginaActual || !paginaActual.file) {
        console.error("Error: paginaActual no tiene las propiedades necesarias", paginaActual);
        return dv.el("div", "Error: No se puede generar el árbol de tareas.", { cls: "tasks-tree-error" });
    }
    
    console.log(`Procesando tareas de: ${paginaActual.file.path} (profundidad: ${profundidadActual}, esReferenciaNidada: ${esReferenciaNidada})`);
    
    // Crear el contenedor principal
    const contenedor = document.createElement("div");
    contenedor.className = "tasks-tree";
    
    if (profundidadActual === 0) {
        // Añadir título personalizado solo en la raíz
        const tipoNota = paginaActual.typeName || "Nota";
        const alias = paginaActual.file.aliases && paginaActual.file.aliases.length > 0 
            ? paginaActual.file.aliases[0] 
            : (paginaActual.titulo || paginaActual.file.name);
            
        const titulo = document.createElement("h3");
        titulo.className = "tasks-tree-title";
        titulo.textContent = "Tareas pendientes";
        contenedor.appendChild(titulo);
    }
    
    // Si hemos llegado a la profundidad máxima, no seguimos explorando
    if (profundidadActual >= profundidadMaxima) {
        return contenedor;
    }
    
    // Marcar esta página como visitada para evitar ciclos
    visitadas.add(paginaActual.file.path);
    
    // Extraer tareas de la página actual
    let tareas;
    try {
        tareas = await this.extraerTareasDePagina(paginaActual, dv);
        console.log(`Encontradas ${tareas.length} tareas en ${paginaActual.file.path}`);
    } catch (e) {
        console.error(`Error al extraer tareas de ${paginaActual.file.path}:`, e);
        tareas = [];
    }
    
    // Obtener todas las páginas que hacen referencia directa a la página actual
    let todasLasPaginas;
    try {
        todasLasPaginas = dv.pages();
    } catch (e) {
        console.error("Error al obtener páginas:", e);
        const errorMsg = document.createElement("p");
        errorMsg.textContent = "Error al obtener páginas de Dataview";
        errorMsg.className = "tasks-tree-error";
        contenedor.appendChild(errorMsg);
        
        // Aún así, mostramos las tareas de la página actual si las hay
        if (tareas.length > 0) {
            this.agregarTareasAContenedor(tareas, contenedor, dv, paginaActual);
        }
        
        return contenedor;
    }
    
    // Filtrar las páginas que referencian a la actual a través de 'asunto'
    let referenciasDirectas = [];
    try {
        // Función segura para verificar si un asunto hace referencia a la página actual
        const referenciaAPaginaActual = (asunto) => {
            try {
                // Si asunto es un objeto con path y coincide con la página actual
                if (asunto && typeof asunto === 'object' && asunto.path === paginaActual.file.path) {
                    return true;
                }
                
                // Si asunto es una cadena
                if (typeof asunto === 'string') {
                    // Verificar si contiene la ruta completa
                    if (asunto.includes(paginaActual.file.path)) {
                        return true;
                    }
                    
                    // Verificar coincidencia con aliases (si existen)
                    if (paginaActual.file.aliases && Array.isArray(paginaActual.file.aliases)) {
                        for (const alias of paginaActual.file.aliases) {
                            if (alias && asunto.includes(alias)) {
                                return true;
                            }
                        }
                    }
                    
                    // Verificar coincidencia con el nombre del archivo
                    if (paginaActual.file.name && asunto.includes(paginaActual.file.name)) {
                        return true;
                    }
                    
                    // Verificamos si el archivo tiene titulo o aliases
                    const titulo = paginaActual.titulo || paginaActual.title;
                    if (titulo && asunto.includes(titulo)) {
                        return true;
                    }
                }
                
                return false;
            } catch (err) {
                console.warn("Error al verificar referencia:", err);
                return false;
            }
        };
        
        // Filtrar las páginas con manejo de errores mejorado
        referenciasDirectas = todasLasPaginas.filter(p => {
            try {
                if (!p || !p.asunto) return false;
                
                // Normalizar asunto a array
                const asuntos = Array.isArray(p.asunto) ? p.asunto : [p.asunto];
                
                // Verificar cada asunto
                for (const asunto of asuntos) {
                    if (referenciaAPaginaActual(asunto)) {
                        return true;
                    }
                }
                
                return false;
            } catch (err) {
                console.warn("Error al filtrar página:", err, p);
                return false;
            }
        });
        
        console.log(`Encontradas ${referenciasDirectas.length} referencias directas a ${paginaActual.file.path}`);
    } catch (e) {
        console.error("Error al filtrar referencias:", e);
        const errorMsg = document.createElement("p");
        errorMsg.textContent = "Error al procesar referencias";
        errorMsg.className = "tasks-tree-error";
        contenedor.appendChild(errorMsg);

        // Aún así, mostramos las tareas de la página actual si las hay
        if (tareas.length > 0) {
            this.agregarTareasAContenedor(tareas, contenedor, dv, paginaActual);
        }
        
        return contenedor;
    }
    
    // Verificar si tenemos tareas en la página actual o en referencias
    const hayTareasEnActual = tareas.length > 0;
    
    // Primero verificamos si alguna referencia tiene tareas
    const referenciasConTareas = [];
    const referenciasConTareasHeredadas = []; // Nuevo array para referencias sin tareas propias pero con tareas heredadas
    
    // Procesar todas las referencias directas, incluso si no tienen tareas propias
    for (const referencia of referenciasDirectas) {
        // Evitar ciclos
        if (visitadas.has(referencia.file.path)) {
            continue;
        }
        
        try {
            // Extraer tareas propias de la referencia
            const tareasReferencia = await this.extraerTareasDePagina(referencia, dv);
            
            // CAMBIO AQUÍ: Comprobar si esta referencia tiene referencias anidadas con tareas
            // Aunque no tenga tareas propias, necesitamos explorar más profundo
            let tieneTareasHeredadas = false;
            let refAnidadasConTareas = [];
            
            // Crear copia del conjunto visitadas para evitar afectar a otras ramas
            const nuevoVisitadas = new Set([...visitadas]);
            nuevoVisitadas.add(referencia.file.path);
            
            // Buscar recursivamente en profundidad
            const resultadoAnidado = await this.generarArbolTareas(
                referencia, dv, profundidadMaxima, 
                nuevoVisitadas, profundidadActual + 1,
                true // Es una referencia nidada
            );
            
            // Verificar si el resultado anidado contiene tareas (buscando elementos con clase .tasks-item)
            if (resultadoAnidado && resultadoAnidado.nodeType) {
                const tareasAnidadas = resultadoAnidado.querySelectorAll('.tasks-item');
                tieneTareasHeredadas = tareasAnidadas.length > 0;
                
                if (tieneTareasHeredadas) {
                    // Guardar el resultado anidado para usarlo después
                    refAnidadasConTareas.push({
                        referencia,
                        resultado: resultadoAnidado
                    });
                }
            }
            
            if (tareasReferencia.length > 0) {
                // Esta referencia tiene tareas propias
                referenciasConTareas.push({
                    referencia,
                    tareas: tareasReferencia,
                    refAnidadas: refAnidadasConTareas
                });
            } else if (tieneTareasHeredadas) {
                // Esta referencia no tiene tareas propias, pero tiene subreferencias con tareas
                referenciasConTareasHeredadas.push({
                    referencia,
                    tareas: [], // No tiene tareas propias
                    refAnidadas: refAnidadasConTareas
                });
            }
        } catch (e) {
            console.error(`Error al procesar referencia ${referencia.file.path}:`, e);
        }
    }
    
    // Combinar ambos tipos de referencias para procesarlas juntas
    const todasLasReferenciasConTareas = [...referenciasConTareas, ...referenciasConTareasHeredadas];
    const hayTareasEnReferencias = todasLasReferenciasConTareas.length > 0;
    
    // Si no hay tareas en la página actual ni en referencias, y no estamos en la raíz,
    // no mostramos nada (para optimizar espacio)
    if (!hayTareasEnActual && !hayTareasEnReferencias && profundidadActual > 0) {
        return contenedor;
    }
    
    // Si tenemos tareas en la página actual, las mostramos, pero solo si no es una referencia nidada
    // o si es la raíz (profundidadActual === 0)
    if (hayTareasEnActual && (!esReferenciaNidada || profundidadActual === 0)) {
        // Crear sección para las tareas de la página actual
        const seccionActual = document.createElement("div");
        seccionActual.className = "tasks-node-current";
        
        // Crear encabezado solo si hay referencias directas (para diferenciar)
        if (hayTareasEnReferencias) {
            const encabezadoActual = document.createElement("div");
            encabezadoActual.className = "tasks-node-header";
            encabezadoActual.textContent = "Tareas directas";
            seccionActual.appendChild(encabezadoActual);
        }
        
        // Agregar las tareas de la página actual
        this.agregarTareasAContenedor(tareas, seccionActual, dv, paginaActual);
        
        // Añadir la sección al contenedor principal
        contenedor.appendChild(seccionActual);
    }
    
    // Si tenemos referencias con tareas (propias o heredadas), procesamos cada una
    if (hayTareasEnReferencias) {
        // Crear sección para las tareas de referencias
        const seccionReferencias = document.createElement("div");
        seccionReferencias.className = "tasks-refs-container";
        
        // Solo añadimos encabezado si hay tareas tanto en actual como en referencias
        if (hayTareasEnActual && (!esReferenciaNidada || profundidadActual === 0)) {
            const encabezadoRefs = document.createElement("div");
            encabezadoRefs.className = "tasks-refs-header";
            encabezadoRefs.textContent = "Tareas en notas relacionadas";
            seccionReferencias.appendChild(encabezadoRefs);
        }
        
        // Crear lista para las referencias
        const listaRefs = document.createElement("ul");
        listaRefs.className = "tasks-refs-list";
        
        // Procesar cada referencia con tareas (propias o heredadas)
        for (const { referencia, tareas, refAnidadas } of todasLasReferenciasConTareas) {
            // Crear elemento para esta referencia
            const itemRef = document.createElement("li");
            itemRef.className = "tasks-ref-item";
            
            // Crear encabezado con información de la referencia
            const headerRef = this.crearEncabezadoReferencia(referencia, dv, tareas.length);
            itemRef.appendChild(headerRef);
            
            // Si tiene tareas propias, mostrarlas
            if (tareas.length > 0) {
                // Crear contenedor colapsable para las tareas
                const tareasContainer = document.createElement("div");
                tareasContainer.className = "tasks-container";
                // Añadir atributo de datos para identificar a qué nota pertenece este contenedor
                tareasContainer.setAttribute("data-path", referencia.file.path);
                
                // Agregar las tareas de esta referencia
                this.agregarTareasAContenedor(tareas, tareasContainer, dv, referencia);
                
                // Agregar el contenedor de tareas al elemento de referencia
                itemRef.appendChild(tareasContainer);
            }
            
            // Si tiene subreferencias con tareas, mostrarlas
            if (refAnidadas && refAnidadas.length > 0) {
                for (const { resultado } of refAnidadas) {
                    if (resultado && resultado.nodeType) {
                        // Quitar el título repetido si existe
                        const tituloRepetido = resultado.querySelector('.tasks-tree-title');
                        if (tituloRepetido) {
                            tituloRepetido.remove();
                        }
                        
                        // Aplicar clase especial para sub-referencias
                        resultado.classList.add('tasks-subrefs-container');
                        
                        // Agregar sub-referencias al elemento actual
                        itemRef.appendChild(resultado);
                    }
                }
            }
            
            // Añadir el elemento de referencia a la lista
            listaRefs.appendChild(itemRef);
        }
        
        // Añadir la lista de referencias a la sección
        seccionReferencias.appendChild(listaRefs);
        
        // Añadir la sección al contenedor principal
        contenedor.appendChild(seccionReferencias);
    }
    
    // Si no hay tareas en absoluto y estamos en la raíz, mostrar mensaje
    if (!hayTareasEnActual && !hayTareasEnReferencias && profundidadActual === 0) {
        const mensaje = document.createElement("p");
        mensaje.textContent = "No se encontraron tareas pendientes o en progreso";
        mensaje.className = "tasks-tree-empty";
        contenedor.appendChild(mensaje);
    }
    
    return contenedor;
}

/**
 * Extrae las tareas pendientes y en progreso de una página
 * @param {Object} pagina - La página de la que extraer tareas
 * @param {Object} dv - El objeto dataview
 * @returns {Array} - Array de objetos con las tareas extraídas
 */
async extraerTareasDePagina(pagina, dv) {
    try {
        // Verificar que pagina.file existe
        if (!pagina || !pagina.file || !pagina.file.path) {
            console.warn("Página o archivo no válido:", pagina);
            return [];
        }
        
        // Obtener el contenido del archivo de manera segura
        let contenido;
        try {
            // Primero intentamos con el método de Dataview si está disponible
            if (dv && typeof dv.io !== 'undefined' && typeof dv.io.load === 'function') {
                contenido = await dv.io.load(pagina.file.path);
            } 
            // Si no funciona, usamos el método de Obsidian
            else {
                const archivo = app.vault.getAbstractFileByPath(pagina.file.path);
                if (archivo && archivo instanceof app.TFile) {
                    contenido = await app.vault.read(archivo);
                } else {
                    throw new Error("No se pudo encontrar el archivo");
                }
            }
        } catch (readError) {
            console.warn(`No se pudo leer el archivo ${pagina.file.path}:`, readError);
            return [];
        }
        
        // Si no pudimos obtener el contenido, retornamos array vacío
        if (!contenido) {
            console.warn(`No se pudo obtener contenido para ${pagina.file.path}`);
            return [];
        }
        
        // Dividir el contenido en líneas
        const lineas = contenido.split('\n');
        
        // Array para almacenar las tareas encontradas
        const tareas = [];
        
        // Analizar cada línea buscando tareas
        for (let i = 0; i < lineas.length; i++) {
            const linea = lineas[i];
            
            // Expresión regular para detectar tareas pendientes (- [ ]) o en progreso (- [/])
            const tareaRegex = /^(\s*)-\s*\[([ \/])\]\s*(.+)$/;
            const coincidencia = tareaRegex.exec(linea);
            
            if (coincidencia) {
                // Extraer las partes de la tarea
                const indentacion = coincidencia[1];
                const estado = coincidencia[2] === ' ' ? 'pendiente' : 'progreso';
                const texto = coincidencia[3].trim();
                
                // Crear objeto para la tarea
                const tarea = {
                    texto,
                    estado,
                    indentacion: indentacion.length,
                    lineaIndice: i,
                    lineaOriginal: linea
                };
                
                // Añadir la tarea al array
                tareas.push(tarea);
            }
        }
        
        return tareas;
    } catch (error) {
        console.error(`Error al extraer tareas de ${pagina?.file?.path || 'página desconocida'}:`, error);
        return []; // Retornar array vacío en caso de error
    }
}

/**
 * Crea el encabezado para una referencia con contador de tareas
 * @param {Object} referencia - La referencia para la que crear el encabezado
 * @param {Object} dv - El objeto dataview
 * @param {Number} numTareas - Número de tareas en esta referencia
 * @returns {HTMLElement} - Elemento HTML con el encabezado
 */
crearEncabezadoReferencia(referencia, dv, numTareas) {
    // Crear el contenedor del encabezado
    const header = document.createElement("div");
    header.className = "tasks-ref-header";

    // Añadir botón de expansión/colapso
    const toggleBtn = document.createElement("span");
    toggleBtn.textContent = "▼";
    toggleBtn.className = "tasks-toggle-btn";
    toggleBtn.setAttribute("data-state", "expanded");
    toggleBtn.setAttribute("title", "Colapsar/Expandir");
    
    // Añadir handler para colapsar/expandir
    toggleBtn.addEventListener("click", function(event) {
        const currentState = this.getAttribute("data-state");
        const newState = currentState === "expanded" ? "collapsed" : "expanded";
        this.setAttribute("data-state", newState);
        this.textContent = newState === "expanded" ? "▼" : "▶";
        
        // Obtener el elemento padre del botón (header) y luego el elemento padre del header (li)
        const headerElement = this.closest(".tasks-ref-header");
        if (headerElement && headerElement.parentNode) {
            const listItem = headerElement.parentNode;
            
            // Obtener todos los contenedores secundarios - tanto tasks-container como tasks-subrefs-container
            const containers = listItem.querySelectorAll('.tasks-container, .tasks-subrefs-container');
            
            // Cambiar la visibilidad de todos los contenedores encontrados
            containers.forEach(container => {
                container.style.display = newState === "expanded" ? "block" : "none";
            });
        }
        
        // Detener propagación para que no interfiera con otros clics
        event.stopPropagation();
    });
    
    // Añadir botón de expansión al encabezado
    header.appendChild(toggleBtn);
    
    // Determinar el texto para mostrar
    let nombreMostrado = referencia.file.aliases && referencia.file.aliases.length > 0
        ? referencia.file.aliases[0]
        : (referencia.titulo || referencia.file.name);
        
    // Tipo de la nota (si está disponible)
    const tipo = referencia.typeName;
    if (tipo) {
        const tipoSpan = document.createElement("span");
        tipoSpan.className = "tasks-ref-type";
        tipoSpan.textContent = `[${tipo}] `;
        header.appendChild(tipoSpan);
    }
    
    // Añadir el emoji de estado si existe
    if (referencia.estado) {
        const estadoEl = document.createElement("span");
        estadoEl.className = "tasks-ref-state";
        estadoEl.textContent = `${referencia.estado} `;
        estadoEl.style.marginRight = "5px";
        header.appendChild(estadoEl);
    }


    // Crear el enlace a la nota
    try {
        const enlace = document.createElement("a");
        enlace.className = "internal-link tasks-ref-link";
        enlace.href = referencia.file.path;
        enlace.setAttribute("data-href", referencia.file.path);
        enlace.textContent = nombreMostrado;
        
        // Asegurar que el enlace es clicable usando la API de Obsidian
        enlace.addEventListener("click", (event) => {
            event.preventDefault();
            app.workspace.openLinkText(referencia.file.path, "", true);
        });
        
        header.appendChild(enlace);
    } catch (e) {
        console.error("Error al crear enlace:", e);
        const textoPlano = document.createElement("span");
        textoPlano.className = "tasks-ref-name";
        textoPlano.textContent = nombreMostrado;
        header.appendChild(textoPlano);
    }
    
    // Añadir contador de tareas
    const contador = document.createElement("span");
    contador.className = "tasks-count";
    contador.textContent = `(${numTareas})`;
    header.appendChild(contador);
    
    return header;
}

/**
 * Agrega un conjunto de tareas a un contenedor DOM
 * @param {Array} tareas - Array de objetos de tareas
 * @param {HTMLElement} contenedor - Contenedor al que añadir las tareas
 * @param {Object} dv - Objeto dataview
 * @param {Object} pagina - Página a la que pertenecen las tareas
 */
agregarTareasAContenedor(tareas, contenedor, dv, pagina) {
    if (!tareas || tareas.length === 0) return;
    
    // Crear lista para las tareas
    const lista = document.createElement("ul");
    lista.className = "tasks-list";
    
    // Añadir cada tarea como ítem de lista
    for (const tarea of tareas) {
        const item = document.createElement("li");
        item.className = `tasks-item tasks-${tarea.estado}`;
        item.setAttribute("data-linea", tarea.lineaIndice);
        
        // Crear el indicador de estado (checkbox)
        const checkbox = document.createElement("span");
        checkbox.className = `tasks-checkbox tasks-checkbox-${tarea.estado}`;
        checkbox.textContent = tarea.estado === 'pendiente' ? "☐" : "◔";
        
        // Añadir listener al checkbox para navegar a la tarea
        checkbox.addEventListener("click", () => {
            this.navegarATarea(pagina.file.path, tarea.lineaIndice);
        });
        
        // Crear contenedor para el texto de la tarea
        const textoSpan = document.createElement("span");
        textoSpan.className = "tasks-text";
        textoSpan.textContent = tarea.texto;
        
        // Añadir listener al texto para navegar a la tarea
        textoSpan.addEventListener("click", () => {
            this.navegarATarea(pagina.file.path, tarea.lineaIndice);
        });
        
        // Añadir los elementos al ítem
        item.appendChild(checkbox);
        item.appendChild(textoSpan);
        
        // Añadir el ítem a la lista
        lista.appendChild(item);
    }
    
    // Añadir la lista al contenedor
    contenedor.appendChild(lista);
}


/**
 * Obtiene y procesa notas vinculadas a una nota actual, con opciones de ordenamiento
 * @param params Objeto con parámetros como notaActualPath y sortOrder
 * @returns Objeto con la tabla HTML y metadatos
 */
async obtenerNotasVinculadas(params) {
    console.log("[DEBUG] Iniciando obtenerNotasVinculadas con parámetros:", params);
    
    try {
        // Extraer parámetros
        const { notaActualPath, sortOrder = "hits" } = params;
        console.log("[DEBUG] notaActualPath:", notaActualPath);
        console.log("[DEBUG] sortOrder:", sortOrder);
        
        if (!notaActualPath) {
            console.error("[ERROR] No se proporcionó la ruta de la nota actual");
            return { error: "No se proporcionó la ruta de la nota actual" };
        }
        
        // Obtener la nota actual
        const currentNote = app.vault.getAbstractFileByPath(notaActualPath);
        console.log("[DEBUG] currentNote:", currentNote?.path || "No encontrada");
        
        if (!currentNote) {
            console.error("[ERROR] No se pudo encontrar la nota actual en la ruta:", notaActualPath);
            return { error: "No se pudo encontrar la nota actual" };
        }
        
        // Calcular la fecha actual (inicio del día)
        const today = window.moment().startOf("day");
        console.log("[DEBUG] Fecha actual:", today.format("YYYY-MM-DD"));
        
        // Filtrar notas vinculadas
        const allFiles = app.vault.getMarkdownFiles();
        console.log("[DEBUG] Total de archivos markdown:", allFiles.length);
        
        let linkedNotes = [];
        let processingErrors = 0;
        let notesWithAsunto = 0;
        let notesTypeEntregable = 0;
        let possibleMatches = 0;
        
        for (const file of allFiles) {
            try {
                console.log("[DEBUG] Procesando archivo:", file.path);
                
                const metadata = app.metadataCache.getFileCache(file)?.frontmatter;
                
                if (!metadata) {
                    console.log("[DEBUG] Archivo sin frontmatter:", file.path);
                    continue;
                }
                
                console.log("[DEBUG] Metadata typeName:", metadata.typeName);
                console.log("[DEBUG] Metadata asunto:", JSON.stringify(metadata.asunto));
                
                if (metadata.typeName !== "Entregable") {
                    console.log("[DEBUG] Archivo no es un Entregable, se salta");
                    continue;
                }
                
                notesTypeEntregable++;
                
                if (!metadata.asunto) {
                    console.log("[DEBUG] Entregable sin asunto, se salta");
                    continue;
                }
                
                notesWithAsunto++;
                
                // Verificar si esta nota hace referencia a la nota actual
                let isLinked = false;
                
                console.log("[DEBUG] Comprobando si referencia a la nota actual:", notaActualPath);
                console.log("[DEBUG] Tipo de asunto:", typeof metadata.asunto);
                
                if (Array.isArray(metadata.asunto)) {
                    console.log("[DEBUG] asunto es un array con", metadata.asunto.length, "elementos");
                    
                    // Para cada elemento en el array asunto
                    for (const asunto of metadata.asunto) {
                        console.log("[DEBUG] Elemento asunto:", JSON.stringify(asunto));
                        
                        if (asunto && typeof asunto === 'object' && asunto.path) {
                            console.log("[DEBUG] asunto tiene path:", asunto.path);
                            console.log("[DEBUG] ¿Coincide con notaActualPath?", asunto.path === notaActualPath);
                            
                            if (asunto.path === notaActualPath) {
                                isLinked = true;
                                possibleMatches++;
                                console.log("[DEBUG] ¡COINCIDENCIA ENCONTRADA en path!");
                                break;
                            }
                        } else if (typeof asunto === 'string') {
                            console.log("[DEBUG] asunto es string:", asunto);
                            console.log("[DEBUG] ¿Incluye notaActualPath?", asunto.includes(notaActualPath));
                            
                            if (asunto.includes(notaActualPath)) {
                                isLinked = true;
                                possibleMatches++;
                                console.log("[DEBUG] ¡COINCIDENCIA ENCONTRADA en string!");
                                break;
                            }
                            
                            // También buscar en el contenido del enlace wiki
                            const wikiLinkMatch = asunto.match(/\[\[(.*?)(?:\|(.*?))?\]\]/);
                            if (wikiLinkMatch) {
                                const linkPath = wikiLinkMatch[1];
                                console.log("[DEBUG] Detectado enlace wiki, path:", linkPath);
                                
                                if (linkPath === currentNote.basename || linkPath === notaActualPath) {
                                    isLinked = true;
                                    possibleMatches++;
                                    console.log("[DEBUG] ¡COINCIDENCIA ENCONTRADA en wikilink!");
                                    break;
                                }
                            }
                        }
                    }
                } else if (typeof metadata.asunto === 'object' && metadata.asunto.path) {
                    console.log("[DEBUG] asunto es un objeto con path:", metadata.asunto.path);
                    console.log("[DEBUG] ¿Coincide con notaActualPath?", metadata.asunto.path === notaActualPath);
                    
                    if (metadata.asunto.path === notaActualPath) {
                        isLinked = true;
                        possibleMatches++;
                        console.log("[DEBUG] ¡COINCIDENCIA ENCONTRADA en objeto!");
                    }
                } else if (typeof metadata.asunto === 'string') {
                    console.log("[DEBUG] asunto es un string simple:", metadata.asunto);
                    console.log("[DEBUG] ¿Incluye notaActualPath?", metadata.asunto.includes(notaActualPath));
                    
                    if (metadata.asunto.includes(notaActualPath)) {
                        isLinked = true;
                        possibleMatches++;
                        console.log("[DEBUG] ¡COINCIDENCIA ENCONTRADA en string simple!");
                    }
                    
                    // También buscar en el contenido del enlace wiki
                    const wikiLinkMatch = metadata.asunto.match(/\[\[(.*?)(?:\|(.*?))?\]\]/);
                    if (wikiLinkMatch) {
                        const linkPath = wikiLinkMatch[1];
                        console.log("[DEBUG] Detectado enlace wiki en string simple, path:", linkPath);
                        
                        // Comparar tanto con el nombre de archivo como con la ruta
                        const matchesPath = linkPath === notaActualPath;
                        const matchesBasename = linkPath === currentNote.basename;
                        
                        console.log("[DEBUG] ¿Coincide con ruta completa?", matchesPath);
                        console.log("[DEBUG] ¿Coincide con nombre de archivo?", matchesBasename);
                        
                        if (matchesPath || matchesBasename) {
                            isLinked = true;
                            possibleMatches++;
                            console.log("[DEBUG] ¡COINCIDENCIA ENCONTRADA en wikilink simple!");
                        }
                    }
                }
                
                if (isLinked) {
                    console.log("[DEBUG] ✅ Nota vinculada encontrada:", file.path);
                    
                    // Procesar la nota
                    let hits = parseFloat(metadata.hits);
                    if (isNaN(hits)) {
                        console.log("[DEBUG] hits no es un número, estableciendo a 0");
                        hits = 0;
                    }
                    
                    const alias = metadata.aliases?.[0] || file.basename;
                    const estado = metadata.estado || "Sin estado";
                    
                    let diferenciaDias = null;
                    if (metadata.publicacion) {
                        console.log("[DEBUG] Tiene fecha de publicación:", metadata.publicacion);
                        const pubDate = window.moment(metadata.publicacion.toString(), "YYYY-MM-DD").startOf("day");
                        
                        if (pubDate.isValid()) {
                            diferenciaDias = pubDate.diff(today, "days");
                            console.log("[DEBUG] diferenciaDias calculado:", diferenciaDias);
                        } else {
                            console.log("[DEBUG] La fecha de publicación no es válida");
                        }
                    }
                    
                    linkedNotes.push({ 
                        alias, 
                        hits, 
                        estado, 
                        diferenciaDias,
                        file
                    });
                    
                    console.log("[DEBUG] Nota añadida al resultado con alias:", alias);
                } else {
                    console.log("[DEBUG] No está vinculada, se omite");
                }
            } catch (error) {
                processingErrors++;
                console.error(`[ERROR] Error procesando archivo ${file.path}:`, error);
            }
        }
        
        console.log(`[DEBUG] Proceso completado. Notas vinculadas encontradas: ${linkedNotes.length}`);
        console.log(`[DEBUG] Estadísticas de procesamiento:`);
        console.log(`[DEBUG] - Total archivos procesados: ${allFiles.length}`);
        console.log(`[DEBUG] - Notas tipo Entregable: ${notesTypeEntregable}`);
        console.log(`[DEBUG] - Notas con asunto: ${notesWithAsunto}`);
        console.log(`[DEBUG] - Posibles coincidencias: ${possibleMatches}`);
        console.log(`[DEBUG] - Errores de procesamiento: ${processingErrors}`);
        
        if (linkedNotes.length === 0) {
            console.log("[DEBUG] No se encontraron notas vinculadas");
            
            // Crear mensaje de información
            const infoElement = document.createElement("div");
            infoElement.innerHTML = `<p>No se encontraron entregables vinculados a esta nota.</p>
                                     <p><small>Estadísticas: ${notesTypeEntregable} entregables procesados, 
                                     ${notesWithAsunto} con asunto, ${possibleMatches} posibles coincidencias.</small></p>`;
            
            return {
                tablaElement: infoElement,
                totalNotas: 0,
                totalHits: 0
            };
        }
        
        // Ordenar notas según el criterio
        console.log("[DEBUG] Ordenando notas por:", sortOrder);
        
        if (sortOrder === "hits") {
            linkedNotes.sort((a, b) => b.hits - a.hits);
        } else {
            const safeDiff = d => d == null ? Infinity : d;
            linkedNotes.sort((a, b) => {
                if (a.estado === "🔵" && b.estado !== "🔵") return 1;
                if (b.estado === "🔵" && a.estado !== "🔵") return -1;
                return safeDiff(a.diferenciaDias) - safeDiff(b.diferenciaDias);
            });
        }
        
        console.log("[DEBUG] Creando tabla HTML");
        
        // Crear la tabla HTML
        const tablaElement = this.crearTablaNotasVinculadas(linkedNotes);
        
        const totalHits = linkedNotes.reduce((sum, nota) => sum + nota.hits, 0);
        console.log("[DEBUG] Total hits:", totalHits);
        
        return {
            tablaElement,
            totalNotas: linkedNotes.length,
            totalHits
        };
    } catch (error) {
        console.error("[ERROR] Error en obtenerNotasVinculadas:", error);
        
        // Crear elemento de error
        const errorElement = document.createElement("div");
        errorElement.innerHTML = `<p style="color: red;">Error al procesar notas vinculadas: ${error.message}</p>
                                 <p>Revisa la consola para más detalles.</p>`;
        
        return { 
            error: "Error al procesar notas vinculadas: " + error.message,
            tablaElement: errorElement
        };
    }
}

/**
 * Crea una tabla HTML con las notas vinculadas
 * @param notas Array de objetos con información de notas
 * @returns Elemento HTML de la tabla
 */
crearTablaNotasVinculadas(notas) {
    // Función auxiliar para determinar el color según los días hasta publicación
    const colorKey = (nota) => {
        if (nota.estado === "🔵") return "gray";
        if (nota.diferenciaDias == null) return "inherit";
        if (nota.diferenciaDias > 6) return "green";
        if (nota.diferenciaDias >= 3) return "#e6b800";
        if (nota.diferenciaDias >= 1) return "orange";
        return "red";
    };
    
    try {
        // Crear el elemento tabla
        const table = document.createElement('table');
        table.className = 'dataview table';
        table.style.width = '100%';
        
        // Crear encabezado
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        const headers = ["Nota", "Hits", "Estado", "Días hasta Publicación"];
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Crear cuerpo de la tabla
        const tbody = document.createElement('tbody');
        
        // Agregar filas de datos
        notas.forEach(nota => {
            const row = document.createElement('tr');
            
            // Celda para el enlace de la nota - SOLUCIÓN CORREGIDA
            const cellNota = document.createElement('td');
            const link = document.createElement('a');
            link.className = 'internal-link';
            link.textContent = nota.alias;
            
            // Usar data-href en lugar de href con obsidian://
            link.setAttribute('data-href', nota.file.path);
            
            // Hacer clicable el enlace con el método seguro de Obsidian
            link.addEventListener('click', (event) => {
                event.preventDefault();
                const path = event.target.getAttribute('data-href');
                if (path) {
                    app.workspace.openLinkText(path, "", false);
                }
            });
            
            cellNota.appendChild(link);
            row.appendChild(cellNota);
            
            // Celda para hits
            const cellHits = document.createElement('td');
            cellHits.textContent = nota.hits;
            row.appendChild(cellHits);
            
            // Celda para estado
            const cellEstado = document.createElement('td');
            cellEstado.textContent = nota.estado;
            row.appendChild(cellEstado);
            
            // Celda para días hasta publicación
            const cellDias = document.createElement('td');
            const color = colorKey(nota);
            const diasTexto = (nota.diferenciaDias != null) 
                ? `${nota.diferenciaDias} días` 
                : "No definido";
            
            const spanDias = document.createElement('span');
            spanDias.style.color = color;
            spanDias.style.fontWeight = 'bold';
            spanDias.textContent = diasTexto;
            
            cellDias.appendChild(spanDias);
            row.appendChild(cellDias);
            
            tbody.appendChild(row);
        });
        
        // Agregar fila de totales
        const totalRow = document.createElement('tr');
        
        const totalLabelCell = document.createElement('td');
        const totalLabel = document.createElement('strong');
        totalLabel.textContent = 'Total';
        totalLabelCell.appendChild(totalLabel);
        totalRow.appendChild(totalLabelCell);
        
        const totalHits = notas.reduce((sum, nota) => sum + nota.hits, 0);
        
        const totalValueCell = document.createElement('td');
        const totalValue = document.createElement('strong');
        totalValue.textContent = totalHits.toString();
        totalValueCell.appendChild(totalValue);
        totalRow.appendChild(totalValueCell);
        
        // Celdas vacías para completar la fila
        totalRow.appendChild(document.createElement('td')); // estado
        totalRow.appendChild(document.createElement('td')); // días
        
        tbody.appendChild(totalRow);
        table.appendChild(tbody);
        
        return table;
    } catch (error) {
        console.error("Error al crear tabla de notas vinculadas:", error);
        const errorElement = document.createElement("div");
        errorElement.textContent = "Error al generar tabla: " + error.message;
        errorElement.style.color = "red";
        return errorElement;
    }
}

//--- Selector de Estado

/**
 * Genera un selector visual de estado para la nota
 * @param params Objeto con parámetros como notaActualPath y estadoActual 
 * @returns Elemento DOM con el selector de estado
 */
async generarSelectorEstado(params) {
    try {
        // Extraer parámetros
        const { notaActualPath, estadoActual } = params;
        
        if (!notaActualPath) {
            console.error("No se proporcionó la ruta de la nota actual");
            return null;
        }
        
        // Obtener el archivo actual
        const currentFile = app.vault.getAbstractFileByPath(notaActualPath);
        if (!currentFile) {
            console.error("No se pudo encontrar el archivo actual:", notaActualPath);
            return null;
        }
        
        // Configuración para los estados
        const estados = [
            { emoji: "🟢", label: "Avanzando", color: "#4caf50" },
            { emoji: "🟡", label: "En Pausa", color: "#ffc107" },
            { emoji: "🔴", label: "Detenida", color: "#f44336" },
            { emoji: "🔵", label: "Archivada", color: "#2196f3" }
        ];
        
        // Determinar el estado actual de la nota
        const estadoInicial = estadoActual || "🟡"; // Valor por defecto
        
        // Crear el componente principal
        const container = document.createElement("div");
        container.className = "estado-selector-container";
        container.style.display = "flex";
        container.style.alignItems = "center";
        container.style.gap = "10px";
        container.style.maxWidth = "500px";
        container.style.margin = "0 auto";
        container.style.padding = "8px";
        container.style.borderRadius = "4px";
        container.style.backgroundColor = "var(--background-secondary-alt)";
        
        // Etiqueta "Estado:"
        const labelEl = document.createElement("span");
        labelEl.className = "estado-label";
        labelEl.textContent = "Estado:";
        labelEl.style.fontWeight = "500";
        labelEl.style.fontSize = "0.9em";
        container.appendChild(labelEl);
        
        // Crear contenedor para los botones
        const optionsContainer = document.createElement("div");
        optionsContainer.className = "estado-options";
        optionsContainer.style.display = "flex";
        optionsContainer.style.gap = "6px";
        optionsContainer.style.flex = "1";
        container.appendChild(optionsContainer);
        
        // Indicador del estado actual (aparece a la derecha)
        const currentStateIndicator = document.createElement("div");
        currentStateIndicator.className = "current-state-indicator";
        currentStateIndicator.style.display = "flex";
        currentStateIndicator.style.alignItems = "center";
        currentStateIndicator.style.marginLeft = "8px";
        currentStateIndicator.style.fontSize = "0.85em";
        currentStateIndicator.style.opacity = "0.8";
        currentStateIndicator.style.whiteSpace = "nowrap";
        
        const estadoInfo = estados.find(e => e.emoji === estadoInicial) || estados[0];
        currentStateIndicator.textContent = estadoInfo.label;
        container.appendChild(currentStateIndicator);
        
        // Función para actualizar el estado usando la API nativa de Obsidian
        const updateState = async (newState) => {
            try {
                // Utilizar la API de Obsidian para modificar el frontmatter
                await app.fileManager.processFrontMatter(currentFile, frontmatter => {
                    frontmatter.estado = newState;
                });
                
                // Actualizar la visualización del estado actual
                const newEstadoInfo = estados.find(e => e.emoji === newState);
                currentStateIndicator.textContent = newEstadoInfo.label;
                
                // Actualizar estilos de botones
                optionsContainer.querySelectorAll("button").forEach(btn => {
                    const btnEstado = btn.getAttribute("data-estado");
                    const estadoData = estados.find(e => e.emoji === btnEstado);
                    
                    if (btnEstado === newState) {
                        btn.style.backgroundColor = estadoData.color;
                        btn.style.color = "white";
                        btn.style.transform = "scale(1.1)";
                        btn.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
                    } else {
                        btn.style.backgroundColor = `${estadoData.color}22`;
                        btn.style.color = estadoData.color;
                        btn.style.transform = "none";
                        btn.style.boxShadow = "none";
                    }
                });
                
                // Mostrar notificación de éxito
                new Notice(`Estado cambiado a ${newEstadoInfo.label}`);
            } catch (error) {
                console.error("Error al actualizar el estado:", error);
                new Notice("Error al actualizar el estado. Consulta la consola para más detalles.");
            }
        };
        
        // Crear botones para cada estado
        estados.forEach(estado => {
            const boton = document.createElement("button");
            boton.className = "estado-btn";
            boton.setAttribute("data-estado", estado.emoji);
            boton.setAttribute("title", estado.label);
            boton.style.flex = "1";
            boton.style.border = "none";
            boton.style.borderRadius = "4px";
            boton.style.padding = "6px 0";
            boton.style.cursor = "pointer";
            boton.style.transition = "all 0.2s ease";
            boton.style.display = "flex";
            boton.style.alignItems = "center";
            boton.style.justifyContent = "center";
            
            // Establecer color según estado actual
            if (estadoInicial === estado.emoji) {
                boton.style.backgroundColor = estado.color;
                boton.style.color = "white";
                boton.style.transform = "scale(1.1)";
                boton.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
            } else {
                boton.style.backgroundColor = `${estado.color}22`;
                boton.style.color = estado.color;
            }
            
            const emojiSpan = document.createElement("span");
            emojiSpan.textContent = estado.emoji;
            emojiSpan.style.fontSize = "18px";
            boton.appendChild(emojiSpan);
            
            // Eventos de ratón
            boton.addEventListener("mouseover", () => {
                if (estadoInicial !== estado.emoji) {
                    boton.style.backgroundColor = `${estado.color}44`;
                    boton.style.transform = "translateY(-2px)";
                }
            });
            
            boton.addEventListener("mouseout", () => {
                if (estadoInicial !== estado.emoji) {
                    boton.style.backgroundColor = `${estado.color}22`;
                    boton.style.transform = "none";
                }
            });
            
            // Evento de clic
            boton.addEventListener("click", () => {
                updateState(estado.emoji);
            });
            
            optionsContainer.appendChild(boton);
        });
        
        return container;
    } catch (error) {
        console.error("Error en generarSelectorEstado:", error);
        return null;
    }
}


// -- Arbol de proyectos GTD


/**
 * Genera un árbol jerárquico visual de proyectos organizados por Áreas de Vida y Áreas de Interés
 * @param {Object} dv - El objeto dataview para acceder a sus funciones
 * @param {Object} options - Opciones de configuración (tipo de proyectos, filtros adicionales)
 * @returns {HTMLElement} - Elemento DOM con la estructura de árbol
 */
async generarArbolProyectos(dv, options = {}) {
    try {
        // Opciones por defecto
        const config = {
            tipoProyecto: options.tipoProyecto || "PGTD", // PGTD o PQ
            estadoFiltro: options.estadoFiltro || "🟢",   // Por defecto solo muestra activos
            soloMostrarConPendientes: options.soloMostrarConPendientes || false,
            expandirPorDefecto: options.expandirPorDefecto || false,
        };
        
        // Determinar la carpeta correcta basada en el tipo de proyecto
        const carpetaKey = config.tipoProyecto === "PGTD" ? "folder_ProyectosGTD" : "folder_ProyectosQ";
        const carpeta = this.plugin.settings[carpetaKey];
        
        if (!carpeta) {
            console.error(`Carpeta para ${config.tipoProyecto} no configurada`);
            const error = document.createElement("div");
            error.className = "tree-error";
            error.textContent = `Error: Carpeta para ${config.tipoProyecto} no configurada`;
            return error;
        }
        
        // Crear el contenedor principal
        const contenedor = document.createElement("div");
        contenedor.className = "proyectos-tree-container";
        
        // Crear el encabezado
        const encabezado = document.createElement("h3");
        encabezado.className = "proyectos-tree-title";
        
        // 1. Obtener todos los proyectos del tipo solicitado
        console.log(`Buscando proyectos en: ${carpeta}`);
        let proyectos = dv.pages()
            .filter(p => p.file.path.startsWith(carpeta) && 
                         !p.file.path.includes("/Plantillas/") &&
                         !p.file.path.includes("/Archivo/"));
        
        // Guardar el total antes de filtrar                 
        const totalProyectos = proyectos.length;
                         
        // Guardar todos los proyectos en una variable para poder filtrar pero mantener la estructura
        const todosLosProyectos = [...proyectos];
                         
        // Aplicar filtro de estado si está especificado y no es "todos"
        let proyectosFiltrados = proyectos;
        if (config.estadoFiltro && config.estadoFiltro !== "") {
            console.log(`Aplicando filtro de estado: ${config.estadoFiltro}`);
            proyectosFiltrados = proyectos.filter(p => p.estado === config.estadoFiltro);
        }
        
        // Actualizar el encabezado con la cuenta total
        encabezado.textContent = `Estructura de Proyectos ${config.tipoProyecto} ${config.estadoFiltro ? `(${proyectosFiltrados.length}/${totalProyectos})` : ''}`;
        contenedor.appendChild(encabezado);
        
        // Si no hay proyectos después de filtrar
        if (proyectosFiltrados.length === 0) {
            const mensaje = document.createElement("p");
            mensaje.className = "proyectos-tree-empty";
            mensaje.textContent = `No se encontraron proyectos ${config.tipoProyecto}${config.estadoFiltro ? ` con estado ${config.estadoFiltro}` : ""}`;
            contenedor.appendChild(mensaje);
            return contenedor;
        }
        
        console.log(`Proyectos encontrados: ${proyectosFiltrados.length}`);
        
        // 2. Construir la estructura jerárquica para saber qué proyectos se deben mostrar
        const proyectosAMostrar = this.determinarProyectosAMostrar(proyectosFiltrados, todosLosProyectos, config);
        
        // 3. Construir la estructura jerárquica de proyectos con los que se van a mostrar
        const { areasVida, proyectosSinAV } = this.construirEstructuraProyectos(proyectosAMostrar, dv);
        
        // 4. Renderizar el árbol de Áreas de Vida
        const arbolAV = document.createElement("div");
        arbolAV.className = "proyectos-areas-container";
        
        // Ordenar las Áreas de Vida por nombre
        const areasVidaOrdenadas = [...areasVida.entries()]
            .sort((a, b) => {
                const nombreA = a[1].nombre || a[0];
                const nombreB = b[1].nombre || b[0];
                return nombreA.localeCompare(nombreB);
            });
        
        // Renderizar cada Área de Vida y su contenido
        for (const [avPath, avData] of areasVidaOrdenadas) {
            const seccionAV = this.renderizarAreaVida(avPath, avData, dv, config);
            arbolAV.appendChild(seccionAV);
        }
        
        // 5. Renderizar proyectos sin Área de Vida si existen
        if (proyectosSinAV.length > 0) {
            const seccionSinAV = document.createElement("div");
            seccionSinAV.className = "proyectos-sin-av";
            
            const tituloSinAV = document.createElement("div");
            tituloSinAV.className = "proyectos-area-header sin-area";
            tituloSinAV.setAttribute("data-toggle-id", `sinav-global`);
            
            // Añadir contador de proyectos sin AV
            tituloSinAV.innerHTML = `<span class="toggle-icon">►</span> <span class="area-tipo">Sin Área de Vida</span> <span class="proyectos-contador">(${proyectosSinAV.length})</span>`;
            seccionSinAV.appendChild(tituloSinAV);
            
            const contenidoSinAV = document.createElement("div");
            contenidoSinAV.className = "proyectos-area-content";
            contenidoSinAV.id = `content-${tituloSinAV.getAttribute("data-toggle-id")}`;
            contenidoSinAV.style.display = "none"; // Inicialmente cerrado
            
            // Agrupar proyectos sin AV por Área de Interés
            const areasPorAI = this.agruparProyectosPorAI(proyectosSinAV, dv);
            
            // Renderizar cada grupo de AI
            for (const [aiPath, aiData] of areasPorAI.entries()) {
                const seccionAI = this.renderizarAreaInteres(aiPath, aiData, dv, config);
                contenidoSinAV.appendChild(seccionAI);
            }
            
            // Proyectos sin AI dentro de los sin AV
            const proyectosSinAI = proyectosSinAV.filter(p => 
                !p.areaInteres || 
                (Array.isArray(p.areaInteres) && p.areaInteres.length === 0) ||
                (typeof p.areaInteres === 'string' && p.areaInteres.trim() === '')
            );
            
            if (proyectosSinAI.length > 0) {
                const seccionSinAI = document.createElement("div");
                seccionSinAI.className = "proyectos-sin-ai";
                
                const tituloSinAI = document.createElement("div");
                tituloSinAI.className = "proyectos-ai-header sin-ai";
                tituloSinAI.setAttribute("data-toggle-id", `sinai-global`);
                
                // Añadir contador al título
                tituloSinAI.innerHTML = `<span class="toggle-icon">►</span> <span class="ai-tipo">Sin Área de Interés</span> <span class="proyectos-contador">(${proyectosSinAI.length})</span>`;
                seccionSinAI.appendChild(tituloSinAI);
                
                const contenidoSinAI = document.createElement("div");
                contenidoSinAI.className = "proyectos-ai-content";
                contenidoSinAI.id = `content-${tituloSinAI.getAttribute("data-toggle-id")}`;
                contenidoSinAI.style.display = "none"; // Inicialmente cerrado
                
                // Renderizar cada proyecto sin AI
                const listaProyectos = this.renderizarListaProyectos(proyectosSinAI, dv, config);
                contenidoSinAI.appendChild(listaProyectos);
                
                seccionSinAI.appendChild(contenidoSinAI);
                contenidoSinAV.appendChild(seccionSinAI);
                
                // Añadir listener para toggle
                tituloSinAI.addEventListener("click", (event) => {
                    if (event.target.tagName !== 'A') {
                        this.toggleSeccionById(tituloSinAI.getAttribute("data-toggle-id"));
                    }
                });
            }
            
            seccionSinAV.appendChild(contenidoSinAV);
            arbolAV.appendChild(seccionSinAV);
            
            // Agregar listener para colapsar/expandir
            tituloSinAV.addEventListener("click", (event) => {
                if (event.target.tagName !== 'A') {
                    this.toggleSeccionById(tituloSinAV.getAttribute("data-toggle-id"));
                }
            });
        }
        
        contenedor.appendChild(arbolAV);
        
        // Si se especificó expandir por defecto
        if (options.expandirPorDefecto) {
            this.expandirTodo(contenedor);
        }
        
        return contenedor;
    } catch (error) {
        console.error("Error en generarArbolProyectos:", error);
        const errorElement = document.createElement("div");
        errorElement.className = "proyectos-tree-error";
        errorElement.textContent = `Error al generar árbol de proyectos: ${error.message}`;
        return errorElement;
    }
}

/**
 * Construye la estructura jerárquica de proyectos organizados por Áreas de Vida
 * @param {Array} proyectos - Array de proyectos obtenidos de dataview
 * @param {Object} dv - Objeto dataview
 * @returns {Object} - Estructura organizada por áreas
 */
construirEstructuraProyectos(proyectos, dv) {
    const areasVida = new Map();
    const proyectosSinAV = [];
    
    // Procesar cada proyecto para organizarlo jerárquicamente
    for (const proyecto of proyectos) {
        let asignado = false;
        
        // Determinar a qué área de vida pertenece
        if (proyecto.areaVida) {
            let areaVidaPath;
            let areaVidaNombre;
            
            // Manejar diferentes formatos de areaVida
            if (typeof proyecto.areaVida === 'object' && proyecto.areaVida.path) {
                areaVidaPath = proyecto.areaVida.path;
                try {
                    const avPage = dv.page(areaVidaPath);
                    areaVidaNombre = avPage.titulo || avPage.file.name;
                } catch (e) {
                    areaVidaNombre = "Área de Vida " + areaVidaPath;
                }
            } else if (typeof proyecto.areaVida === 'string') {
                // Manejar formato de área de vida como string, podría ser un wikilink
                const wikiMatch = proyecto.areaVida.match(/\[\[(.*?)(?:\|(.*?))?\]\]/);
                if (wikiMatch) {
                    areaVidaPath = wikiMatch[1];
                    areaVidaNombre = wikiMatch[2] || wikiMatch[1];
                } else if (proyecto.areaVida !== "No es de ningún Area de Vida") {
                    // Buscar la página por nombre
                    try {
                        const avPages = dv.pages('#"' + proyecto.areaVida + '"');
                        if (avPages.length > 0) {
                            areaVidaPath = avPages[0].file.path;
                            areaVidaNombre = proyecto.areaVida;
                        } else {
                            areaVidaPath = proyecto.areaVida;
                            areaVidaNombre = proyecto.areaVida;
                        }
                    } catch (e) {
                        areaVidaPath = proyecto.areaVida;
                        areaVidaNombre = proyecto.areaVida;
                    }
                }
            }
            
            // Si hay un área de vida válida que no sea "No es de ningún Area de Vida"
            if (areaVidaPath && areaVidaPath !== "No es de ningún Area de Vida") {
                if (!areasVida.has(areaVidaPath)) {
                    areasVida.set(areaVidaPath, {
                        nombre: areaVidaNombre,
                        proyectos: [],
                        proyectosPorAI: new Map()
                    });
                }
                
                // Agregar el proyecto al área correspondiente
                areasVida.get(areaVidaPath).proyectos.push(proyecto);
                asignado = true;
                
                // Organizar por Área de Interés dentro del Área de Vida
                if (proyecto.areaInteres) {
                    const areasInteres = Array.isArray(proyecto.areaInteres) ? 
                        proyecto.areaInteres : [proyecto.areaInteres];
                    
                    let asignadoAI = false;
                    
                    for (const ai of areasInteres) {
                        let aiPath;
                        let aiNombre;
                        
                        // Manejar diferentes formatos de areaInteres
                        if (typeof ai === 'object' && ai.path) {
                            aiPath = ai.path;
                            try {
                                const aiPage = dv.page(aiPath);
                                aiNombre = aiPage.titulo || aiPage.file.name;
                            } catch (e) {
                                aiNombre = "Área de Interés " + aiPath;
                            }
                        } else if (typeof ai === 'string') {
                            const wikiMatch = ai.match(/\[\[(.*?)(?:\|(.*?))?\]\]/);
                            if (wikiMatch) {
                                aiPath = wikiMatch[1];
                                aiNombre = wikiMatch[2] || wikiMatch[1];
                            } else {
                                // Buscar la página por nombre
                                try {
                                    const aiPages = dv.pages('#"' + ai + '"');
                                    if (aiPages.length > 0) {
                                        aiPath = aiPages[0].file.path;
                                        aiNombre = ai;
                                    } else {
                                        aiPath = ai;
                                        aiNombre = ai;
                                    }
                                } catch (e) {
                                    aiPath = ai;
                                    aiNombre = ai;
                                }
                            }
                        }
                        
                        if (aiPath) {
                            const avData = areasVida.get(areaVidaPath);
                            if (!avData.proyectosPorAI.has(aiPath)) {
                                avData.proyectosPorAI.set(aiPath, {
                                    nombre: aiNombre,
                                    proyectos: []
                                });
                            }
                            
                            avData.proyectosPorAI.get(aiPath).proyectos.push(proyecto);
                            asignadoAI = true;
                        }
                    }
                    
                    // Si no se asignó a ningún AI, agregar a proyectos sin AI
                    if (!asignadoAI) {
                        const avData = areasVida.get(areaVidaPath);
                        if (!avData.proyectosSinAI) {
                            avData.proyectosSinAI = [];
                        }
                        avData.proyectosSinAI.push(proyecto);
                    }
                } else {
                    // Proyecto sin AI
                    const avData = areasVida.get(areaVidaPath);
                    if (!avData.proyectosSinAI) {
                        avData.proyectosSinAI = [];
                    }
                    avData.proyectosSinAI.push(proyecto);
                }
            }
        }
        
        if (!asignado) {
            proyectosSinAV.push(proyecto);
        }
    }
    
    return { areasVida, proyectosSinAV };
}

/**
 * Agrupa proyectos por Área de Interés
 * @param {Array} proyectos - Array de proyectos
 * @param {Object} dv - Objeto dataview
 * @returns {Map} - Mapa de proyectos agrupados por AI
 */
agruparProyectosPorAI(proyectos, dv) {
    const areasPorAI = new Map();
    const proyectosSinAI = [];
    
    for (const proyecto of proyectos) {
        let asignado = false;
        
        if (proyecto.areaInteres) {
            const areasInteres = Array.isArray(proyecto.areaInteres) ? 
                proyecto.areaInteres : [proyecto.areaInteres];
            
            for (const ai of areasInteres) {
                let aiPath;
                let aiNombre;
                
                // Manejar diferentes formatos de areaInteres
                if (typeof ai === 'object' && ai.path) {
                    aiPath = ai.path;
                    try {
                        const aiPage = dv.page(aiPath);
                        aiNombre = aiPage.titulo || aiPage.file.name;
                    } catch (e) {
                        aiNombre = "Área de Interés " + aiPath;
                    }
                } else if (typeof ai === 'string') {
                    const wikiMatch = ai.match(/\[\[(.*?)(?:\|(.*?))?\]\]/);
                    if (wikiMatch) {
                        aiPath = wikiMatch[1];
                        aiNombre = wikiMatch[2] || wikiMatch[1];
                    } else {
                        // Buscar la página por nombre
                        try {
                            const aiPages = dv.pages('#"' + ai + '"');
                            if (aiPages.length > 0) {
                                aiPath = aiPages[0].file.path;
                                aiNombre = ai;
                            } else {
                                aiPath = ai;
                                aiNombre = ai;
                            }
                        } catch (e) {
                            aiPath = ai;
                            aiNombre = ai;
                        }
                    }
                }
                
                if (aiPath) {
                    if (!areasPorAI.has(aiPath)) {
                        areasPorAI.set(aiPath, {
                            nombre: aiNombre,
                            proyectos: []
                        });
                    }
                    
                    areasPorAI.get(aiPath).proyectos.push(proyecto);
                    asignado = true;
                }
            }
        }
        
        if (!asignado) {
            proyectosSinAI.push(proyecto);
        }
    }
    
    // Agregar proyectos sin AI como una categoría especial
    if (proyectosSinAI.length > 0) {
        areasPorAI.set("sin-ai", {
            nombre: "Sin Área de Interés",
            proyectos: proyectosSinAI
        });
    }
    
    return areasPorAI;
}


/**
 * Renderiza una sección de Área de Vida con sus proyectos
 * @param {string} avPath - Ruta del archivo del Área de Vida
 * @param {Object} avData - Datos del Área de Vida
 * @param {Object} dv - Objeto dataview
 * @param {Object} config - Configuración
 * @returns {HTMLElement} - Elemento DOM con la sección del AV
 */
renderizarAreaVida(avPath, avData, dv, config) {
    const seccionAV = document.createElement("div");
    seccionAV.className = "proyectos-area-vida";
    
    // Calcular el total de proyectos en esta área para mostrar en el título
    const totalProyectos = avData.proyectos.length;
    
    // Encabezado del Área de Vida
    const tituloAV = document.createElement("div");
    tituloAV.className = "proyectos-area-header";
    tituloAV.setAttribute("data-toggle-id", `av-${avPath.replace(/\//g, "-")}`);
    
    // Icono de toggle
    const toggleIcono = document.createElement("span");
    toggleIcono.className = "toggle-icon";
    toggleIcono.textContent = "►"; // Por defecto cerrado
    tituloAV.appendChild(toggleIcono);
    
    // Etiqueta de tipo
    const tipoLabel = document.createElement("span");
    tipoLabel.className = "area-tipo";
    tipoLabel.textContent = "🗂️ Área de Vida:";
    tituloAV.appendChild(tipoLabel);
    
    // Enlace del AV
    try {
        const enlaceAV = document.createElement("a");
        enlaceAV.className = "area-link";
        enlaceAV.textContent = avData.nombre || "Área de Vida";
        enlaceAV.href = avPath;
        enlaceAV.setAttribute("data-href", avPath);
        enlaceAV.target = "_blank"; // Abrir en nueva pestaña
        
        // Hacer clicable el enlace usando la API de Obsidian
        enlaceAV.addEventListener("click", (event) => {
            event.preventDefault();
            app.workspace.openLinkText(avPath, "", true); // El true hace que se abra en nueva pestaña
        });
        
        tituloAV.appendChild(enlaceAV);
    } catch (e) {
        const textoAV = document.createElement("span");
        textoAV.textContent = avData.nombre || "Área de Vida";
        tituloAV.appendChild(textoAV);
    }
    
    // Añadir contador de proyectos
    const contadorProyectos = document.createElement("span");
    contadorProyectos.className = "proyectos-contador";
    contadorProyectos.textContent = ` (${totalProyectos})`;
    tituloAV.appendChild(contadorProyectos);
    
    seccionAV.appendChild(tituloAV);
    
    // Contenido del AV (AIs y proyectos)
    const contenidoAV = document.createElement("div");
    contenidoAV.className = "proyectos-area-content";
    contenidoAV.id = `content-${tituloAV.getAttribute("data-toggle-id")}`;
    contenidoAV.style.display = "none"; // Por defecto cerrado
    
    // Renderizar Áreas de Interés dentro de esta AV
    if (avData.proyectosPorAI && avData.proyectosPorAI.size > 0) {
        // Ordenar AIs alfabéticamente
        const aiOrdenadas = [...avData.proyectosPorAI.entries()]
            .sort((a, b) => a[1].nombre.localeCompare(b[1].nombre));
        
        for (const [aiPath, aiData] of aiOrdenadas) {
            const seccionAI = this.renderizarAreaInteres(aiPath, aiData, dv, config);
            contenidoAV.appendChild(seccionAI);
        }
    }
    
    // Renderizar proyectos sin AI
    if (avData.proyectosSinAI && avData.proyectosSinAI.length > 0) {
        const seccionSinAI = document.createElement("div");
        seccionSinAI.className = "proyectos-sin-ai";
        
        const tituloSinAI = document.createElement("div");
        tituloSinAI.className = "proyectos-ai-header sin-ai";
        tituloSinAI.setAttribute("data-toggle-id", `sinai-${avPath.replace(/\//g, "-")}`);
        
        // Contador de proyectos sin AI
        const totalSinAI = avData.proyectosSinAI.length;
        
        // Crear el HTML con el botón toggle y el contador
        tituloSinAI.innerHTML = `<span class="toggle-icon">►</span> <span class="ai-tipo">Sin Área de Interés</span> <span class="proyectos-contador">(${totalSinAI})</span>`;
        seccionSinAI.appendChild(tituloSinAI);
        
        const contenidoSinAI = document.createElement("div");
        contenidoSinAI.className = "proyectos-ai-content";
        contenidoSinAI.id = `content-${tituloSinAI.getAttribute("data-toggle-id")}`;
        contenidoSinAI.style.display = "none"; // Por defecto cerrado
        
        // Renderizar cada proyecto sin AI
        const listaProyectos = this.renderizarListaProyectos(avData.proyectosSinAI, dv, config);
        contenidoSinAI.appendChild(listaProyectos);
        
        seccionSinAI.appendChild(contenidoSinAI);
        contenidoAV.appendChild(seccionSinAI);
        
        // Agregar listener para colapsar/expandir
        tituloSinAI.addEventListener("click", (event) => {
            if (event.target.tagName !== 'A') {
                this.toggleSeccionById(tituloSinAI.getAttribute("data-toggle-id"));
            }
        });
    }
    
    seccionAV.appendChild(contenidoAV);
    
    // Agregar listener para colapsar/expandir
    tituloAV.addEventListener("click", (event) => {
        if (event.target.tagName !== 'A') {
            this.toggleSeccionById(tituloAV.getAttribute("data-toggle-id"));
        }
    });
    
    return seccionAV;
}

/**
 * Renderiza una sección de Área de Interés con sus proyectos
 * @param {string} aiPath - Ruta del archivo del Área de Interés
 * @param {Object} aiData - Datos del Área de Interés
 * @param {Object} dv - Objeto dataview
 * @param {Object} config - Configuración
 * @returns {HTMLElement} - Elemento DOM con la sección del AI
 */
renderizarAreaInteres(aiPath, aiData, dv, config) {
    const seccionAI = document.createElement("div");
    seccionAI.className = "proyectos-area-interes";
    
    // Calcular total de proyectos para mostrar en título
    const totalProyectos = aiData.proyectos ? aiData.proyectos.length : 0;
    
    // Encabezado del AI
    const tituloAI = document.createElement("div");
    tituloAI.className = "proyectos-ai-header";
    tituloAI.setAttribute("data-toggle-id", `ai-${aiPath.replace(/\//g, "-")}`);
    
    // Icono de toggle
    const toggleIcono = document.createElement("span");
    toggleIcono.className = "toggle-icon";
    toggleIcono.textContent = "►"; // Por defecto cerrado
    tituloAI.appendChild(toggleIcono);
    
    // Etiqueta de tipo
    const tipoLabel = document.createElement("span");
    tipoLabel.className = "ai-tipo";
    tipoLabel.textContent = "📁 Área de Interés:";
    tituloAI.appendChild(tipoLabel);
    
    // Enlace del AI
    if (aiPath !== "sin-ai") {
        try {
            const enlaceAI = document.createElement("a");
            enlaceAI.className = "ai-link";
            enlaceAI.textContent = aiData.nombre || "Área de Interés";
            enlaceAI.href = aiPath;
            enlaceAI.setAttribute("data-href", aiPath);
            enlaceAI.target = "_blank"; // Abrir en nueva pestaña
            
            // Hacer clicable el enlace usando la API de Obsidian
            enlaceAI.addEventListener("click", (event) => {
                event.preventDefault();
                app.workspace.openLinkText(aiPath, "", true); // El true hace que se abra en nueva pestaña
            });
            
            tituloAI.appendChild(enlaceAI);
        } catch (e) {
            const textoAI = document.createElement("span");
            textoAI.textContent = aiData.nombre || "Área de Interés";
            tituloAI.appendChild(textoAI);
        }
    } else {
        const textoAI = document.createElement("span");
        textoAI.textContent = aiData.nombre || "Sin Área de Interés";
        tituloAI.appendChild(textoAI);
    }
    
    // Añadir contador de proyectos
    const contadorProyectos = document.createElement("span");
    contadorProyectos.className = "proyectos-contador";
    contadorProyectos.textContent = ` (${totalProyectos})`;
    tituloAI.appendChild(contadorProyectos);
    
    seccionAI.appendChild(tituloAI);
    
    // Contenido del AI (proyectos)
    const contenidoAI = document.createElement("div");
    contenidoAI.className = "proyectos-ai-content";
    contenidoAI.id = `content-${tituloAI.getAttribute("data-toggle-id")}`;
    contenidoAI.style.display = "none"; // Por defecto cerrado
    
    // Renderizar proyectos de esta AI
    if (aiData.proyectos && aiData.proyectos.length > 0) {
        const listaProyectos = this.renderizarListaProyectos(aiData.proyectos, dv, config);
        contenidoAI.appendChild(listaProyectos);
    } else {
        const mensaje = document.createElement("p");
        mensaje.className = "proyectos-ai-empty";
        mensaje.textContent = "No hay proyectos en esta Área de Interés";
        contenidoAI.appendChild(mensaje);
    }
    
    seccionAI.appendChild(contenidoAI);
    
    // Agregar listener para colapsar/expandir
    tituloAI.addEventListener("click", (event) => {
        if (event.target.tagName !== 'A') {
            this.toggleSeccionById(tituloAI.getAttribute("data-toggle-id"));
        }
    });
    
    return seccionAI;
}

/**
 * Toggle específico para un elemento por su ID
 * @param {string} toggleId - ID único del elemento toggle
 */
toggleSeccionById(toggleId) {
    // Buscar el header y el contenido correspondiente
    const header = document.querySelector(`[data-toggle-id="${toggleId}"]`);
    const content = document.getElementById(`content-${toggleId}`);
    
    if (!header || !content) return;
    
    const toggleIcon = header.querySelector('.toggle-icon');
    const isVisible = content.style.display !== 'none';
    
    if (isVisible) {
        content.style.display = 'none';
        toggleIcon.textContent = '►';
    } else {
        content.style.display = 'block';
        toggleIcon.textContent = '▼';
    }
}



/**
 * Renderiza una lista de proyectos
 * @param {Array} proyectos - Array de proyectos
 * @param {Object} dv - Objeto dataview
 * @param {Object} config - Configuración
 * @returns {HTMLElement} - Elemento DOM con la lista de proyectos
 */
renderizarListaProyectos(proyectos, dv, config) {
    const lista = document.createElement("ul");
    lista.className = "proyectos-lista";
    
    // Ordenar proyectos: primero por nivel (nivelP), luego por fecha (más reciente primero)
    const ordenados = [...proyectos].sort((a, b) => {
        const nivelA = a.nivelP || 0;
        const nivelB = b.nivelP || 0;
        
        if (nivelA !== nivelB) {
            return nivelA - nivelB; // Ascendente por nivel
        }
        
        // Si los niveles son iguales, ordenar por fecha (descendente)
        const fechaA = a.fecha ? new Date(a.fecha) : new Date(0);
        const fechaB = b.fecha ? new Date(b.fecha) : new Date(0);
        
        return fechaB - fechaA;
    });
    
    // Construir un mapa para relacionar proyectos padres e hijos
    const proyectosMap = new Map();
    const nodosRaiz = [];
    
    // Primero mapear todos los proyectos
    for (const proyecto of ordenados) {
        const path = proyecto.file.path;
        
        proyectosMap.set(path, {
            proyecto,
            hijos: []
        });
    }
    
    // Segundo paso: establecer relaciones padre-hijo
    for (const proyecto of ordenados) {
        const path = proyecto.file.path;
        
        // Si tiene proyectoGTD/proyectoQ como padre
        const padresCampo = config.tipoProyecto === "PGTD" ? "proyectoGTD" : "proyectoQ";
        
        if (proyecto[padresCampo]) {
            const padres = Array.isArray(proyecto[padresCampo]) ? 
                            proyecto[padresCampo] : [proyecto[padresCampo]];
            
            let tieneRelacion = false;
            
            for (const padre of padres) {
                let padrePath;
                
                if (typeof padre === 'object' && padre.path) {
                    padrePath = padre.path;
                } else if (typeof padre === 'string') {
                    const wikiMatch = padre.match(/\[\[(.*?)(?:\|(.*?))?\]\]/);
                    if (wikiMatch) {
                        padrePath = wikiMatch[1];
                    } else {
                        // Buscar proyecto por nombre
                        const proyectoEncontrado = ordenados.find(p => 
                            p.titulo === padre || 
                            (p.aliases && p.aliases.includes(padre)) ||
                            p.file.name === padre
                        );
                        
                        if (proyectoEncontrado) {
                            padrePath = proyectoEncontrado.file.path;
                        } else {
                            padrePath = padre;
                        }
                    }
                }
                
                if (padrePath && proyectosMap.has(padrePath)) {
                    proyectosMap.get(padrePath).hijos.push(proyectosMap.get(path));
                    tieneRelacion = true;
                }
            }
            
            if (!tieneRelacion) {
                nodosRaiz.push(proyectosMap.get(path));
            }
        } else {
            nodosRaiz.push(proyectosMap.get(path));
        }
    }
    
    // Renderizar proyectos jerárquicamente
    for (const nodoRaiz of nodosRaiz) {
        this.renderizarProyectoRecursivo(nodoRaiz, lista, 0, dv, config);
    }
    
    // Si no hay proyectos después de filtrar
    if (lista.children.length === 0) {
        const mensaje = document.createElement("li");
        mensaje.className = "proyectos-lista-empty";
        mensaje.textContent = "No hay proyectos que cumplan con los criterios de filtro";
        lista.appendChild(mensaje);
    }
    
    return lista;
}

/**
 * Renderiza un proyecto y sus subproyectos de forma recursiva
 * @param {Object} nodo - Nodo del proyecto actual
 * @param {HTMLElement} lista - Elemento lista donde agregar el proyecto
 * @param {number} nivel - Nivel de indentación
 * @param {Object} dv - Objeto dataview
 * @param {Object} config - Configuración
 */
renderizarProyectoRecursivo(nodo, lista, nivel, dv, config) {
    const { proyecto, hijos } = nodo;
    
    // Filtrar si se debe mostrar solo con tareas pendientes
    if (config.soloMostrarConPendientes) {
        const tieneTareasPendientes = (
            proyecto.file.tasks && 
            proyecto.file.tasks.filter(t => !t.completed).length > 0
        );
        
        // Comprobar si alguno de sus hijos tiene tareas pendientes
        const hijosConTareas = hijos.some(hijo => {
            // Verificar tareas en este hijo
            const hijoPendientes = hijo.proyecto.file.tasks && 
                hijo.proyecto.file.tasks.filter(t => !t.completed).length > 0;
            return hijoPendientes;
        });
        
        if (!tieneTareasPendientes && !hijosConTareas && hijos.length === 0) {
            return; // No mostrar este proyecto ni sus hijos
        }
    }
    
    // Crear item de lista para este proyecto
    const item = document.createElement("li");
    item.className = `proyectos-item nivel-${nivel}`;
    
    // Agregar indentación visual
    const indentacion = nivel > 0 ? '→'.repeat(nivel) + ' ' : '';
    
    // Determinar el texto a mostrar (alias o nombre del archivo)
    const textoMostrar = proyecto.titulo || 
                       (proyecto.aliases && proyecto.aliases.length > 0 ? proyecto.aliases[0] : null) || 
                       proyecto.file.name;
    
    // Construir el contenido del item
    const contenido = document.createElement("div");
    contenido.className = "proyecto-contenido";
    
    // Agregar estado como emoji
    if (proyecto.estado) {
        const estadoSpan = document.createElement("span");
        estadoSpan.className = "proyecto-estado";
        estadoSpan.textContent = proyecto.estado + " ";
        contenido.appendChild(estadoSpan);
    }
    
    // Agregar indentación como texto
    if (indentacion) {
        const indentSpan = document.createElement("span");
        indentSpan.className = "proyecto-indent";
        indentSpan.textContent = indentacion;
        contenido.appendChild(indentSpan);
    }
    
    // Crear enlace al proyecto
    try {
        const enlace = document.createElement("a");
        enlace.className = "proyecto-link";
        enlace.textContent = textoMostrar;
        enlace.href = proyecto.file.path;
        enlace.setAttribute("data-href", proyecto.file.path);
        enlace.target = "_blank"; // Abrir en nueva pestaña
        
        // Hacer clicable el enlace
        enlace.addEventListener("click", (event) => {
            event.preventDefault();
            app.workspace.openLinkText(proyecto.file.path, "", true); // El true hace que se abra en nueva pestaña
        });
        
        contenido.appendChild(enlace);
    } catch (e) {
        const texto = document.createElement("span");
        texto.textContent = textoMostrar;
        contenido.appendChild(texto);
    }
    
    // Agregar info adicional como tareas pendientes
    if (proyecto.file.tasks) {
        const tareasPendientes = proyecto.file.tasks.filter(t => !t.completed).length;
        if (tareasPendientes > 0) {
            const tareasSpan = document.createElement("span");
            tareasSpan.className = "proyecto-pendientes";
            tareasSpan.textContent = ` (${tareasPendientes} pendientes)`;
            contenido.appendChild(tareasSpan);
        }
    }
    
    // Agregar nivel si es > 0
    if (proyecto.nivelP && proyecto.nivelP > 0) {
        const nivelSpan = document.createElement("span");
        nivelSpan.className = "proyecto-nivel";
        nivelSpan.textContent = ` [Nivel ${proyecto.nivelP}]`;
        contenido.appendChild(nivelSpan);
    }
    
    item.appendChild(contenido);
    
    // Agregar a la lista
    lista.appendChild(item);
    
    // Procesar hijos recursivamente si tiene
    if (hijos && hijos.length > 0) {
        const sublista = document.createElement("ul");
        sublista.className = "proyectos-sublista";
        
        // Procesar cada hijo
        for (const hijo of hijos) {
            this.renderizarProyectoRecursivo(hijo, sublista, nivel + 1, dv, config);
        }
        
        // Solo agregar la sublista si tiene hijos después del filtrado
        if (sublista.children.length > 0) {
            item.appendChild(sublista);
        }
    }
}

/**
 * Alterna entre mostrar y ocultar una sección
 * @param {HTMLElement} header - Elemento de encabezado con el toggle
 * @param {HTMLElement} content - Elemento de contenido a mostrar/ocultar
 */
toggleSeccion(header, content) {
    const toggleIcon = header.querySelector('.toggle-icon');
    const isVisible = content.style.display !== 'none';
    
    if (isVisible) {
        content.style.display = 'none';
        toggleIcon.textContent = '►';
    } else {
        content.style.display = 'block';
        toggleIcon.textContent = '▼';
    }
}

/**
 * Expande todas las secciones en el árbol
 * @param {HTMLElement} container - Contenedor principal
 */
expandirTodo(container) {
    // Obtener todos los elementos togglables
    const headers = container.querySelectorAll('[data-toggle-id]');
    
    // Recorrer cada header y expandir su contenido
    headers.forEach(header => {
        const toggleId = header.getAttribute("data-toggle-id");
        const content = document.getElementById(`content-${toggleId}`);
        
        if (content) {
            content.style.display = 'block';
            const toggleIcon = header.querySelector('.toggle-icon');
            if (toggleIcon) {
                toggleIcon.textContent = '▼';
            }
        }
    });
}

/**
 * Colapsa todas las secciones en el árbol
 * @param {HTMLElement} container - Contenedor principal
 */
colapsarTodo(container) {
    // Obtener todos los elementos togglables
    const headers = container.querySelectorAll('[data-toggle-id]');
    
    // Recorrer cada header y colapsar su contenido
    headers.forEach(header => {
        const toggleId = header.getAttribute("data-toggle-id");
        const content = document.getElementById(`content-${toggleId}`);
        
        if (content) {
            content.style.display = 'none';
            const toggleIcon = header.querySelector('.toggle-icon');
            if (toggleIcon) {
                toggleIcon.textContent = '►';
            }
        }
    });
}

/**
 * Agrega listeners para expandir/colapsar secciones
 * @param {HTMLElement} container - Contenedor principal
 */
agregarListenersProyectos(container) {
    // Agregar listeners para los headers de Áreas de Vida
    const headersAV = container.querySelectorAll('.proyectos-area-header');
    headersAV.forEach(header => {
        const content = header.nextElementSibling;
        if (content && content.classList.contains('proyectos-area-content')) {
            header.addEventListener('click', (event) => {
                if (event.target.tagName !== 'A') {
                    this.toggleSeccion(header, content);
                }
            });
        }
    });
    
    // Agregar listeners para los headers de Áreas de Interés
    const headersAI = container.querySelectorAll('.proyectos-ai-header');
    headersAI.forEach(header => {
        const content = header.nextElementSibling;
        if (content && content.classList.contains('proyectos-ai-content')) {
            header.addEventListener('click', (event) => {
                if (event.target.tagName !== 'A') {
                    this.toggleSeccion(header, content);
                }
            });
        }
    });
}


/**
 * Determina qué proyectos deben mostrarse teniendo en cuenta la estructura jerárquica
 * @param {Array} proyectosFiltrados - Array de proyectos ya filtrados
 * @param {Array} todosLosProyectos - Array con todos los proyectos
 * @param {Object} config - Configuración
 * @returns {Array} - Array de proyectos a mostrar
 */
determinarProyectosAMostrar(proyectosFiltrados, todosLosProyectos, config) {
    // Si no hay filtro específico, mostrar todos
    if (!config.estadoFiltro || config.estadoFiltro === "") {
        return todosLosProyectos;
    }
    
    // Conjunto para almacenar paths de proyectos a mostrar
    const pathsAMostrar = new Set();
    
    // Primero agregamos los proyectos filtrados
    proyectosFiltrados.forEach(p => pathsAMostrar.add(p.file.path));
    
    // Luego identificamos proyectos padres necesarios para mantener la estructura
    let cambiosRealizados = true;
    
    // Pasada 1: Identificar padres directos de los proyectos filtrados
    while (cambiosRealizados) {
        cambiosRealizados = false;
        
        for (const proyecto of todosLosProyectos) {
            // Si este proyecto ya está en la lista, pasamos al siguiente
            if (pathsAMostrar.has(proyecto.file.path)) continue;
            
            // Campo de proyectos padres según el tipo
            const padresCampo = config.tipoProyecto === "PGTD" ? "proyectoGTD" : "proyectoQ";
            
            // Revisar si alguno de sus hijos está en la lista
            for (const otroProyecto of todosLosProyectos) {
                if (!pathsAMostrar.has(otroProyecto.file.path)) continue;
                
                // Verificar si este proyecto es padre del otro
                const padres = otroProyecto[padresCampo];
                if (!padres) continue;
                
                const esReferenciadoComo = Array.isArray(padres) ? 
                    padres.some(p => this.referenciaAlMismoProyecto(p, proyecto)) : 
                    this.referenciaAlMismoProyecto(padres, proyecto);
                
                if (esReferenciadoComo) {
                    pathsAMostrar.add(proyecto.file.path);
                    cambiosRealizados = true;
                    break;
                }
            }
        }
    }
    
    // Pasada 2: Identificar hijos directos de los proyectos filtrados
    for (const proyecto of proyectosFiltrados) {
        // Campo de proyectos padres según el tipo
        const padresCampo = config.tipoProyecto === "PGTD" ? "proyectoGTD" : "proyectoQ";
        
        // Buscar proyectos que tengan a este como padre
        for (const otroProyecto of todosLosProyectos) {
            if (pathsAMostrar.has(otroProyecto.file.path)) continue;
            
            // Verificar si proyecto es padre de otroProyecto
            const padres = otroProyecto[padresCampo];
            if (!padres) continue;
            
            const esReferenciadoComo = Array.isArray(padres) ? 
                padres.some(p => this.referenciaAlMismoProyecto(p, proyecto)) : 
                this.referenciaAlMismoProyecto(padres, proyecto);
            
            if (esReferenciadoComo) {
                pathsAMostrar.add(otroProyecto.file.path);
            }
        }
    }
    
    // Retornar los proyectos que deben mostrarse
    return todosLosProyectos.filter(p => pathsAMostrar.has(p.file.path));
}



/**
 * Comprueba si una referencia (objeto o string) apunta al mismo proyecto
 * @param {*} referencia - Puede ser objeto con path, string con wikilink, o nombre directo
 * @param {Object} proyecto - Proyecto a comparar
 * @returns {boolean} - true si la referencia apunta al proyecto
 */
referenciaAlMismoProyecto(referencia, proyecto) {
    if (!referencia || !proyecto) return false;
    
    // Si es un objeto con path
    if (typeof referencia === 'object' && referencia.path) {
        return referencia.path === proyecto.file.path;
    }
    
    // Si es un string, podría ser un wikilink o un nombre directo
    if (typeof referencia === 'string') {
        // Verificar si es un wikilink [[path|alias]]
        const wikiMatch = referencia.match(/\[\[(.*?)(?:\|(.*?))?\]\]/);
        if (wikiMatch) {
            const path = wikiMatch[1];
            return path === proyecto.file.path || 
                   path === proyecto.file.basename || 
                   path === proyecto.titulo;
        }
        
        // Comparar con nombre, título o alias
        return referencia === proyecto.file.path ||
               referencia === proyecto.file.basename ||
               referencia === proyecto.titulo ||
               (proyecto.aliases && proyecto.aliases.includes(referencia));
    }
    
    return false;
}

/**
 * Navega a una tarea específica en una nota
 * @param {string} path - Ruta de la nota
 * @param {number} linea - Número de línea de la tarea
 */
navegarATarea(path, linea) {
    if (!path) {
        console.error("No se proporcionó una ruta de archivo válida");
        return;
    }
    
    // Navegar a la nota y posicionar en la línea de la tarea
    try {
        // Obtener el archivo
        const archivo = app.vault.getAbstractFileByPath(path);
        
        if (!archivo) {
            console.warn(`No se encontró el archivo: ${path}`);
            return;
        }
        
        // Verificar si podemos usar eState para posicionarse en una línea específica
        const canUseEState = typeof app.workspace.openLinkText === 'function';
        
        if (canUseEState) {
            // Esta es la forma más moderna de abrir archivos en Obsidian
            app.workspace.openLinkText(path, "", true, { eState: { line: linea } });
        } else {
            // Alternativa: abrir el archivo y luego intentar ir a la línea
            const leaf = app.workspace.getLeaf(false);
            leaf.openFile(archivo).then(() => {
                // Intentar posicionar en la línea después de que se abra el archivo
                setTimeout(() => {
                    if (leaf.view && leaf.view.editor) {
                        const editor = leaf.view.editor;
                        editor.setCursor({ line: linea, ch: 0 });
                        editor.scrollIntoView({ from: { line: linea, ch: 0 }, to: { line: linea, ch: 0 } }, true);
                    }
                }, 100);
            });
        }
    } catch (e) {
        console.error("Error al navegar a la tarea:", e);
        
        // Fallback más robusto - mostrar mensaje al usuario
        try {
            // Intentar abrir el archivo sin posicionarse en una línea específica
            const archivo = app.vault.getAbstractFileByPath(path);
            if (archivo) {
                app.workspace.getLeaf(false).openFile(archivo);
            } else {
                new Notice("No se pudo encontrar el archivo: " + path);
            }
        } catch (err) {
            console.error("Error en el fallback de navegación:", err);
            new Notice("Error al abrir el archivo: " + err.message);
        }
    }
}


// --- Mejora de la busqueda de Contextos GTD por bloque dvjs
/**
 * Genera una vista de tareas por contexto con navegación interactiva
 * @param dv - Objeto dataview para acceder a sus funciones
 * @returns Elemento DOM interactivo con los contextos y sus tareas
 */
async mostrarContextosGTD(dv) {
    try {
        // Crear el contenedor principal
        const container = document.createElement("div");
        container.className = "contextos-gtd-container";
        
        // Añadir estilos inline necesarios
        const styleEl = document.createElement("style");
        styleEl.textContent = `
        .highlighted-line {
          background-color: rgba(var(--interactive-accent-rgb), 0.3) !important;
          transition: background-color 1s ease-out;
        }
        
        .tarea-link {
          color: var(--interactive-accent);
          text-decoration: none;
          transition: all 0.2s ease;
        }
        
        .tarea-link:hover {
          text-decoration: underline;
          color: var(--interactive-accent-hover);
        }
        
        .linea-info {
          font-size: 0.85em;
          color: var(--text-muted);
        }

        /* El resto de estilos necesarios se cargan desde el archivo CSS global */
        `;
        container.appendChild(styleEl);
        
        // Añadir controles para expandir/colapsar/actualizar
        const controlsContainer = document.createElement("div");
        controlsContainer.className = "contextos-controles";
        
        // Botones con estilos directos
        const btnExpandir = document.createElement("button");
        btnExpandir.textContent = "📂 Expandir Todo";
        btnExpandir.className = "contextos-btn expandir";
        
        const btnColapsar = document.createElement("button");
        btnColapsar.textContent = "📁 Colapsar Todo";
        btnColapsar.className = "contextos-btn colapsar";
        
        const btnRefrescar = document.createElement("button");
        btnRefrescar.textContent = "🔄 Actualizar";
        btnRefrescar.className = "contextos-btn refrescar";
        
        controlsContainer.appendChild(btnExpandir);
        controlsContainer.appendChild(btnColapsar);
        controlsContainer.appendChild(btnRefrescar);
        container.appendChild(controlsContainer);
        
        // Contenedor para los contextos
        const contextosContainer = document.createElement("div");
        contextosContainer.className = "contextos-container";
        container.appendChild(contextosContainer);
        
        // Mostrar inicialmente un indicador de carga
        const loadingIndicator = document.createElement("div");
        loadingIndicator.className = "loading-indicator";
        const spinner = document.createElement("div");
        spinner.className = "spinner";
        loadingIndicator.appendChild(spinner);
        
        const loadingText = document.createElement("div");
        loadingText.textContent = "Cargando contextos...";
        loadingIndicator.appendChild(loadingText);
        
        contextosContainer.appendChild(loadingIndicator);
        
        // Obtener datos de contextos a través de la API de tareas
        const { contextosConTareas, totalContextos, totalTareas } = await this.plugin.tareasAPI.getTareasContextos();
        
        if (totalContextos === 0) {
            contextosContainer.innerHTML = "";
            const emptyMessage = document.createElement("p");
            emptyMessage.className = "error-message";
            emptyMessage.textContent = "No se encontraron tareas con contextos asignados";
            contextosContainer.appendChild(emptyMessage);
            return container;
        }
        
        // Limpiar el contenedor de carga
        contextosContainer.innerHTML = "";
        
        // Mostrar estadísticas
        const statsDiv = document.createElement("div");
        statsDiv.className = "contextos-stats";
        
        const statTotal = document.createElement("p");
        statTotal.textContent = `Total de contextos con tareas: ${totalContextos}`;
        statsDiv.appendChild(statTotal);
        
        const statTareas = document.createElement("p");
        statTareas.textContent = `Total de tareas encontradas: ${totalTareas}`;
        statsDiv.appendChild(statTareas);
        
        contextosContainer.appendChild(statsDiv);
        
        // Construir árbol de contextos
        const arbolContextos = this.construirArbolContextos(contextosConTareas);
        
        // Generar el HTML de los contextos
        this.generarContextosHTML(arbolContextos, contextosConTareas, contextosContainer);
        
        // Configurar eventos para los botones
        btnExpandir.addEventListener("click", () => {
            container.querySelectorAll(".contexto-details").forEach(details => {
                details.setAttribute("open", "true");
            });
        });
        
        btnColapsar.addEventListener("click", () => {
            container.querySelectorAll(".contexto-details").forEach(details => {
                details.removeAttribute("open");
            });
        });
        
        btnRefrescar.addEventListener("click", async () => {
            // Reemplazar el contenedor actual por una versión actualizada
            const nuevoContainer = await this.mostrarContextosGTD(dv);
            container.parentNode.replaceChild(nuevoContainer, container);
        });
        
        return container;
        
    } catch (error) {
        console.error("Error en mostrarContextosGTD:", error);
        
        // Devolver un mensaje de error
        const errorContainer = document.createElement("div");
        errorContainer.className = "error-message";
        errorContainer.textContent = `Error al cargar contextos: ${error.message}`;
        return errorContainer;
    }
}

/**
 * Construye la estructura de árbol de contextos
 * @param contextosConTareas Mapa de contextos con sus tareas
 * @returns Estructura jerárquica de contextos
 */
construirArbolContextos(contextosConTareas) {
    const arbol = new Map();

    Array.from(contextosConTareas.keys()).forEach(contexto => {
        const niveles = contexto.split(' → ');
        let nodoActual = arbol;

        niveles.forEach((nivel, index) => {
            if (!nodoActual.has(nivel)) {
                nodoActual.set(nivel, {
                    tareas: index === niveles.length - 1 ? contextosConTareas.get(contexto) : [],
                    subcontextos: new Map(),
                    rutaCompleta: niveles.slice(0, index + 1).join(' → ')
                });
            }
            nodoActual = nodoActual.get(nivel).subcontextos;
        });
    });

    return arbol;
}

/**
 * Genera el HTML de los contextos recursivamente
 * @param arbolContextos Estructura jerárquica de contextos
 * @param contextosConTareas Mapa original de contextos con tareas
 * @param container Elemento DOM donde añadir los contextos
 */
generarContextosHTML(arbolContextos, contextosConTareas, container) {
    const procesarNodo = (nodo, nivel = 0, parentEl) => {
        // Ordenar contextos por cantidad de tareas
        const sortedKeys = Array.from(nodo.keys()).sort((a, b) => {
            const tareasA = nodo.get(a).tareas.length;
            const tareasB = nodo.get(b).tareas.length;
            return tareasB - tareasA;
        });

        sortedKeys.forEach(contexto => {
            const info = nodo.get(contexto);
            const cantidadTareas = info.tareas.length;
            const tieneSubcontextos = info.subcontextos.size > 0;
            
            // Solo crear elementos si hay tareas o subcontextos
            if (cantidadTareas > 0 || tieneSubcontextos) {
                // Crear elemento details
                const detailsEl = document.createElement("details");
                detailsEl.className = `contexto-details nivel-${nivel}`;
                parentEl.appendChild(detailsEl);
                
                // Crear summary
                const summaryEl = document.createElement("summary");
                summaryEl.className = "contexto-summary";
                detailsEl.appendChild(summaryEl);
                
                // Encabezado con nombre y contador
                const headerEl = document.createElement("div");
                headerEl.className = "contexto-header";
                
                const nombreEl = document.createElement("div");
                nombreEl.className = "contexto-nombre";
                nombreEl.textContent = this.formatearNombreContexto(contexto);
                headerEl.appendChild(nombreEl);
                
                // Contador de tareas
                if (cantidadTareas > 0) {
                    const contadorEl = document.createElement("div");
                    contadorEl.className = "contexto-contador";
                    contadorEl.textContent = cantidadTareas.toString();
                    headerEl.appendChild(contadorEl);
                }
                
                summaryEl.appendChild(headerEl);
                
                // Contenido de tareas
                if (cantidadTareas > 0) {
                    const tareasContainer = document.createElement("div");
                    tareasContainer.className = "contexto-tareas";
                    detailsEl.appendChild(tareasContainer);
                    
                    // Ordenar y renderizar tareas
                    info.tareas.forEach(tarea => {
                        this.crearTareaElement(tarea, tareasContainer);
                    });
                }
                
                // Procesar subcontextos
                if (tieneSubcontextos) {
                    const subcontextosEl = document.createElement("div");
                    subcontextosEl.className = "subcontextos-container";
                    detailsEl.appendChild(subcontextosEl);
                    
                    procesarNodo(info.subcontextos, nivel + 1, subcontextosEl);
                }
            }
        });
    };
    
    // Iniciar procesamiento recursivo desde el nivel 0
    procesarNodo(arbolContextos, 0, container);
}

// Reemplazo para crearTareaElement en la clase addOnsAPI
crearTareaElement(tarea, container) {
    // Elemento principal de la tarea
    const tareaEl = document.createElement("div");
    tareaEl.className = `tarea-item ${tarea.isBlocked ? 'tarea-bloqueada' : ''}`;
    
    // Texto de la tarea
    const textoEl = document.createElement("div");
    textoEl.className = "tarea-texto";
    
    const checkboxEl = document.createElement("span");
    checkboxEl.className = "tarea-checkbox";
    checkboxEl.textContent = "☐";
    textoEl.appendChild(checkboxEl);
    
    const contenidoEl = document.createElement("span");
    contenidoEl.className = "tarea-contenido";
    contenidoEl.textContent = tarea.texto;
    textoEl.appendChild(contenidoEl);
    
    tareaEl.appendChild(textoEl);
    
    // Metadatos
    const metadatosEl = document.createElement("div");
    metadatosEl.className = "tarea-metadatos";
    
    // Ubicación con navegación
    const ubicacionEl = document.createElement("div");
    ubicacionEl.className = "tarea-ubicacion";
    
    const iconoUbicacion = document.createElement("span");
    iconoUbicacion.className = "metadato-icono";
    iconoUbicacion.textContent = "📍";
    ubicacionEl.appendChild(iconoUbicacion);
    
    const valorUbicacion = document.createElement("span");
    valorUbicacion.className = "metadato-valor";
    
    // Enlace para navegación
    const enlace = document.createElement("a");
    enlace.className = "internal-link tarea-link";
    enlace.textContent = tarea.titulo;
    
    // Verificar si la ruta del archivo es válida
    let rutaValida = tarea.rutaArchivo;
    
    // Eliminar cualquier carácter wiki
    if (rutaValida) {
        // Limpiar posibles formatos wiki [[ruta|alias]]
        const wikiMatch = rutaValida.match(/\[\[(.*?)(?:\|(.*?))?\]\]/);
        if (wikiMatch) {
            rutaValida = wikiMatch[1]; // Usar solo la ruta, no el alias
        }
        
        // Asegurarse de que la ruta termina en .md si es un archivo markdown
        if (!rutaValida.endsWith('.md') && app.vault.getAbstractFileByPath(rutaValida + '.md')) {
            rutaValida += '.md';
        }
    }
    
    // Almacenar datos seguros para navegación
    enlace.setAttribute('data-path', rutaValida || '');
    enlace.setAttribute('data-line', tarea.lineInfo?.numero?.toString() || '0');
    enlace.setAttribute('data-texto', tarea.textoOriginal || tarea.texto || '');
    
    // Usar el método seguro de Obsidian para la navegación
    enlace.addEventListener("click", (event) => {
        event.preventDefault();
        
        const path = enlace.getAttribute('data-path');
        const line = parseInt(enlace.getAttribute('data-line'), 10);
        const texto = enlace.getAttribute('data-texto');
        
        if (!path) {
            new Notice('Ruta del archivo no disponible');
            return;
        }
        
        // Verificar que el archivo existe antes de intentar abrirlo
        const file = app.vault.getAbstractFileByPath(path);
        if (!file) {
            new Notice(`Archivo no encontrado: ${path}`);
            return;
        }
        
        // Usar el método de navegación con resaltado y abrir en nueva pestaña
        this.navegarATareaConResaltado(path, line, texto, true); // Pasamos true para indicar nueva pestaña
    });
    
    valorUbicacion.appendChild(enlace);
    
    // Añadir número de línea si existe
    if (tarea.lineInfo?.numero) {
        const lineaInfo = document.createElement("span");
        lineaInfo.className = "linea-info";
        lineaInfo.textContent = ` (línea ${tarea.lineInfo.numero})`;
        valorUbicacion.appendChild(lineaInfo);
    }
    
    ubicacionEl.appendChild(valorUbicacion);
    metadatosEl.appendChild(ubicacionEl);
    
    // Fechas
    if (tarea.fechaVencimiento || tarea.fechaScheduled || tarea.fechaStart) {
        const fechasEl = document.createElement("div");
        fechasEl.className = "tarea-fechas";
        
        if (tarea.fechaVencimiento) {
            const fechaEl = document.createElement("div");
            fechaEl.className = "tarea-fecha vencimiento";
            
            const iconoFecha = document.createElement("span");
            iconoFecha.className = "metadato-icono";
            iconoFecha.textContent = "📅";
            fechaEl.appendChild(iconoFecha);
            
            const valorFecha = document.createElement("span");
            valorFecha.className = "metadato-valor";
            valorFecha.textContent = tarea.fechaVencimiento;
            fechaEl.appendChild(valorFecha);
            
            fechasEl.appendChild(fechaEl);
        }
        
        if (tarea.fechaScheduled) {
            const fechaEl = document.createElement("div");
            fechaEl.className = "tarea-fecha scheduled";
            
            const iconoFecha = document.createElement("span");
            iconoFecha.className = "metadato-icono";
            iconoFecha.textContent = "⏳";
            fechaEl.appendChild(iconoFecha);
            
            const valorFecha = document.createElement("span");
            valorFecha.className = "metadato-valor";
            valorFecha.textContent = tarea.fechaScheduled;
            fechaEl.appendChild(valorFecha);
            
            fechasEl.appendChild(fechaEl);
        }
        
        if (tarea.fechaStart) {
            const fechaEl = document.createElement("div");
            fechaEl.className = "tarea-fecha start";
            
            const iconoFecha = document.createElement("span");
            iconoFecha.className = "metadato-icono";
            iconoFecha.textContent = "🛫";
            fechaEl.appendChild(iconoFecha);
            
            const valorFecha = document.createElement("span");
            valorFecha.className = "metadato-valor";
            valorFecha.textContent = tarea.fechaStart;
            fechaEl.appendChild(valorFecha);
            
            fechasEl.appendChild(fechaEl);
        }
        
        metadatosEl.appendChild(fechasEl);
    }
    
    // Horarios
    if (tarea.horaInicio || tarea.horaFin) {
        const horarioEl = document.createElement("div");
        horarioEl.className = "tarea-horario";
        
        const iconoHorario = document.createElement("span");
        iconoHorario.className = "metadato-icono";
        iconoHorario.textContent = "⏰";
        horarioEl.appendChild(iconoHorario);
        
        const valorHorario = document.createElement("span");
        valorHorario.className = "metadato-valor";
        valorHorario.textContent = `${tarea.horaInicio || '--:--'} - ${tarea.horaFin || '--:--'}`;
        horarioEl.appendChild(valorHorario);
        
        metadatosEl.appendChild(horarioEl);
    }
    
    // Personas asignadas
    if (tarea.etiquetas.personas?.length > 0) {
        const personasEl = document.createElement("div");
        personasEl.className = "tarea-personas";
        
        const iconoPersonas = document.createElement("span");
        iconoPersonas.className = "metadato-icono";
        iconoPersonas.textContent = "👤";
        personasEl.appendChild(iconoPersonas);
        
        const valorPersonas = document.createElement("span");
        valorPersonas.className = "metadato-valor";
        valorPersonas.textContent = tarea.etiquetas.personas.join(' | ');
        personasEl.appendChild(valorPersonas);
        
        metadatosEl.appendChild(personasEl);
    }
    
    tareaEl.appendChild(metadatosEl);
    container.appendChild(tareaEl);
}

// Método mejorado de navegación a tareas con validación adicional
async navegarATareaConResaltado(path, lineNumber, textoTarea, nuevaPestaña = true) {
    try {
        // Verificar que la ruta es válida
        const file = app.vault.getAbstractFileByPath(path);
        if (!file) {
            new Notice(`Archivo no encontrado: ${path}`);
            return;
        }
        
        // Intentar abrir el archivo, opcionalmente en una nueva pestaña
        const leaf = app.workspace.getLeaf(nuevaPestaña); // 'true' indica crear una nueva pestaña
        await leaf.openFile(file);
        
        // Aplicar resaltado después de que el archivo se haya abierto completamente
        setTimeout(() => {
            const editor = leaf.view.editor;
            if (!editor) return;
            
            if (lineNumber > 0) {
                // Mover cursor y pantalla a la línea
                editor.setCursor({ line: lineNumber - 1, ch: 0 });
                editor.scrollIntoView(
                    { from: { line: lineNumber - 1, ch: 0 }, to: { line: lineNumber - 1, ch: 0 } },
                    true
                );
                
                // Aplicar resaltado visual 
                this.resaltarLineaTemporalmente(editor, lineNumber - 1);
            } 
            // Si no tenemos número de línea pero tenemos texto, buscamos el texto
            else if (textoTarea) {
                const contenido = editor.getValue();
                const lineas = contenido.split('\n');
                
                for (let i = 0; i < lineas.length; i++) {
                    // Buscar texto limpio o con marcadores de tarea
                    const textoLimpio = textoTarea.replace(/^-\s*\[[^\]]+\]\s*/, '').trim();
                    const lineaLimpia = lineas[i].replace(/^-\s*\[[^\]]+\]\s*/, '').trim();
                    
                    if (lineas[i].includes(textoTarea) || lineaLimpia.includes(textoLimpio)) {
                        // Mover cursor y pantalla a la línea encontrada
                        editor.setCursor({ line: i, ch: 0 });
                        editor.scrollIntoView(
                            { from: { line: i, ch: 0 }, to: { line: i, ch: lineas[i].length } },
                            true
                        );
                        
                        // Aplicar resaltado visual
                        this.resaltarLineaTemporalmente(editor, i);
                        break;
                    }
                }
            }
        }, 300);
    } catch (error) {
        console.error('Error en navegarATareaConResaltado:', error);
        new Notice(`Error al navegar: ${error.message}`);
    }
}

// Versión mejorada del resaltado de líneas
resaltarLineaTemporalmente(editor, lineIndex) {
    try {
        // Usar CM6 o CM5 dependiendo del editor
        if (editor.cm && editor.cm.state) {
            // Editor moderno (CM6)
            const lineDiv = editor.cm.dom.querySelector('.cm-content');
            if (lineDiv) {
                const lineElements = lineDiv.querySelectorAll('.cm-line');
                if (lineElements && lineElements.length > lineIndex) {
                    lineElements[lineIndex].classList.add('highlighted-line');
                    
                    setTimeout(() => {
                        lineElements[lineIndex].classList.remove('highlighted-line');
                    }, 2000);
                }
            }
        } else {
            // Editor clásico (CM5)
            const lineDiv = editor.lineDiv || editor.getScrollerElement();
            if (lineDiv) {
                const lineElements = lineDiv.querySelectorAll('.CodeMirror-line');
                if (lineElements && lineElements.length > lineIndex) {
                    lineElements[lineIndex].classList.add('highlighted-line');
                    
                    setTimeout(() => {
                        lineElements[lineIndex].classList.remove('highlighted-line');
                    }, 2000);
                }
            }
        }
    } catch (error) {
        console.error('Error al resaltar línea:', error);
    }
}

/**
 * Formatea el nombre de un contexto para mejor visualización
 * @param contexto String del contexto con formato jerárquico
 * @returns Nombre formateado del contexto
 */
formatearNombreContexto(contexto) {
    if (contexto.includes(' → ')) {
        return contexto.split(' → ').pop() || contexto;
    }
    return contexto;
}



// --- Taeas Huerfanas

// Método para addOnsAPI que muestra tareas sin clasificar en un componente visual

/**
 * Genera un componente visual para mostrar tareas sin clasificar (sin contexto, personas,
 * fechas o clasificación GTD)
 * @param dv Objeto dataview para acceder a sus funciones
 * @returns Elemento DOM con la vista de tareas sin clasificar
 */
async mostrarTareasSinClasificar(dv) {
    try {
        // Crear el contenedor principal
        const container = document.createElement("div");
        container.className = "tareas-sin-clasificar-container";
        
        // Añadir estilos personalizados para la visualización
        const styleEl = document.createElement("style");
        styleEl.textContent = `
        .tareas-sin-clasificar-container {
            font-size: 0.95em;
            width: 100%;
            max-width: 100%;
            margin: 0;
            padding: 0;
        }
        
        .tareas-heading {
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
            display: none;
        }
        
        .tarea-list.open {
            display: block;
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
        
        .meta-icon {
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
        
        .empty-message {
            color: var(--text-muted);
            text-align: center;
            padding: 2rem;
            font-style: italic;
        }
        `;
        container.appendChild(styleEl);
        
        // Añadir encabezado principal
        const heading = document.createElement("h3");
        heading.className = "tareas-heading";
        heading.textContent = "Tareas Sin Clasificar";
        container.appendChild(heading);
        
        // Agregar controles para expandir/colapsar todo
        const controlsDiv = document.createElement("div");
        controlsDiv.className = "tareas-controls";
        
        const expandBtn = document.createElement("button");
        expandBtn.className = "tareas-btn expand-btn";
        expandBtn.textContent = "📂 Expandir Todo";
        expandBtn.addEventListener("click", () => this.expandirTodasLasTareas(container));
        
        const collapseBtn = document.createElement("button");
        collapseBtn.className = "tareas-btn collapse-btn";
        collapseBtn.textContent = "📁 Colapsar Todo";
        collapseBtn.addEventListener("click", () => this.colapsarTodasLasTareas(container));
        
        const refreshBtn = document.createElement("button");
        refreshBtn.className = "tareas-btn refresh-btn";
        refreshBtn.textContent = "🔄 Actualizar";
        refreshBtn.addEventListener("click", async () => {
            const nuevoContainer = await this.mostrarTareasSinClasificar(dv);
            container.parentNode.replaceChild(nuevoContainer, container);
        });
        
        controlsDiv.appendChild(expandBtn);
        controlsDiv.appendChild(collapseBtn);
        controlsDiv.appendChild(refreshBtn);
        container.appendChild(controlsDiv);
        
        // Añadir indicador de carga
        const loadingDiv = document.createElement("div");
        loadingDiv.className = "loading-indicator";
        
        const spinnerDiv = document.createElement("div");
        spinnerDiv.className = "spinner";
        loadingDiv.appendChild(spinnerDiv);
        
        const loadingText = document.createElement("div");
        loadingText.textContent = "Buscando tareas sin clasificar...";
        loadingDiv.appendChild(loadingText);
        
        container.appendChild(loadingDiv);
        
        try {
            // Obtener datos de tareas sin clasificar a través de la API
            const { tareasPorNota, totalTareas, totalNotas } = await this.plugin.tareasAPI.getTareasSinClasificar();
            
            // Eliminar el indicador de carga
            container.removeChild(loadingDiv);
            
            // Si no hay tareas sin clasificar
            if (totalTareas === 0) {
                const emptyMessage = document.createElement("div");
                emptyMessage.className = "empty-message";
                emptyMessage.textContent = "¡Felicidades! No se encontraron tareas sin clasificar.";
                container.appendChild(emptyMessage);
                return container;
            }
            
            // Actualizar el encabezado con el contador
            const statsBadge = document.createElement("span");
            statsBadge.className = "stats-badge";
            statsBadge.textContent = `${totalTareas} tareas en ${totalNotas} notas`;
            heading.appendChild(statsBadge);
            
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
                    const header = primerGrupo.querySelector('.tarea-group-header');
                    const toggle = primerGrupo.querySelector('.tarea-group-toggle');
                    const list = primerGrupo.querySelector('.tarea-list');
                    
                    toggle.classList.add('open');
                    list.classList.add('open');
                }
            }
            
        } catch (error) {
            // Eliminar el indicador de carga
            container.removeChild(loadingDiv);
            
            // Mostrar mensaje de error
            const errorMessage = document.createElement("div");
            errorMessage.className = "error-message";
            errorMessage.textContent = `Error al cargar tareas sin clasificar: ${error.message}`;
            container.appendChild(errorMessage);
            
            console.error("Error en mostrarTareasSinClasificar:", error);
        }
        
        return container;
    } catch (error) {
        console.error("Error general en mostrarTareasSinClasificar:", error);
        
        // Devolver un mensaje de error
        const errorContainer = document.createElement("div");
        errorContainer.className = "error-message";
        errorContainer.textContent = `Error al cargar tareas sin clasificar: ${error.message}`;
        return errorContainer;
    }
}

/**
 * Crea un grupo de tareas para una nota específica
 * @param notaInfo Información de la nota y sus tareas
 * @param dv Objeto dataview
 * @returns Elemento DOM con el grupo de tareas
 */
crearGrupoTareas(notaInfo, dv) {
    const { titulo, ruta, tareas } = notaInfo;
    
    // Crear contenedor del grupo
    const grupoDiv = document.createElement("div");
    grupoDiv.className = "tarea-group";
    
    // Crear encabezado con toggle
    const headerDiv = document.createElement("div");
    headerDiv.className = "tarea-group-header";
    
    // Título con ícono de toggle
    const titleDiv = document.createElement("div");
    titleDiv.className = "tarea-group-title";
    
    const toggleSpan = document.createElement("span");
    toggleSpan.className = "tarea-group-toggle";
    toggleSpan.textContent = "▶";
    titleDiv.appendChild(toggleSpan);
    
    // Enlace a la nota
    try {
        const enlaceNota = document.createElement("a");
        enlaceNota.className = "internal-link";
        enlaceNota.textContent = titulo;
        enlaceNota.href = ruta;
        enlaceNota.setAttribute("data-href", ruta);
        
        // Agregar evento para abrir la nota
        enlaceNota.addEventListener("click", (event) => {
            event.preventDefault();
            app.workspace.openLinkText(ruta, "", true); // Abrir en nueva pestaña
        });
        
        titleDiv.appendChild(enlaceNota);
    } catch (e) {
        // Si falla la creación del enlace, mostrar solo texto
        const textoNota = document.createElement("span");
        textoNota.textContent = titulo;
        titleDiv.appendChild(textoNota);
    }
    
    headerDiv.appendChild(titleDiv);
    
    // Contador de tareas
    const countSpan = document.createElement("span");
    countSpan.className = "tarea-group-count";
    countSpan.textContent = tareas.length.toString();
    headerDiv.appendChild(countSpan);
    
    grupoDiv.appendChild(headerDiv);
    
    // Lista de tareas (inicialmente oculta)
    const tareasList = document.createElement("div");
    tareasList.className = "tarea-list";
    
    // Añadir cada tarea
    for (const tarea of tareas) {
        const tareaElement = this.crearTareaElementHuerfana(tarea, dv);
        tareasList.appendChild(tareaElement);
    }
    
    grupoDiv.appendChild(tareasList);
    
    // Agregar evento para mostrar/ocultar lista de tareas
    headerDiv.addEventListener("click", (event) => {
        // No colapsar si se hizo clic en un enlace
        if (event.target.tagName === 'A') return;
        
        toggleSpan.classList.toggle('open');
        tareasList.classList.toggle('open');
        
        if (toggleSpan.classList.contains('open')) {
            toggleSpan.textContent = "▼";
        } else {
            toggleSpan.textContent = "▶";
        }
    });
    
    return grupoDiv;
}

/**
 * Crea un elemento DOM para una tarea sin clasificar
 * @param tarea Objeto con la información de la tarea
 * @param dv Objeto dataview
 * @returns Elemento DOM representando la tarea
 */
crearTareaElementHuerfana(tarea, dv) {
    // Elemento principal
    const tareaDiv = document.createElement("div");
    tareaDiv.className = "tarea-item";
    
    // Texto de la tarea
    const textoDiv = document.createElement("div");
    textoDiv.className = "tarea-texto";
    
    // Checkbox (visual, no funcional)
    const checkboxSpan = document.createElement("span");
    checkboxSpan.className = "tarea-checkbox";
    checkboxSpan.textContent = "☐";
    checkboxSpan.setAttribute("data-path", tarea.rutaArchivo);
    checkboxSpan.setAttribute("data-line", tarea.lineInfo?.numero?.toString() || "0");
    
    // Hacer el checkbox clicable para navegar a la tarea
    checkboxSpan.addEventListener("click", () => {
        const path = checkboxSpan.getAttribute("data-path");
        const line = parseInt(checkboxSpan.getAttribute("data-line") || "0", 10);
        this.navegarATareaConResaltado(path, line, tarea.textoOriginal || tarea.texto, true);
    });
    
    textoDiv.appendChild(checkboxSpan);
    
    // Contenido de la tarea
    const contenidoSpan = document.createElement("span");
    contenidoSpan.className = "tarea-contenido";
    contenidoSpan.textContent = tarea.texto;
    
    // Hacer el contenido clicable para navegar a la tarea
    contenidoSpan.setAttribute("data-path", tarea.rutaArchivo);
    contenidoSpan.setAttribute("data-line", tarea.lineInfo?.numero?.toString() || "0");
    contenidoSpan.style.cursor = "pointer";
    
    contenidoSpan.addEventListener("click", () => {
        const path = contenidoSpan.getAttribute("data-path");
        const line = parseInt(contenidoSpan.getAttribute("data-line") || "0", 10);
        this.navegarATareaConResaltado(path, line, tarea.textoOriginal || tarea.texto, true);
    });
    
    textoDiv.appendChild(contenidoSpan);
    tareaDiv.appendChild(textoDiv);
    
    // Metadatos
    const metadatosDiv = document.createElement("div");
    metadatosDiv.className = "tarea-metadatos";
    
    // Ubicación (ruta y línea)
    const ubicacionDiv = document.createElement("div");
    ubicacionDiv.className = "tarea-meta-item";
    
    const iconoUbicacion = document.createElement("span");
    iconoUbicacion.className = "meta-icon";
    iconoUbicacion.textContent = "📍";
    ubicacionDiv.appendChild(iconoUbicacion);
    
    const valorUbicacion = document.createElement("span");
    
    // Si tenemos número de línea, mostrarlo
    if (tarea.lineInfo?.numero) {
        valorUbicacion.textContent = `Línea ${tarea.lineInfo.numero}`;
    } else {
        valorUbicacion.textContent = "Posición desconocida";
    }
    
    ubicacionDiv.appendChild(valorUbicacion);
    metadatosDiv.appendChild(ubicacionDiv);
    
    // Si tiene etiquetas mostrarlas (aunque no sean de las categorías buscadas)
    if (tarea.etiquetas.todas.length > 0) {
        const etiquetasDiv = document.createElement("div");
        etiquetasDiv.className = "tarea-meta-item";
        
        const iconoEtiquetas = document.createElement("span");
        iconoEtiquetas.className = "meta-icon";
        iconoEtiquetas.textContent = "🏷️";
        etiquetasDiv.appendChild(iconoEtiquetas);
        
        const valorEtiquetas = document.createElement("span");
        valorEtiquetas.textContent = tarea.etiquetas.todas.join(' ');
        etiquetasDiv.appendChild(valorEtiquetas);
        
        metadatosDiv.appendChild(etiquetasDiv);
    }
    
    tareaDiv.appendChild(metadatosDiv);
    
    return tareaDiv;
}

/**
 * Expande todos los grupos de tareas
 * @param container Contenedor principal
 */
expandirTodasLasTareas(container) {
    const grupos = container.querySelectorAll('.tarea-group');
    
    grupos.forEach(grupo => {
        const toggle = grupo.querySelector('.tarea-group-toggle');
        const list = grupo.querySelector('.tarea-list');
        
        toggle.classList.add('open');
        toggle.textContent = "▼";
        list.classList.add('open');
    });
}

/**
 * Colapsa todos los grupos de tareas
 * @param container Contenedor principal
 */
colapsarTodasLasTareas(container) {
    const grupos = container.querySelectorAll('.tarea-group');
    
    grupos.forEach(grupo => {
        const toggle = grupo.querySelector('.tarea-group-toggle');
        const list = grupo.querySelector('.tarea-list');
        
        toggle.classList.remove('open');
        toggle.textContent = "▶";
        list.classList.remove('open');
    });
}


//-- Tareas Inbox

// Añadir al archivo src/modules/noteLifecycleManager/API/addOnsAPI.ts

// Añadir al archivo src/modules/noteLifecycleManager/API/addOnsAPI.ts

/**
 * Genera un componente visual para mostrar tareas con etiqueta #inbox (bandeja de entrada)
 * @param dv Objeto dataview para acceder a sus funciones
 * @returns Elemento DOM con la vista de tareas de bandeja de entrada
 */
async mostrarTareasInbox(dv) {
    try {
        // Crear el contenedor principal
        const container = document.createElement("div");
        container.className = "tareas-inbox-container";
        
        // Añadir estilos personalizados si son necesarios
        const styleEl = document.createElement("style");
        styleEl.textContent = `
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
        `;
        container.appendChild(styleEl);
        
        // Añadir encabezado principal
        const heading = document.createElement("h3");
        heading.className = "inbox-heading";
        heading.innerHTML = '<span>📥 Tareas en Bandeja de Entrada</span>';
        container.appendChild(heading);
        
        // Agregar controles para expandir/colapsar todo
        const controlsDiv = document.createElement("div");
        controlsDiv.className = "tareas-controls";
        
        const expandBtn = document.createElement("button");
        expandBtn.className = "tareas-btn expand-btn";
        expandBtn.textContent = "📂 Expandir Todo";
        expandBtn.addEventListener("click", () => this.expandirTodasLasTareas(container));
        
        const collapseBtn = document.createElement("button");
        collapseBtn.className = "tareas-btn collapse-btn";
        collapseBtn.textContent = "📁 Colapsar Todo";
        collapseBtn.addEventListener("click", () => this.colapsarTodasLasTareas(container));
        
        const refreshBtn = document.createElement("button");
        refreshBtn.className = "tareas-btn refresh-btn";
        refreshBtn.textContent = "🔄 Actualizar";
        refreshBtn.addEventListener("click", async () => {
            const nuevoContainer = await this.mostrarTareasInbox(dv);
            container.parentNode.replaceChild(nuevoContainer, container);
        });
        
        const procesarBtn = document.createElement("button");
        procesarBtn.className = "tareas-btn process-btn";
        procesarBtn.style.backgroundColor = "var(--interactive-accent)";
        procesarBtn.style.color = "white";
        procesarBtn.textContent = "🔍 Procesar Inbox";
        procesarBtn.addEventListener("click", () => {
            // Mostrar indicación para procesar las tareas
            const notice = new app.Notice("Para procesar una tarea, haz clic en ella para abrirla y clasificarla", 5000);
        });
        
        controlsDiv.appendChild(expandBtn);
        controlsDiv.appendChild(collapseBtn);
        controlsDiv.appendChild(refreshBtn);
        controlsDiv.appendChild(procesarBtn);
        container.appendChild(controlsDiv);
        
        // Añadir indicador de carga
        const loadingDiv = document.createElement("div");
        loadingDiv.className = "loading-indicator";
        
        const spinnerDiv = document.createElement("div");
        spinnerDiv.className = "spinner";
        loadingDiv.appendChild(spinnerDiv);
        
        const loadingText = document.createElement("div");
        loadingText.textContent = "Buscando tareas en bandeja de entrada...";
        loadingDiv.appendChild(loadingText);
        
        container.appendChild(loadingDiv);
        
        try {
            // Obtener datos de tareas inbox a través de la API
            const { tareasPorNota, totalTareas, totalNotas } = await this.plugin.tareasAPI.getTareasInbox();
            
            // Eliminar el indicador de carga
            container.removeChild(loadingDiv);
            
            // Si no hay tareas en bandeja de entrada
            if (totalTareas === 0) {
                const emptyMessage = document.createElement("div");
                emptyMessage.className = "empty-message";
                emptyMessage.textContent = "¡Bandeja de entrada vacía! No se encontraron tareas con etiqueta #inbox.";
                container.appendChild(emptyMessage);
                return container;
            }
            
            // Actualizar el encabezado con el contador
            const statsBadge = document.createElement("span");
            statsBadge.className = "stats-badge";
            statsBadge.textContent = `${totalTareas} tareas en ${totalNotas} notas`;
            heading.appendChild(statsBadge);
            
            // Crear contenedor principal de estadísticas
            const statsContainer = document.createElement("div");
            statsContainer.className = "inbox-stats-container";
            statsContainer.style.display = "flex";
            statsContainer.style.flexWrap = "wrap";
            statsContainer.style.gap = "10px";
            statsContainer.style.margin = "10px 0 20px";
            
            // Crear tarjetas de estadísticas
            this.crearTarjetaEstadistica(statsContainer, "📥", "Tareas totales", totalTareas);
            this.crearTarjetaEstadistica(statsContainer, "📝", "Notas con tareas", totalNotas);
            
            // Agregar stats container al contenedor principal
            container.appendChild(statsContainer);
            
            // Ordenar notas por cantidad de tareas (descendente)
            const notasOrdenadas = Array.from(tareasPorNota.values())
                .sort((a, b) => b.tareas.length - a.tareas.length);
            
            // Crear grupos de tareas por nota
            for (const notaInfo of notasOrdenadas) {
                const grupoTareas = this.crearGrupoTareasInbox(notaInfo, dv);
                container.appendChild(grupoTareas);
            }
            
            // Expandir el primer grupo automáticamente
            if (notasOrdenadas.length > 0) {
                const primerGrupo = container.querySelector('.tarea-group');
                if (primerGrupo) {
                    const header = primerGrupo.querySelector('.tarea-group-header');
                    const toggle = primerGrupo.querySelector('.tarea-group-toggle');
                    const list = primerGrupo.querySelector('.tarea-list');
                    
                    toggle.classList.add('open');
                    toggle.textContent = "▼";
                    list.classList.add('open');
                }
            }
            
        } catch (error) {
            // Eliminar el indicador de carga
            container.removeChild(loadingDiv);
            
            // Mostrar mensaje de error
            const errorMessage = document.createElement("div");
            errorMessage.className = "error-message";
            errorMessage.textContent = `Error al cargar tareas de bandeja de entrada: ${error.message}`;
            container.appendChild(errorMessage);
            
            console.error("Error en mostrarTareasInbox:", error);
        }
        
        return container;
    } catch (error) {
        console.error("Error general en mostrarTareasInbox:", error);
        
        // Devolver un mensaje de error
        const errorContainer = document.createElement("div");
        errorContainer.className = "error-message";
        errorContainer.textContent = `Error al cargar tareas de bandeja de entrada: ${error.message}`;
        return errorContainer;
    }
}

/**
 * Crea una tarjeta de estadística para mostrar en el dashboard de inbox
 * @param container Contenedor donde agregar la tarjeta
 * @param icono Emoji o ícono para la tarjeta
 * @param titulo Título descriptivo
 * @param valor Valor numérico o texto a mostrar
 */
crearTarjetaEstadistica(container, icono, titulo, valor) {
    const tarjeta = document.createElement("div");
    tarjeta.className = "stats-card";
    tarjeta.style.flex = "1";
    tarjeta.style.minWidth = "150px";
    tarjeta.style.backgroundColor = "var(--background-secondary)";
    tarjeta.style.padding = "15px";
    tarjeta.style.borderRadius = "8px";
    tarjeta.style.textAlign = "center";
    tarjeta.style.display = "flex";
    tarjeta.style.flexDirection = "column";
    tarjeta.style.alignItems = "center";
    tarjeta.style.justifyContent = "center";
    
    const iconoEl = document.createElement("div");
    iconoEl.style.fontSize = "24px";
    iconoEl.style.marginBottom = "5px";
    iconoEl.textContent = icono;
    
    const tituloEl = document.createElement("div");
    tituloEl.style.fontSize = "12px";
    tituloEl.style.color = "var(--text-muted)";
    tituloEl.style.marginBottom = "5px";
    tituloEl.textContent = titulo;
    
    const valorEl = document.createElement("div");
    valorEl.style.fontWeight = "bold";
    valorEl.style.fontSize = "18px";
    valorEl.textContent = valor;
    
    tarjeta.appendChild(iconoEl);
    tarjeta.appendChild(tituloEl);
    tarjeta.appendChild(valorEl);
    
    container.appendChild(tarjeta);
}

/**
 * Crea un grupo de tareas inbox para una nota específica
 * @param notaInfo Información de la nota y sus tareas
 * @param dv Objeto dataview
 * @returns Elemento DOM con el grupo de tareas
 */
crearGrupoTareasInbox(notaInfo, dv) {
    const { titulo, ruta, tareas } = notaInfo;
    
    // Crear contenedor del grupo
    const grupoDiv = document.createElement("div");
    grupoDiv.className = "tarea-group";
    
    // Crear encabezado con toggle
    const headerDiv = document.createElement("div");
    headerDiv.className = "tarea-group-header";
    
    // Título con ícono de toggle
    const titleDiv = document.createElement("div");
    titleDiv.className = "tarea-group-title";
    
    const toggleSpan = document.createElement("span");
    toggleSpan.className = "tarea-group-toggle";
    toggleSpan.textContent = "▶";
    titleDiv.appendChild(toggleSpan);
    
    // Enlace a la nota
    try {
        const enlaceNota = document.createElement("a");
        enlaceNota.className = "internal-link";
        enlaceNota.textContent = titulo;
        enlaceNota.href = ruta;
        enlaceNota.setAttribute("data-href", ruta);
        
        // Agregar evento para abrir la nota
        enlaceNota.addEventListener("click", (event) => {
            event.preventDefault();
            app.workspace.openLinkText(ruta, "", true); // Abrir en nueva pestaña
        });
        
        titleDiv.appendChild(enlaceNota);
    } catch (e) {
        // Si falla la creación del enlace, mostrar solo texto
        const textoNota = document.createElement("span");
        textoNota.textContent = titulo;
        titleDiv.appendChild(textoNota);
    }
    
    headerDiv.appendChild(titleDiv);
    
    // Contador de tareas
    const countSpan = document.createElement("span");
    countSpan.className = "tarea-group-count";
    countSpan.textContent = tareas.length.toString();
    headerDiv.appendChild(countSpan);
    
    grupoDiv.appendChild(headerDiv);
    
    // Lista de tareas (inicialmente oculta)
    const tareasList = document.createElement("div");
    tareasList.className = "tarea-list";
    
    // Añadir cada tarea
    for (const tarea of tareas) {
        const tareaElement = this.crearTareaElementInbox(tarea, dv);
        tareasList.appendChild(tareaElement);
    }
    
    grupoDiv.appendChild(tareasList);
    
    // Agregar evento para mostrar/ocultar lista de tareas
    headerDiv.addEventListener("click", (event) => {
        // No colapsar si se hizo clic en un enlace
        if (event.target.tagName === 'A') return;
        
        toggleSpan.classList.toggle('open');
        tareasList.classList.toggle('open');
        
        if (toggleSpan.classList.contains('open')) {
            toggleSpan.textContent = "▼";
        } else {
            toggleSpan.textContent = "▶";
        }
    });
    
    return grupoDiv;
}

/**
 * Crea un elemento DOM para una tarea de bandeja de entrada
 * @param tarea Objeto con la información de la tarea
 * @param dv Objeto dataview
 * @returns Elemento DOM representando la tarea
 */
crearTareaElementInbox(tarea, dv) {
    // Elemento principal
    const tareaDiv = document.createElement("div");
    tareaDiv.className = "tarea-item";
    
    // Indicador visual de procesamiento para tareas inbox
    tareaDiv.style.borderLeft = "4px solid #E67E22"; // Color naranja para mostrar que está en inbox
    
    // Texto de la tarea
    const textoDiv = document.createElement("div");
    textoDiv.className = "tarea-texto";
    
    // Checkbox (visual, no funcional)
    const checkboxSpan = document.createElement("span");
    checkboxSpan.className = "tarea-checkbox";
    checkboxSpan.textContent = "☐";
    checkboxSpan.setAttribute("data-path", tarea.rutaArchivo);
    checkboxSpan.setAttribute("data-line", tarea.lineInfo?.numero?.toString() || "0");
    
    // Hacer el checkbox clicable para navegar a la tarea
    checkboxSpan.addEventListener("click", () => {
        const path = checkboxSpan.getAttribute("data-path");
        const line = parseInt(checkboxSpan.getAttribute("data-line") || "0", 10);
        this.navegarATareaConResaltado(path, line, tarea.textoOriginal || tarea.texto, true);
    });
    
    textoDiv.appendChild(checkboxSpan);
    
    // Contenido de la tarea
    const contenidoSpan = document.createElement("span");
    contenidoSpan.className = "tarea-contenido";
    contenidoSpan.textContent = tarea.texto;
    
    // Hacer el contenido clicable para navegar a la tarea
    contenidoSpan.setAttribute("data-path", tarea.rutaArchivo);
    contenidoSpan.setAttribute("data-line", tarea.lineInfo?.numero?.toString() || "0");
    contenidoSpan.style.cursor = "pointer";
    
    contenidoSpan.addEventListener("click", () => {
        const path = contenidoSpan.getAttribute("data-path");
        const line = parseInt(contenidoSpan.getAttribute("data-line") || "0", 10);
        this.navegarATareaConResaltado(path, line, tarea.textoOriginal || tarea.texto, true);
    });
    
    textoDiv.appendChild(contenidoSpan);
    tareaDiv.appendChild(textoDiv);
    
    // Metadatos
    const metadatosDiv = document.createElement("div");
    metadatosDiv.className = "tarea-metadatos";
    
    // Ubicación (ruta y línea)
    const ubicacionDiv = document.createElement("div");
    ubicacionDiv.className = "tarea-meta-item";
    
    const iconoUbicacion = document.createElement("span");
    iconoUbicacion.className = "meta-icon";
    iconoUbicacion.textContent = "📍";
    ubicacionDiv.appendChild(iconoUbicacion);
    
    const valorUbicacion = document.createElement("span");
    valorUbicacion.className = "ubicacion-valor";
    
    // Si tenemos número de línea, mostrarlo
    if (tarea.lineInfo?.numero) {
        valorUbicacion.textContent = `Línea ${tarea.lineInfo.numero}`;
    } else {
        valorUbicacion.textContent = "Posición desconocida";
    }
    
    ubicacionDiv.appendChild(valorUbicacion);
    metadatosDiv.appendChild(ubicacionDiv);
    
    // Si tiene fechas, mostrarlas
    if (tarea.fechaVencimiento || tarea.fechaScheduled || tarea.fechaStart) {
        const fechasDiv = document.createElement("div");
        fechasDiv.className = "tarea-meta-item";
        
        const iconoFecha = document.createElement("span");
        iconoFecha.className = "meta-icon";
        iconoFecha.textContent = "📅";
        fechasDiv.appendChild(iconoFecha);
        
        const valorFechas = document.createElement("span");
        
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
        
        metadatosDiv.appendChild(fechasDiv);
    }
    
    // Si tiene personas asignadas
    if (tarea.etiquetas.personas?.length > 0) {
        const personasDiv = document.createElement("div");
        personasDiv.className = "tarea-meta-item";
        
        const iconoPersonas = document.createElement("span");
        iconoPersonas.className = "meta-icon";
        iconoPersonas.textContent = "👤";
        personasDiv.appendChild(iconoPersonas);
        
        const valorPersonas = document.createElement("span");
        valorPersonas.textContent = tarea.etiquetas.personas.join(' | ');
        personasDiv.appendChild(valorPersonas);
        
        metadatosDiv.appendChild(personasDiv);
    }
    
    // Si tiene contextos
    if (tarea.etiquetas.contextos?.length > 0) {
        const contextosDiv = document.createElement("div");
        contextosDiv.className = "tarea-meta-item";
        
        const iconoContextos = document.createElement("span");
        iconoContextos.className = "meta-icon";
        iconoContextos.textContent = "🗂️";
        contextosDiv.appendChild(iconoContextos);
        
        const valorContextos = document.createElement("span");
        valorContextos.textContent = tarea.etiquetas.contextos.join(' | ');
        contextosDiv.appendChild(valorContextos);
        
        metadatosDiv.appendChild(contextosDiv);
    }
    
    // Otras etiquetas (excluyendo #inbox)
    const otrasEtiquetas = tarea.etiquetas.otras.filter(tag => tag.toLowerCase() !== '#inbox');
    if (otrasEtiquetas.length > 0) {
        const etiquetasDiv = document.createElement("div");
        etiquetasDiv.className = "tarea-meta-item";
        
        const iconoEtiquetas = document.createElement("span");
        iconoEtiquetas.className = "meta-icon";
        iconoEtiquetas.textContent = "🏷️";
        etiquetasDiv.appendChild(iconoEtiquetas);
        
        const valorEtiquetas = document.createElement("span");
        valorEtiquetas.textContent = otrasEtiquetas.join(' ');
        etiquetasDiv.appendChild(valorEtiquetas);
        
        metadatosDiv.appendChild(etiquetasDiv);
    }
    
    // Añadimos botones de acción para clasificar la tarea
    const accionesDiv = document.createElement("div");
    accionesDiv.className = "tarea-acciones";
    accionesDiv.style.marginTop = "8px";
    accionesDiv.style.display = "flex";
    accionesDiv.style.gap = "8px";
    accionesDiv.style.flexWrap = "wrap";
    
    // Botón para editar/abrir la tarea
    const btnEditar = document.createElement("button");
    btnEditar.className = "tarea-accion-btn";
    btnEditar.textContent = "✏️ Editar";
    btnEditar.style.fontSize = "12px";
    btnEditar.style.padding = "3px 8px";
    btnEditar.style.borderRadius = "4px";
    btnEditar.style.border = "1px solid var(--background-modifier-border)";
    btnEditar.style.backgroundColor = "var(--background-secondary)";
    btnEditar.style.cursor = "pointer";
    
    btnEditar.addEventListener("click", () => {
        const path = tareaDiv.querySelector("[data-path]").getAttribute("data-path");
        const line = parseInt(tareaDiv.querySelector("[data-line]").getAttribute("data-line") || "0", 10);
        this.navegarATareaConResaltado(path, line, tarea.textoOriginal || tarea.texto, true);
    });
    
    accionesDiv.appendChild(btnEditar);
    
    // Añadir botones de acción rápida para clasificar por contextos comunes
    const contextosComunes = ["#cx/trabajo", "#cx/personal", "#cx/hogar"];
    
    contextosComunes.forEach(contexto => {
        const btnContexto = document.createElement("button");
        btnContexto.className = "tarea-accion-btn contexto-btn";
        btnContexto.textContent = contexto;
        btnContexto.style.fontSize = "12px";
        btnContexto.style.padding = "3px 8px";
        btnContexto.style.borderRadius = "4px";
        btnContexto.style.border = "1px solid var(--background-modifier-border)";
        btnContexto.style.backgroundColor = "var(--background-secondary)";
        btnContexto.style.cursor = "pointer";
        
        btnContexto.addEventListener("click", () => {
            // De momento, simplemente abrir la tarea - una implementación más completa podría añadir
            // el contexto directamente a la tarea, pero requeriría más integración con el plugin
            const path = tareaDiv.querySelector("[data-path]").getAttribute("data-path");
            const line = parseInt(tareaDiv.querySelector("[data-line]").getAttribute("data-line") || "0", 10);
            this.navegarATareaConResaltado(path, line, tarea.textoOriginal || tarea.texto, true);
            
            new app.Notice(`Para añadir "${contexto}" a esta tarea, edítala en el archivo abierto.`, 5000);
        });
        
        accionesDiv.appendChild(btnContexto);
    });
    
    metadatosDiv.appendChild(accionesDiv);
    tareaDiv.appendChild(metadatosDiv);
    
    return tareaDiv;
}

  }