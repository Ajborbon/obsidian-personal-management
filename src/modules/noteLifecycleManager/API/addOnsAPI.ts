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
  
// Función para generar el texto de relaciones de una nota
// Añadir esta función a la clase addOnsAPI en src/modules/noteLifecycleManager/API/addOnsAPI.ts
// En src/modules/noteLifecycleManager/API/addOnsAPI.ts

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
 * Genera un árbol de referencias a la nota actual de forma recursiva
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
    const contenedor = dv.el("div", "", { cls: "backlinks-tree" });
    
    if (profundidadActual === 0) {
        // Añadir título personalizado solo en la raíz
        const tipoNota = paginaActual.typeName || "Nota";
        const alias = paginaActual.file.aliases && paginaActual.file.aliases.length > 0 
            ? paginaActual.file.aliases[0] 
            : (paginaActual.titulo || paginaActual.file.name);
            
        const titulo = dv.el("h3", `Referencias a ${tipoNota} "${alias}"`, { cls: "backlinks-tree-title" });
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
        const errorMsg = dv.el("p", "Error al obtener páginas de Dataview", { cls: "backlinks-tree-error" });
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
        const errorMsg = dv.el("p", "Error al procesar referencias", { cls: "backlinks-tree-error" });
        contenedor.appendChild(errorMsg);
        return contenedor;
    }
    
    // Si no hay referencias, mostrar mensaje
    if (referenciasDirectas.length === 0) {
        if (profundidadActual === 0) {
            const mensaje = dv.el("p", "No se encontraron referencias a esta nota", { cls: "backlinks-tree-empty" });
            contenedor.appendChild(mensaje);
        }
        return contenedor;
    }
    
    // Crear lista para mostrar referencias
    const lista = dv.el("ul", "", { cls: `backlinks-tree-level-${profundidadActual}` });
    
    // Añadir cada referencia a la lista
    for (const referencia of referenciasDirectas) {
        try {
            // Evitar ciclos
            if (visitadas.has(referencia.file.path)) {
                continue;
            }
            
            // Crear elemento de lista
            const item = dv.el("li", "", { cls: "backlinks-tree-item" });
            
            // Añadir tipo y enlace
            const tipo = referencia.typeName || "Nota";
            const tipoEl = dv.el("span", `[${tipo}] `, { cls: "backlinks-tree-type" });
            item.appendChild(tipoEl);
            
            // Determinar el texto para mostrar en el enlace
            let nombreMostrado = "";
            try {
                nombreMostrado = referencia.file.aliases && referencia.file.aliases.length > 0
                    ? referencia.file.aliases[0] 
                    : (referencia.titulo || referencia.file.name);
            } catch (e) {
                nombreMostrado = referencia.file.name || "Sin nombre";
            }
            
            // Crear enlace usando el método correcto para enlaces clicables
            try {
                // Primero intentamos con fileLink
                const enlace = dv.el("a", nombreMostrado, {
                    attr: {
                        href: referencia.file.path,
                        "data-href": referencia.file.path,
                        class: "internal-link"
                    }
                });
                
                // Asegurar que el enlace es clicable
                enlace.addEventListener("click", (event) => {
                    event.preventDefault();
                    const target = event.target;
                    const href = target.getAttribute("data-href");
                    if (href) {
                        // Intenta abrir con la API de Obsidian
                        app.workspace.openLinkText(href, "", false);
                    }
                });
                
                item.appendChild(enlace);
            } catch (e) {
                console.error("Error al crear enlace con método primario:", e);
                
                // Plan B: usar createEl de Obsidian directamente
                try {
                    const enlace = document.createElement("a");
                    enlace.textContent = nombreMostrado;
                    enlace.href = `obsidian://open?vault=${encodeURIComponent(app.vault.getName())}&file=${encodeURIComponent(referencia.file.path)}`;
                    enlace.classList.add("internal-link");
                    item.appendChild(enlace);
                } catch (e2) {
                    console.error("Error al crear enlace con método alternativo:", e2);
                    // Fallback final: texto plano
                    const textoPlano = dv.el("span", nombreMostrado);
                    item.appendChild(textoPlano);
                }
            }
            
            // Buscar recursivamente referencias a esta referencia
            try {
                // Paso el set de visitadas como copia para no afectar otros niveles
                const nuevoVisitadas = new Set([...visitadas]);
                nuevoVisitadas.add(referencia.file.path);
                
                const subReferencias = this.generarArbolReferencias(
                    referencia, dv, profundidadMaxima, 
                    nuevoVisitadas, profundidadActual + 1
                );
                
                // Verificar que el resultado es un nodo DOM válido
                if (subReferencias && subReferencias.nodeType) {
                    // Verificar si tiene contenido útil
                    if (subReferencias.children && subReferencias.children.length > 0) {
                        // Verificar si hay más que solo el título
                        const tieneContenidoUtil = subReferencias.children.length > 1 || 
                            (subReferencias.children.length === 1 && 
                             !subReferencias.children[0].classList.contains("backlinks-tree-title"));
                        
                        if (tieneContenidoUtil) {
                            item.appendChild(subReferencias);
                        }
                    }
                }
            } catch (e) {
                console.error("Error en la recursión para " + referencia.file.path, e);
                const errorMsg = dv.el("span", " (Error al obtener subreferencias)", { cls: "backlinks-tree-error" });
                item.appendChild(errorMsg);
            }
            
            // Añadir el item a la lista
            lista.appendChild(item);
            
        } catch (e) {
            console.error("Error al procesar referencia:", e);
            // Continuar con la siguiente referencia
            continue;
        }
    }
    
    // Añadir la lista al contenedor
    try {
        if (lista && lista.nodeType) {
            contenedor.appendChild(lista);
        }
    } catch (e) {
        console.error("Error al añadir lista al contenedor:", e);
        const errorMsg = dv.el("p", "Error al generar estructura de árbol", { cls: "backlinks-tree-error" });
        contenedor.appendChild(errorMsg);
    }
    
    return contenedor;
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
            const mensaje = dv.el("p", "No se encontró frontmatter en esta nota.", { cls: "notion-links-message" });
            contenedor.appendChild(mensaje);
            return contenedor;
        }
        
        // Obtener el valor de typeName si existe
        const typeName = meta.typeName || "Elemento";
        
        // Filtrar las claves que comiencen con "link-" y sean URLs válidas
        const linkFields = Object.entries(meta)
            .filter(([key, value]) => key.startsWith("link-") && typeof value === "string" && value.startsWith("http"))
            .map(([key, value]) => ({
                url: value
            }));
        
        // Renderizar el mensaje si se encuentra al menos un enlace válido
        if (linkFields.length > 0) {
            linkFields.forEach(field => {
                // Crear un párrafo para cada enlace
                const parrafo = document.createElement("p");
                parrafo.classList.add("notion-link-item");
                
                // Crear texto
                parrafo.textContent = `${typeName} sincronizado en Notion en `;
                
                // Crear enlace
                const enlace = document.createElement("a");
                enlace.href = field.url;
                enlace.textContent = field.url;
                enlace.target = "_blank"; // Abrir en nueva pestaña
                enlace.rel = "noopener noreferrer"; // Seguridad para enlaces externos
                
                // Añadir el enlace al párrafo
                parrafo.appendChild(enlace);
                
                // Añadir el párrafo al contenedor
                contenedor.appendChild(parrafo);
            });
        } else {
            const mensaje = dv.el("p", "No se encontraron enlaces sincronizados en Notion.", { cls: "notion-links-message" });
            contenedor.appendChild(mensaje);
        }
    } catch (error) {
        console.error("Error al procesar enlaces sincronizados:", error);
        const errorMsg = dv.el("p", "Error al procesar enlaces sincronizados. Consulta la consola para más detalles.", { cls: "notion-links-error" });
        contenedor.appendChild(errorMsg);
    }
    
    return contenedor;
}

  }