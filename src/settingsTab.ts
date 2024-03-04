import { Plugin, PluginSettingTab, Setting } from 'obsidian';

export class PluginMainSettingsTab extends PluginSettingTab {
    plugin: Plugin;

    constructor(plugin: Plugin) {
        super(plugin.app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.createEl('h2', { text: 'Configuración del plugin de Gestión Personal' });

        // Crear contenedores para las pestañas y el contenido de las pestañas
        const tabContainer = containerEl.createDiv({ cls: 'tab-container' });
        const tabContentContainer = containerEl.createDiv({ cls: 'tab-content-container' });

        // Define los títulos de las pestañas
        const tabTitles = ['Activar Módulos', 'Directorios Subsistemas', 'Pestaña 3'];

        // Crear pestañas y contenido específico
        tabTitles.forEach((title, index) => {
            // Crear botones de pestaña
            const tabButton = document.createElement('button');
            tabButton.textContent = title;
            tabButton.classList.add('tab-link');
            tabButton.dataset.tab = `tab${index}`;
            tabButton.onclick = () => this.openTab(`tab${index}`);
            tabContainer.appendChild(tabButton);

            // Crear contenido de pestaña
            const tabContent = document.createElement('div');
            tabContent.id = `tab${index}`;
            tabContent.classList.add('tab-content');
            tabContentContainer.appendChild(tabContent);

            // Inicialmente ocultar el contenido de la pestaña, excepto el primero
            if (index > 0) tabContent.style.display = 'none';

            // Contenido para la primera pestaña
            if (index === 0) {
                
                new Setting(tabContent)
                .setName('Ver Alias en el Status Bar')
                .setDesc('Elige si deseas ver el Aliases de las notas en el Status Bar.')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.moduloAliasStatusBar)
                    .onChange(async (value) => {
                        this.plugin.settings.moduloAliasStatusBar = value;
                        await this.plugin.saveSettings();
                    }));

                    new Setting(tabContent)
                    .setName('Activar Módulo Registro Tiempo')
                    .setDesc('Activa o desactiva el módulo de registro de tiempo.')
                    .addToggle(toggle => toggle
                        .setValue(this.plugin.settings.moduloRegistroTiempo)
                        .onChange(async (value) => {
                            this.plugin.settings.moduloRegistroTiempo = value;
                            await this.plugin.saveSettings();
                        }));

                    new Setting(tabContent)
                    .setName('Activar Módulo Base - Pruebas')
                    .setDesc('Activa o desactiva el módulo de pruebas.')
                    .addToggle(toggle => toggle
                        .setValue(this.plugin.settings.moduloBase)
                        .onChange(async (value) => {
                            this.plugin.settings.moduloBase = value;
                            await this.plugin.saveSettings();
                        }));

            

            }

            // Contenido para la segunda pestaña
            if (index === 1) {
                // Función para manejar el clic en el título del bloque desplegable
                const toggleCollapse = (event) => {
                    const nextElement = event.target.nextElementSibling;
                    if (nextElement.style.display === 'none') {
                        nextElement.style.display = 'block';
                        event.target.innerHTML = '&#9660; ' + event.target.getAttribute('data-title'); // Cambia el icono a "abajo"
                    } else {
                        nextElement.style.display = 'none';
                        event.target.innerHTML = '&#9654; ' + event.target.getAttribute('data-title'); // Cambia el icono a "derecha"
                    }
                };
            

                // Bloque desplegable para "Anotaciones"
                const anotacionesTitle = tabContent.createEl('p', { text: '▶ Subsistema de "Anotaciones"' });
                anotacionesTitle.setAttribute('data-title', 'Subsistema de "Anotaciones"');
                anotacionesTitle.style.cursor = 'pointer';
                const anotacionesContent = tabContent.createDiv();
                anotacionesContent.style.display = 'none'; // Oculta inicialmente los ajustes
                anotacionesTitle.onclick = toggleCollapse;
            
                new Setting(anotacionesContent) // Usamos `blogContent` en lugar de `tabContent`
                    .setName('Carpeta de Anotaciones')
                    .setDesc('Establece la ruta de la carpeta donde se guardarán todas las Anotaciones.')
                    .addText(text => text
                        .setValue(this.plugin.settings.folder_Anotaciones)
                        .onChange(async (value) => {
                            this.plugin.settings.folder_Anotaciones = value;
                            await this.plugin.saveSettings();
                        }));
            
                new Setting(anotacionesContent) // Usamos `blogContent` en lugar de `tabContent`
                    .setName('Indice de Anotaciones')
                    .setDesc('Establece la ruta del índice de las Anotaciones.')
                    .addText(text => text
                        .setValue(this.plugin.settings.indice_Anotaciones)
                        .onChange(async (value) => {
                            this.plugin.settings.indice_Anotaciones = value;
                            await this.plugin.saveSettings();
                        }));

                // Bloque desplegable para "Artículos de Blog"
                const blogTitle = tabContent.createEl('p', { text: '▶ Subsistema de "Artículos de Blog"' });
                blogTitle.setAttribute('data-title', 'Subsistema de "Artículos de Blog"');
                blogTitle.style.cursor = 'pointer';
                const blogContent = tabContent.createDiv();
                blogContent.style.display = 'none'; // Oculta inicialmente los ajustes
                blogTitle.onclick = toggleCollapse;
            
                new Setting(blogContent) // Usamos `blogContent` en lugar de `tabContent`
                    .setName('Carpeta de Artículos del Blog')
                    .setDesc('Establece la ruta de la carpeta donde se guardarán los artículos del blog.')
                    .addText(text => text
                        .setValue(this.plugin.settings.folder_ABlog)
                        .onChange(async (value) => {
                            this.plugin.settings.folder_ABlog = value;
                            await this.plugin.saveSettings();
                        }));
            
                new Setting(blogContent) // Usamos `blogContent` en lugar de `tabContent`
                    .setName('Indice de Artículos del Blog')
                    .setDesc('Establece la ruta del índice de los artículos del blog.')
                    .addText(text => text
                        .setValue(this.plugin.settings.indice_ABlog)
                        .onChange(async (value) => {
                            this.plugin.settings.indice_ABlog = value;
                            await this.plugin.saveSettings();
                        }));
            
                // Bloque desplegable para "Desarrollos y códigos"
                const desarrollosTitle = tabContent.createEl('p', { text: '▶ Subsistema de "Desarrollos y códigos"' });
                desarrollosTitle.setAttribute('data-title', 'Subsistema de "Desarrollos y códigos"');
                desarrollosTitle.style.cursor = 'pointer';
                const desarrollosContent = tabContent.createDiv();
                desarrollosContent.style.display = 'none'; // Oculta inicialmente los ajustes
                desarrollosTitle.onclick = toggleCollapse;

                // Configuración para Carpeta de Desarrollos y Códigos
                new Setting(desarrollosContent) // Usamos `desarrollosContent` en lugar de `tabContent`
                    .setName('Carpeta de Desarrollos y Códigos')
                    .setDesc('Establece la ruta de la carpeta donde se guardarán los desarrollos y códigos.')
                    .addText(text => text
                        .setValue(this.plugin.settings.folder_Desarrollos)
                        .onChange(async (value) => {
                            this.plugin.settings.folder_Desarrollos = value;
                            await this.plugin.saveSettings();
                        }));

                // Configuración para Índice de Desarrollos y Códigos
                new Setting(desarrollosContent) // Usamos `desarrollosContent` en lugar de `tabContent`
                    .setName('Índice de Desarrollos y Códigos')
                    .setDesc('Establece la ruta del índice de los desarrollos y códigos.')
                    .addText(text => text
                        .setValue(this.plugin.settings.indice_Desarrollos)
                        .onChange(async (value) => {
                            this.plugin.settings.indice_Desarrollos = value;
                            await this.plugin.saveSettings();
                        }));

                // Bloque desplegable para "Estudio"
                const estudioTitle = tabContent.createEl('p', { text: '▶ Subsistema de "Estudio"' });
                estudioTitle.setAttribute('data-title', 'Subsistema de "Estudio"');
                estudioTitle.style.cursor = 'pointer';
                const estudioContent = tabContent.createDiv();
                estudioContent.style.display = 'none';
                estudioTitle.onclick = toggleCollapse;

                new Setting(estudioContent)
                    .setName('Carpeta de Temas de Estudio')
                    .setDesc('Establece la ruta de la carpeta donde se guardarán los temas de estudio.')
                    .addText(text => text
                        .setValue(this.plugin.settings.folder_Estudio)
                        .onChange(async (value) => {
                            this.plugin.settings.folder_Estudio = value;
                            await this.plugin.saveSettings();
                        }));

                new Setting(estudioContent)
                    .setName('Índice de Estudio')
                    .setDesc('Establece la ruta del índice de los temas de estudio.')
                    .addText(text => text
                        .setValue(this.plugin.settings.indice_Estudio)
                        .onChange(async (value) => {
                            this.plugin.settings.indice_Estudio = value;
                            await this.plugin.saveSettings();
                        }));

                // Bloque desplegable para "GTD"
                const gtdTitle = tabContent.createEl('p', { text: '▶ Subsistema de "GTD"' });
                gtdTitle.setAttribute('data-title', 'Subsistema de "GTD"');
                gtdTitle.style.cursor = 'pointer';
                const gtdContent = tabContent.createDiv();
                gtdContent.style.display = 'none';
                gtdTitle.onclick = toggleCollapse;

                // Proyectos GTD
                new Setting(gtdContent)
                    .setName('Carpeta de Proyectos GTD')
                    .setDesc('Establece la ruta de la carpeta para proyectos GTD.')
                    .addText(text => text
                        .setValue(this.plugin.settings.folder_ProyectosGTD)
                        .onChange(async (value) => {
                            this.plugin.settings.folder_ProyectosGTD = value;
                            await this.plugin.saveSettings();
                        }));

                new Setting(gtdContent)
                    .setName('Índice de Proyectos GTD')
                    .setDesc('Establece la ruta del índice para proyectos GTD.')
                    .addText(text => text
                        .setValue(this.plugin.settings.indice_ProyectosGTD)
                        .onChange(async (value) => {
                            this.plugin.settings.indice_ProyectosGTD = value;
                            await this.plugin.saveSettings();
                        }));

                // Revisión Semanal
                new Setting(gtdContent)
                    .setName('Carpeta de Revisiones Semanales GTD')
                    .setDesc('Establece la ruta de la carpeta para las revisiones semanales GTD.')
                    .addText(text => text
                        .setValue(this.plugin.settings.folder_RSGTD)
                        .onChange(async (value) => {
                            this.plugin.settings.folder_RSGTD = value;
                            await this.plugin.saveSettings();
                        }));

                new Setting(gtdContent)
                    .setName('Índice de Revisiones Semanales GTD')
                    .setDesc('Establece la ruta del índice para las revisiones semanales GTD.')
                    .addText(text => text
                        .setValue(this.plugin.settings.indice_RSGTD)
                        .onChange(async (value) => {
                            this.plugin.settings.indice_RSGTD = value;
                            await this.plugin.saveSettings();
                        }));

                // Bloque desplegable para "Lectura"
                const lecturaTitle = tabContent.createEl('p', { text: '▶ Subsistema de "Lectura"' });
                lecturaTitle.setAttribute('data-title', 'Subsistema de "Lectura"');
                lecturaTitle.style.cursor = 'pointer';
                const lecturaContent = tabContent.createDiv();
                lecturaContent.style.display = 'none';
                lecturaTitle.onclick = toggleCollapse;

                // Sesiones de Lectura
                new Setting(lecturaContent)
                    .setName('Carpeta de Sesiones de Lectura')
                    .setDesc('Establece la ruta de la carpeta para las sesiones de lectura.')
                    .addText(text => text
                        .setValue(this.plugin.settings.folder_LecturaSesiones)
                        .onChange(async (value) => {
                            this.plugin.settings.folder_LecturaSesiones = value;
                            await this.plugin.saveSettings();
                        }));

                new Setting(lecturaContent)
                    .setName('Índice de Sesiones de Lectura')
                    .setDesc('Establece la ruta del índice para las sesiones de lectura.')
                    .addText(text => text
                        .setValue(this.plugin.settings.indice_LecturaSesiones)
                        .onChange(async (value) => {
                            this.plugin.settings.indice_LecturaSesiones = value;
                            await this.plugin.saveSettings();
                        }));

                // Libros y Resúmenes
                new Setting(lecturaContent)
                    .setName('Carpeta de Resúmenes de Libros')
                    .setDesc('Establece la ruta de la carpeta para los resúmenes de libros.')
                    .addText(text => text
                        .setValue(this.plugin.settings.folder_LecturaResumenes)
                        .onChange(async (value) => {
                            this.plugin.settings.folder_LecturaResumenes = value;
                            await this.plugin.saveSettings();
                        }));

                new Setting(lecturaContent)
                    .setName('Índice de Resúmenes de Libros')
                    .setDesc('Establece la ruta del índice para los resúmenes de libros.')
                    .addText(text => text
                        .setValue(this.plugin.settings.indice_LecturaResumenes)
                        .onChange(async (value) => {
                            this.plugin.settings.indice_LecturaResumenes = value;
                            await this.plugin.saveSettings();
                        }));

                        // Asumiendo que estamos dentro de if (index === 1) { ... }

                // Bloque desplegable para "Mentorías"
                const mentoriasTitle = tabContent.createEl('p', { text: '▶ Subsistema de "Mentorías"' });
                mentoriasTitle.setAttribute('data-title', 'Subsistema de "Mentorías"');
                mentoriasTitle.style.cursor = 'pointer';
                const mentoriasContent = tabContent.createDiv();
                mentoriasContent.style.display = 'none';
                mentoriasTitle.onclick = toggleCollapse;

                new Setting(mentoriasContent)
                    .setName('Carpeta de Sesiones de Mentoría')
                    .setDesc('Establece la ruta de la carpeta donde se guardarán las sesiones de mentoría.')
                    .addText(text => text
                        .setValue(this.plugin.settings.folder_Mentorias)
                        .onChange(async (value) => {
                            this.plugin.settings.folder_Mentorias = value;
                            await this.plugin.saveSettings();
                        }));

                new Setting(mentoriasContent)
                    .setName('Índice de Mentorías')
                    .setDesc('Establece la ruta del índice de las sesiones de mentoría.')
                    .addText(text => text
                        .setValue(this.plugin.settings.indice_Mentorias)
                        .onChange(async (value) => {
                            this.plugin.settings.indice_Mentorias = value;
                            await this.plugin.saveSettings();
                        }));

                // Repite el patrón para "Mercado", "Módulos Sistema Gestión", y "Pagos"

                // Bloque desplegable para "Mercado"
                const mercadoTitle = tabContent.createEl('p', { text: '▶ Subsistema de "Mercado"' });
                mercadoTitle.setAttribute('data-title', 'Subsistema de "Mercado"');
                mercadoTitle.style.cursor = 'pointer';
                const mercadoContent = tabContent.createDiv();
                mercadoContent.style.display = 'none';
                mercadoTitle.onclick = toggleCollapse;

                // Agrega aquí las configuraciones específicas para "Mercado", siguiendo el patrón de las mentorías
                new Setting(mercadoContent)
                    .setName('Carpeta de Listados de Mercado')
                    .setDesc('Establece la ruta de la carpeta donde se guardarán las listas de mercado.')
                    .addText(text => text
                        .setValue(this.plugin.settings.folder_Mercado)
                        .onChange(async (value) => {
                            this.plugin.settings.folder_Mercado = value;
                            await this.plugin.saveSettings();
                        }));

                new Setting(mercadoContent)
                    .setName('Índice de listados de mercado')
                    .setDesc('Establece la ruta del índice de los listados de mercado.')
                    .addText(text => text
                        .setValue(this.plugin.settings.indice_Mercado)
                        .onChange(async (value) => {
                            this.plugin.settings.indice_Mercado = value;
                            await this.plugin.saveSettings();
                        }));
                
                // Bloque desplegable para "Módulos Sistema Gestión"
                const modulosTitle = tabContent.createEl('p', { text: '▶ Subsistema de "Módulos Sistema Gestión"' });
                modulosTitle.setAttribute('data-title', 'Subsistema de "Módulos Sistema Gestión"');
                modulosTitle.style.cursor = 'pointer';
                const modulosContent = tabContent.createDiv();
                modulosContent.style.display = 'none';
                modulosTitle.onclick = toggleCollapse;

                // Agrega aquí las configuraciones específicas para "Módulos Sistema Gestión"

                new Setting(modulosContent)
                    .setName('Carpeta de Modulos del Sistema de Gestion')
                    .setDesc('Establece la ruta de la carpeta donde se guardarán los módulos del Sistema de Gestión.')
                    .addText(text => text
                        .setValue(this.plugin.settings.folder_ModulosSistema)
                        .onChange(async (value) => {
                            this.plugin.settings.folder_ModulosSistema = value;
                            await this.plugin.saveSettings();
                        }));

                new Setting(modulosContent)
                    .setName('Índice de los Modulos del sistema de Gestion')
                    .setDesc('Establece la ruta del índice de los Módulos del sistema de Gestión.')
                    .addText(text => text
                        .setValue(this.plugin.settings.indice_ModulosSistema)
                        .onChange(async (value) => {
                            this.plugin.settings.indice_ModulosSistema = value;
                            await this.plugin.saveSettings();
                        }));
                // Bloque desplegable para "Pagos"
                const pagosTitle = tabContent.createEl('p', { text: '▶ Subsistema de "Pagos"' });
                pagosTitle.setAttribute('data-title', 'Subsistema de "Pagos"');
                pagosTitle.style.cursor = 'pointer';
                const pagosContent = tabContent.createDiv();
                pagosContent.style.display = 'none';
                pagosTitle.onclick = toggleCollapse;

                // Agrega aquí las configuraciones específicas para "Pagos"
                new Setting(pagosContent)
                    .setName('Carpeta de Modulos del Sistema de Pagos')
                    .setDesc('Establece la ruta de la carpeta donde se guardarán los comprobantes de pagos.')
                    .addText(text => text
                        .setValue(this.plugin.settings.folder_Pagos)
                        .onChange(async (value) => {
                            this.plugin.settings.folder_Pagos = value;
                            await this.plugin.saveSettings();
                        }));

                new Setting(pagosContent)
                    .setName('Índice de Pagos')
                    .setDesc('Establece la ruta del índice de Pagos.')
                    .addText(text => text
                        .setValue(this.plugin.settings.indice_Pagos)
                        .onChange(async (value) => {
                            this.plugin.settings.indice_Pagos = value;
                            await this.plugin.saveSettings();
                        }));

                       
                // Bloque desplegable para "Presentaciones"
                const presentacionesTitle = tabContent.createEl('p', { text: '▶ Subsistema de "Presentaciones"' });
                presentacionesTitle.setAttribute('data-title', 'Subsistema de "Presentaciones"');
                presentacionesTitle.style.cursor = 'pointer';
                const presentacionesContent = tabContent.createDiv();
                presentacionesContent.style.display = 'none'; // Inicialmente oculto
                presentacionesTitle.onclick = toggleCollapse;

                new Setting(presentacionesContent)
                    .setName('Carpeta de Notas de Presentaciones')
                    .setDesc('Establece la ruta de la carpeta donde se guardarán las notas de presentaciones.')
                    .addText(text => text
                        .setValue(this.plugin.settings.folder_Presentaciones)
                        .onChange(async (value) => {
                            this.plugin.settings.folder_Presentaciones = value;
                            await this.plugin.saveSettings();
                        }));

                new Setting(presentacionesContent)
                    .setName('Índice de Presentaciones')
                    .setDesc('Establece la ruta del índice de presentaciones.')
                    .addText(text => text
                        .setValue(this.plugin.settings.indice_Presentaciones)
                        .onChange(async (value) => {
                            this.plugin.settings.indice_Presentaciones = value;
                            await this.plugin.saveSettings();
                        }));

                // Bloque desplegable para "Proyectos de Q"
                const proyectosQTitle = tabContent.createEl('p', { text: '▶ Subsistema de "Proyectos de Q"' });
                proyectosQTitle.setAttribute('data-title', 'Subsistema de "Proyectos de Q"');
                proyectosQTitle.style.cursor = 'pointer';
                const proyectosQContent = tabContent.createDiv();
                proyectosQContent.style.display = 'none'; // Inicialmente oculto
                proyectosQTitle.onclick = toggleCollapse;

                new Setting(proyectosQContent)
                    .setName('Carpeta de Proyectos de Q')
                    .setDesc('Establece la ruta de la carpeta donde se guardarán los proyectos de Q.')
                    .addText(text => text
                        .setValue(this.plugin.settings.folder_ProyectosQ)
                        .onChange(async (value) => {
                            this.plugin.settings.folder_ProyectosQ = value;
                            await this.plugin.saveSettings();
                        }));

                new Setting(proyectosQContent)
                    .setName('Índice de Proyectos de Q')
                    .setDesc('Establece la ruta del índice de proyectos de Q.')
                    .addText(text => text
                        .setValue(this.plugin.settings.indice_ProyectosQ)
                        .onChange(async (value) => {
                            this.plugin.settings.indice_ProyectosQ = value;
                            await this.plugin.saveSettings();
                        }));

                // Asegúrate de que la función toggleCollapse está definida como se indicó anteriormente.

                // Bloque desplegable para "Publicaciones"
                const publicacionesTitle = tabContent.createEl('p', { text: '▶ Subsistema de "Publicaciones"' });
                publicacionesTitle.setAttribute('data-title', 'Subsistema de "Publicaciones"');
                publicacionesTitle.style.cursor = 'pointer';
                const publicacionesContent = tabContent.createDiv();
                publicacionesContent.style.display = 'none'; // Inicialmente oculto
                publicacionesTitle.onclick = toggleCollapse;

                new Setting(publicacionesContent)
                    .setName('Carpeta de Piezas de Publicaciones')
                    .setDesc('Establece la ruta de la carpeta donde se guardarán las piezas de publicaciones.')
                    .addText(text => text
                        .setValue(this.plugin.settings.folder_Publicaciones)
                        .onChange(async (value) => {
                            this.plugin.settings.folder_Publicaciones = value;
                            await this.plugin.saveSettings();
                        }));

                new Setting(publicacionesContent)
                    .setName('Índice de Publicaciones')
                    .setDesc('Establece la ruta del índice de publicaciones.')
                    .addText(text => text
                        .setValue(this.plugin.settings.indice_Publicaciones)
                        .onChange(async (value) => {
                            this.plugin.settings.indice_Publicaciones = value;
                            await this.plugin.saveSettings();
                        }));

                // Bloque desplegable para "Recetas"
                const recetasTitle = tabContent.createEl('p', { text: '▶ Subsistema de "Recetas"' });
                recetasTitle.setAttribute('data-title', 'Subsistema de "Recetas"');
                recetasTitle.style.cursor = 'pointer';
                const recetasContent = tabContent.createDiv();
                recetasContent.style.display = 'none'; // Inicialmente oculto
                recetasTitle.onclick = toggleCollapse;

                new Setting(recetasContent)
                    .setName('Carpeta de Recetas')
                    .setDesc('Establece la ruta de la carpeta donde se guardarán las recetas.')
                    .addText(text => text
                        .setValue(this.plugin.settings.folder_Recetas)
                        .onChange(async (value) => {
                            this.plugin.settings.folder_Recetas = value;
                            await this.plugin.saveSettings();
                        }));

                new Setting(recetasContent)
                    .setName('Índice de Recetas')
                    .setDesc('Establece la ruta del índice de recetas.')
                    .addText(text => text
                        .setValue(this.plugin.settings.indice_Recetas)
                        .onChange(async (value) => {
                            this.plugin.settings.indice_Recetas = value;
                            await this.plugin.saveSettings();
                        }));

                // Bloque desplegable para "Recursos Recurrentes"
                const recursosRecurrentesTitle = tabContent.createEl('p', { text: '▶ Subsistema de "Recursos Recurrentes"' });
                recursosRecurrentesTitle.setAttribute('data-title', 'Subsistema de "Recursos Recurrentes"');
                recursosRecurrentesTitle.style.cursor = 'pointer';
                const recursosRecurrentesContent = tabContent.createDiv();
                recursosRecurrentesContent.style.display = 'none'; // Inicialmente oculto
                recursosRecurrentesTitle.onclick = toggleCollapse;

                new Setting(recursosRecurrentesContent)
                    .setName('Carpeta de Recursos Recurrentes')
                    .setDesc('Establece la ruta de la carpeta donde se guardarán los recursos recurrentes.')
                    .addText(text => text
                        .setValue(this.plugin.settings.folder_RecursosRecurrentes)
                        .onChange(async (value) => {
                            this.plugin.settings.folder_RecursosRecurrentes = value;
                            await this.plugin.saveSettings();
                        }));

                new Setting(recursosRecurrentesContent)
                    .setName('Índice de Recursos Recurrentes')
                    .setDesc('Establece la ruta del índice de recursos recurrentes.')
                    .addText(text => text
                        .setValue(this.plugin.settings.indice_RecursosRecurrentes)
                        .onChange(async (value) => {
                            this.plugin.settings.indice_RecursosRecurrentes = value;
                            await this.plugin.saveSettings();
                        }));

                // Bloque desplegable para "Registro Tiempo"
                const registroTiempoTitle = tabContent.createEl('p', { text: '▶ Subsistema de "Registro Tiempo"' });
                registroTiempoTitle.setAttribute('data-title', 'Subsistema de "Registro Tiempo"');
                registroTiempoTitle.style.cursor = 'pointer';
                const registroTiempoContent = tabContent.createDiv();
                registroTiempoContent.style.display = 'none'; // Inicialmente oculto
                registroTiempoTitle.onclick = toggleCollapse;

                new Setting(registroTiempoContent)
                    .setName('Carpeta de Registros de Tiempo')
                    .setDesc('Establece la ruta de la carpeta donde se guardarán los registros de tiempo.')
                    .addText(text => text
                        .setValue(this.plugin.settings.folder_RegistroTiempo)
                        .onChange(async (value) => {
                            this.plugin.settings.folder_RegistroTiempo = value;
                            await this.plugin.saveSettings();
                        }));

                new Setting(registroTiempoContent)
                    .setName('Índice de Registro de Tiempo')
                    .setDesc('Establece la ruta del índice de registros de tiempo.')
                    .addText(text => text
                        .setValue(this.plugin.settings.indice_RegistroTiempo)
                        .onChange(async (value) => {
                            this.plugin.settings.indice_RegistroTiempo = value;
                            await this.plugin.saveSettings();
                        }));


                
                }
            
            



            // Contenido para la tercera pestaña
            if (index === 2) {
                const dateLabel = tabContent.createEl('label');
                dateLabel.textContent = 'Fecha';
                const dateInput = tabContent.createEl('input');
                dateInput.type = 'datetime-local';
                
            }
        });

        // Añadir estilos CSS para espaciado y organización
        containerEl.createEl('style', {
            text: `
                .tab-content { display: none; padding-top: 20px; } // Añadido padding-top para el espacio
                .tab-content.active { display: block; }
                .tab-link { cursor: pointer; padding: 5px 10px; margin-right: 5px; background: #f0f0f0; border: 1px solid #ddd; border-radius: 5px; }
                .tab-link.active { background: #e0e0e0; }
                .setting-item { margin-bottom: 10px; }
            `
        });
        

        // Función para cambiar la pestaña activa
        this.openTab = (tabName) => {
            document.querySelectorAll('.tab-content').forEach(content => {
                content.style.display = 'none';
                content.classList.remove('active');
            });
            document.querySelectorAll('.tab-link').forEach(link => {
                link.classList.remove('active');
            });
            const activeTabContent = document.getElementById(tabName);
            const activeTabLink = document.querySelector(`[data-tab="${tabName}"]`);
            if (activeTabContent) activeTabContent.style.display = 'block';
            if (activeTabLink) activeTabLink.classList.add('active');
        }

        // Abrir la primera pestaña por defecto
        this.openTab('tab0');
    }
}
