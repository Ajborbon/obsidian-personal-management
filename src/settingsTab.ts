import { Plugin, PluginSettingTab, Setting, TextComponent, ToggleComponent } from 'obsidian'; // Import specific components
import type ManagementPlugin from './main'; // Import the specific plugin class type

export class PluginMainSettingsTab extends PluginSettingTab {
    plugin: ManagementPlugin; // Use the specific plugin class type

    constructor(plugin: ManagementPlugin) { // Use the specific plugin class type
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
                .addToggle((toggle: ToggleComponent) => toggle // Correct type
                    .setValue(this.plugin.settings!.moduloAliasStatusBar) // Add assertion
                    .onChange(async (value: boolean) => { // Use boolean type
                        this.plugin.settings!.moduloAliasStatusBar = value; // Add assertion
                        await this.plugin.saveSettings();
                    }));

                    new Setting(tabContent)
                    .setName('Activar Módulo Registro Tiempo')
                    .setDesc('Activa o desactiva el módulo de registro de tiempo.')
                    .addToggle((toggle: ToggleComponent) => toggle // Correct type
                        .setValue(this.plugin.settings!.moduloRegistroTiempo) // Add assertion
                        .onChange(async (value: boolean) => { // Use boolean type
                            this.plugin.settings!.moduloRegistroTiempo = value; // Add assertion
                            await this.plugin.saveSettings();
                        }));

                    new Setting(tabContent)
                    .setName('Activar Módulo Base - Pruebas')
                    .setDesc('Activa o desactiva el módulo de pruebas.')
                    .addToggle((toggle: ToggleComponent) => toggle // Correct type
                        .setValue(this.plugin.settings!.moduloBase) // Add assertion
                        .onChange(async (value: boolean) => { // Use boolean type
                            this.plugin.settings!.moduloBase = value; // Add assertion
                            await this.plugin.saveSettings();
                        }));

                    // Add toggle for ModuloGTDv2
                    new Setting(tabContent)
                        .setName('Activar Módulo GTD v2 (Jerárquico)')
                        .setDesc('Activa o desactiva el módulo de visualización jerárquica GTD v2.')
                        .addToggle((toggle: ToggleComponent) => toggle // Correct type
                            .setValue(this.plugin.settings!.moduloGTDv2) // Add assertion
                            .onChange(async (value: boolean) => { // Use boolean type
                                this.plugin.settings!.moduloGTDv2 = value; // Add assertion
                                await this.plugin.saveSettings();
                                // Note: No explicit activate/deactivate needed yet as it only controls command availability
                            }));


                    containerEl.createEl('h3', {text: 'Navegador de Tareas'});

                    new Setting(containerEl)
                    .setName('Task Execution Navigator')
                    .setDesc('Permite navegar rápidamente a tareas en ejecución')
                    .addToggle((toggle: ToggleComponent) => toggle // Correct type
                        .setValue(this.plugin.settings!.taskExecutionNavigatorModule) // Add assertion
                        .onChange(async (value: boolean) => { // Use boolean type
                            this.plugin.settings!.taskExecutionNavigatorModule = value; // Add assertion
                            if (value) {
                                this.plugin.taskExecutionNavigatorModule?.activate();
                            } else {
                                this.plugin.taskExecutionNavigatorModule?.deactivate();
                            }
                            await this.plugin.saveSettings();
                        }));

            

            }

            // Contenido para la segunda pestaña
            if (index === 1) {
                // Función para manejar el clic en el título del bloque desplegable
                const toggleCollapse = (event: MouseEvent) => { // Use MouseEvent type
                    const target = event.target as HTMLElement; // Cast target
                    const nextElement = target.nextElementSibling as HTMLElement | null; // Cast next element
                    if (nextElement) { // Check if nextElement exists
                        if (nextElement.style.display === 'none') {
                            nextElement.style.display = 'block';
                            target.innerHTML = '&#9660; ' + (target.getAttribute('data-title') ?? ''); // Cambia el icono a "abajo" + null check
                        } else {
                            nextElement.style.display = 'none';
                            target.innerHTML = '&#9654; ' + (target.getAttribute('data-title') ?? ''); // Cambia el icono a "derecha" + null check
                        }
                    }
                };
            

                // Bloque desplegable para "Anotaciones"
                const anotacionesTitle = tabContent.createEl('p', { text: '▶ Subsistema de "Anotaciones"' });
                anotacionesTitle.setAttribute('data-title', 'Subsistema de "Anotaciones"');
                anotacionesTitle.style.cursor = 'pointer';
                const anotacionesContent = tabContent.createDiv();
                anotacionesContent.style.display = 'none'; // Oculta inicialmente los ajustes
                anotacionesTitle.onclick = toggleCollapse;
            
                new Setting(anotacionesContent) // Usamos `anotacionesContent`
                    .setName('Carpeta de Anotaciones')
                    .setDesc('Establece la ruta de la carpeta donde se guardarán todas las Anotaciones.')
                    .addText((text: TextComponent) => text // Correct type
                        .setValue(this.plugin.settings!.folder_Anotaciones) // Add assertion
                        .onChange(async (value: string) => { // Use string type
                            this.plugin.settings!.folder_Anotaciones = value; // Add assertion
                            await this.plugin.saveSettings();
                        }));
            
                new Setting(anotacionesContent) // Usamos `anotacionesContent`
                    .setName('Indice de Anotaciones')
                    .setDesc('Establece la ruta del índice de las Anotaciones.')
                    .addText((text: TextComponent) => text // Correct type
                        .setValue(this.plugin.settings!.indice_Anotaciones) // Add assertion
                        .onChange(async (value: string) => { // Use string type
                            this.plugin.settings!.indice_Anotaciones = value; // Add assertion
                            await this.plugin.saveSettings();
                        }));

                // Añadir un bloque desplegable para "Campañas" en el método display()
                // Esto iría en la sección donde están los demás subsistemas

                const campañasTitle = tabContent.createEl('p', { text: '▶ Subsistema de "Campañas"' });
                campañasTitle.setAttribute('data-title', 'Subsistema de "Campañas"');
                campañasTitle.style.cursor = 'pointer';
                const campañasContent = tabContent.createDiv();
                campañasContent.style.display = 'none'; // Inicialmente oculto
                campañasTitle.onclick = toggleCollapse;

                new Setting(campañasContent)
                    .setName('Carpeta de Campañas')
                    .setDesc('Establece la ruta de la carpeta donde se guardarán las campañas.')
                    .addText((text: TextComponent) => text // Correct type
                        .setValue(this.plugin.settings!.folder_Campaña) // Correct typo + Add assertion
                        .onChange(async (value: string) => { // Use string type
                            this.plugin.settings!.folder_Campaña = value; // Correct typo + Add assertion
                            await this.plugin.saveSettings();
                        }));

                new Setting(campañasContent)
                    .setName('Índice de Campañas')
                    .setDesc('Establece la ruta del índice de campañas.')
                    .addText((text: TextComponent) => text // Correct type
                        .setValue(this.plugin.settings!.indice_Campaña) // Correct typo + Add assertion
                        .onChange(async (value: string) => { // Use string type
                            this.plugin.settings!.indice_Campaña = value; // Correct typo + Add assertion
                            await this.plugin.saveSettings();
                        }));

                // Bloque desplegable para "Artículos de Blog"
                const blogTitle = tabContent.createEl('p', { text: '▶ Subsistema de "Artículos de Blog"' });
                blogTitle.setAttribute('data-title', 'Subsistema de "Artículos de Blog"');
                blogTitle.style.cursor = 'pointer';
                const blogContent = tabContent.createDiv();
                blogContent.style.display = 'none'; // Oculta inicialmente los ajustes
                blogTitle.onclick = toggleCollapse;
            
                new Setting(blogContent) // Usamos `blogContent`
                    .setName('Carpeta de Artículos del Blog')
                    .setDesc('Establece la ruta de la carpeta donde se guardarán los artículos del blog.')
                    .addText((text: TextComponent) => text // Correct type
                        .setValue(this.plugin.settings!.folder_ABlog) // Add assertion
                        .onChange(async (value: string) => { // Use string type
                            this.plugin.settings!.folder_ABlog = value; // Add assertion
                            await this.plugin.saveSettings();
                        }));
            
                new Setting(blogContent) // Usamos `blogContent`
                    .setName('Indice de Artículos del Blog')
                    .setDesc('Establece la ruta del índice de los artículos del blog.')
                    .addText((text: TextComponent) => text // Correct type
                        .setValue(this.plugin.settings!.indice_ABlog) // Add assertion
                        .onChange(async (value: string) => { // Use string type
                            this.plugin.settings!.indice_ABlog = value; // Add assertion
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
                new Setting(desarrollosContent) // Usamos `desarrollosContent`
                    .setName('Carpeta de Desarrollos y Códigos')
                    .setDesc('Establece la ruta de la carpeta donde se guardarán los desarrollos y códigos.')
                    .addText((text: TextComponent) => text // Correct type
                        .setValue(this.plugin.settings!.folder_Desarrollos) // Add assertion
                        .onChange(async (value: string) => { // Use string type
                            this.plugin.settings!.folder_Desarrollos = value; // Add assertion
                            await this.plugin.saveSettings();
                        }));

                // Configuración para Índice de Desarrollos y Códigos
                new Setting(desarrollosContent) // Usamos `desarrollosContent`
                    .setName('Índice de Desarrollos y Códigos')
                    .setDesc('Establece la ruta del índice de los desarrollos y códigos.')
                    .addText((text: TextComponent) => text // Correct type
                        .setValue(this.plugin.settings!.indice_Desarrollos) // Add assertion
                        .onChange(async (value: string) => { // Use string type
                            this.plugin.settings!.indice_Desarrollos = value; // Add assertion
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
                    .addText((text: TextComponent) => text // Correct type
                        .setValue(this.plugin.settings!.folder_Estudio) // Add assertion
                        .onChange(async (value: string) => { // Use string type
                            this.plugin.settings!.folder_Estudio = value; // Add assertion
                            await this.plugin.saveSettings();
                        }));

                new Setting(estudioContent)
                    .setName('Índice de Estudio')
                    .setDesc('Establece la ruta del índice de los temas de estudio.')
                    .addText((text: TextComponent) => text // Correct type
                        .setValue(this.plugin.settings!.indice_Estudio) // Add assertion
                        .onChange(async (value: string) => { // Use string type
                            this.plugin.settings!.indice_Estudio = value; // Add assertion
                            await this.plugin.saveSettings();
                        }));

                // Bloque desplegable para "GTD"
                const gtdTitle = tabContent.createEl('p', { text: '▶ Subsistema de "GTD"' });
                gtdTitle.setAttribute('data-title', 'Subsistema de "GTD"');
                gtdTitle.style.cursor = 'pointer';
                const gtdContent = tabContent.createDiv();
                gtdContent.style.display = 'none';
                gtdTitle.onclick = toggleCollapse;

                new Setting(gtdContent)
                .setName('Archivo de Bandeja de Entrada.')
                .setDesc('Establece la ruta de la Bandeja de entrada GTD.')
                .addText((text: TextComponent) => text // Correct type
                    .setValue(this.plugin.settings!.file_Inbox) // Add assertion
                    .onChange(async (value: string) => { // Use string type
                        this.plugin.settings!.file_Inbox = value; // Add assertion
                        await this.plugin.saveSettings();
                    }));


                // Proyectos GTD
                new Setting(gtdContent)
                    .setName('Carpeta de Proyectos GTD')
                    .setDesc('Establece la ruta de la carpeta para proyectos GTD.')
                    .addText((text: TextComponent) => text // Correct type
                        .setValue(this.plugin.settings!.folder_ProyectosGTD) // Add assertion
                        .onChange(async (value: string) => { // Use string type
                            this.plugin.settings!.folder_ProyectosGTD = value; // Add assertion
                            await this.plugin.saveSettings();
                        }));

                new Setting(gtdContent)
                    .setName('Índice de Proyectos GTD')
                    .setDesc('Establece la ruta del índice para proyectos GTD.')
                    .addText((text: TextComponent) => text // Correct type
                        .setValue(this.plugin.settings!.indice_ProyectosGTD) // Add assertion
                        .onChange(async (value: string) => { // Use string type
                            this.plugin.settings!.indice_ProyectosGTD = value; // Add assertion
                            await this.plugin.saveSettings();
                        }));

                // Revisión Semanal
                new Setting(gtdContent)
                    .setName('Carpeta de Revisiones Semanales GTD')
                    .setDesc('Establece la ruta de la carpeta para las revisiones semanales GTD.')
                    .addText((text: TextComponent) => text // Correct type
                        .setValue(this.plugin.settings!.folder_RSGTD) // Add assertion
                        .onChange(async (value: string) => { // Use string type
                            this.plugin.settings!.folder_RSGTD = value; // Add assertion
                            await this.plugin.saveSettings();
                        }));

                new Setting(gtdContent)
                    .setName('Índice de Revisiones Semanales GTD')
                    .setDesc('Establece la ruta del índice para las revisiones semanales GTD.')
                    .addText((text: TextComponent) => text // Correct type
                        .setValue(this.plugin.settings!.indice_RSGTD) // Add assertion
                        .onChange(async (value: string) => { // Use string type
                            this.plugin.settings!.indice_RSGTD = value; // Add assertion
                            await this.plugin.saveSettings();
                        }));

                // Bloque desplegable para "Lectura"
                const lecturaTitle = tabContent.createEl('p', { text: '▶ Subsistema de "Lectura"' });
                lecturaTitle.setAttribute('data-title', 'Subsistema de "Lectura"');
                lecturaTitle.style.cursor = 'pointer';
                const lecturaContent = tabContent.createDiv();
                lecturaContent.style.display = 'none';
                lecturaTitle.onclick = toggleCollapse;

                // Sesiones de Lectura (Corrected to Resumenes based on error)
                new Setting(lecturaContent)
                    .setName('Carpeta de Resúmenes de Libros') // Corrected Name
                    .setDesc('Establece la ruta de la carpeta para los resúmenes de libros.') // Corrected Desc
                    .addText((text: TextComponent) => text // Correct type
                        .setValue(this.plugin.settings!.folder_LecturaResumenes) // Corrected key + Add assertion
                        .onChange(async (value: string) => { // Use string type
                            this.plugin.settings!.folder_LecturaResumenes = value; // Corrected key + Add assertion
                            await this.plugin.saveSettings();
                        }));

                new Setting(lecturaContent)
                    .setName('Índice de Resúmenes de Libros') // Corrected Name
                    .setDesc('Establece la ruta del índice para los resúmenes de libros.') // Corrected Desc
                    .addText((text: TextComponent) => text // Correct type
                        .setValue(this.plugin.settings!.indice_LecturaResumenes) // Corrected key + Add assertion
                        .onChange(async (value: string) => { // Use string type
                            this.plugin.settings!.indice_LecturaResumenes = value; // Corrected key + Add assertion
                            await this.plugin.saveSettings();
                        }));

                // Libros y Resúmenes (This seems redundant now, maybe remove or adjust?)
                // Keeping it for now, but correcting types and assertions
                new Setting(lecturaContent)
                    .setName('Carpeta de Resúmenes de Libros (Repetido?)')
                    .setDesc('Establece la ruta de la carpeta para los resúmenes de libros.')
                    .addText((text: TextComponent) => text // Correct type
                        .setValue(this.plugin.settings!.folder_LecturaResumenes) // Add assertion
                        .onChange(async (value: string) => { // Use string type
                            this.plugin.settings!.folder_LecturaResumenes = value; // Add assertion
                            await this.plugin.saveSettings();
                        }));

                new Setting(lecturaContent)
                    .setName('Índice de Resúmenes de Libros (Repetido?)')
                    .setDesc('Establece la ruta del índice para los resúmenes de libros.')
                    .addText((text: TextComponent) => text // Correct type
                        .setValue(this.plugin.settings!.indice_LecturaResumenes) // Add assertion
                        .onChange(async (value: string) => { // Use string type
                            this.plugin.settings!.indice_LecturaResumenes = value; // Add assertion
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
                    .addText((text: TextComponent) => text // Correct type
                        .setValue(this.plugin.settings!.folder_Mentorias) // Add assertion
                        .onChange(async (value: string) => { // Use string type
                            this.plugin.settings!.folder_Mentorias = value; // Add assertion
                            await this.plugin.saveSettings();
                        }));

                new Setting(mentoriasContent)
                    .setName('Índice de Mentorías')
                    .setDesc('Establece la ruta del índice de las sesiones de mentoría.')
                    .addText((text: TextComponent) => text // Correct type
                        .setValue(this.plugin.settings!.indice_Mentorias) // Add assertion
                        .onChange(async (value: string) => { // Use string type
                            this.plugin.settings!.indice_Mentorias = value; // Add assertion
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
                    .addText((text: TextComponent) => text // Correct type
                        .setValue(this.plugin.settings!.folder_Mercado) // Add assertion
                        .onChange(async (value: string) => { // Use string type
                            this.plugin.settings!.folder_Mercado = value; // Add assertion
                            await this.plugin.saveSettings();
                        }));

                new Setting(mercadoContent)
                    .setName('Índice de listados de mercado')
                    .setDesc('Establece la ruta del índice de los listados de mercado.')
                    .addText((text: TextComponent) => text // Correct type
                        .setValue(this.plugin.settings!.indice_Mercado) // Add assertion
                        .onChange(async (value: string) => { // Use string type
                            this.plugin.settings!.indice_Mercado = value; // Add assertion
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
                    .addText((text: TextComponent) => text // Correct type
                        .setValue(this.plugin.settings!.folder_ModulosSistema) // Add assertion
                        .onChange(async (value: string) => { // Use string type
                            this.plugin.settings!.folder_ModulosSistema = value; // Add assertion
                            await this.plugin.saveSettings();
                        }));

                new Setting(modulosContent)
                    .setName('Índice de los Modulos del sistema de Gestion')
                    .setDesc('Establece la ruta del índice de los Módulos del sistema de Gestión.')
                    .addText((text: TextComponent) => text // Correct type
                        .setValue(this.plugin.settings!.indice_ModulosSistema) // Add assertion
                        .onChange(async (value: string) => { // Use string type
                            this.plugin.settings!.indice_ModulosSistema = value; // Add assertion
                            await this.plugin.saveSettings();
                        }));
                // Bloque desplegable para "Transacciones y Pagos"
                const transaccionesTitle = tabContent.createEl('p', { text: '▶ Subsistema de "Transacciones"' });
                transaccionesTitle.setAttribute('data-title', 'Subsistema de "transacciones"');
                transaccionesTitle.style.cursor = 'pointer';
                const transaccionesContent = tabContent.createDiv();
                transaccionesContent.style.display = 'none';
                transaccionesTitle.onclick = toggleCollapse;

                // Agrega aquí las configuraciones específicas para "Pagos"
                new Setting(transaccionesContent)
                    .setName('Carpeta de Modulos del Sistema de Transacciones')
                    .setDesc('Establece la ruta de la carpeta donde se guardarán los comprobantes de las transacciones.')
                    .addText((text: TextComponent) => text // Correct type
                        .setValue(this.plugin.settings!.folder_Transacciones) // Add assertion
                        .onChange(async (value: string) => { // Use string type
                            this.plugin.settings!.folder_Transacciones = value; // Add assertion
                            await this.plugin.saveSettings();
                        }));

                new Setting(transaccionesContent)
                    .setName('Índice de Transacciones')
                    .setDesc('Establece la ruta del índice de Transacciones.')
                    .addText((text: TextComponent) => text // Correct type
                        .setValue(this.plugin.settings!.indice_Transacciones) // Add assertion
                        .onChange(async (value: string) => { // Use string type
                            this.plugin.settings!.indice_Transacciones = value; // Add assertion
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
                    .addText((text: TextComponent) => text // Correct type
                        .setValue(this.plugin.settings!.folder_Presentaciones) // Add assertion
                        .onChange(async (value: string) => { // Use string type
                            this.plugin.settings!.folder_Presentaciones = value; // Add assertion
                            await this.plugin.saveSettings();
                        }));

                new Setting(presentacionesContent)
                    .setName('Índice de Presentaciones')
                    .setDesc('Establece la ruta del índice de presentaciones.')
                    .addText((text: TextComponent) => text // Correct type
                        .setValue(this.plugin.settings!.indice_Presentaciones) // Add assertion
                        .onChange(async (value: string) => { // Use string type
                            this.plugin.settings!.indice_Presentaciones = value; // Add assertion
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
                    .addText((text: TextComponent) => text // Correct type
                        .setValue(this.plugin.settings!.folder_ProyectosQ) // Add assertion
                        .onChange(async (value: string) => { // Use string type
                            this.plugin.settings!.folder_ProyectosQ = value; // Add assertion
                            await this.plugin.saveSettings();
                        }));

                new Setting(proyectosQContent)
                    .setName('Índice de Proyectos de Q')
                    .setDesc('Establece la ruta del índice de proyectos de Q.')
                    .addText((text: TextComponent) => text // Correct type
                        .setValue(this.plugin.settings!.indice_ProyectosQ) // Add assertion
                        .onChange(async (value: string) => { // Use string type
                            this.plugin.settings!.indice_ProyectosQ = value; // Add assertion
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
                    .addText((text: TextComponent) => text // Correct type
                        .setValue(this.plugin.settings!.folder_Publicaciones) // Add assertion
                        .onChange(async (value: string) => { // Use string type
                            this.plugin.settings!.folder_Publicaciones = value; // Add assertion
                            await this.plugin.saveSettings();
                        }));

                new Setting(publicacionesContent)
                    .setName('Índice de Publicaciones')
                    .setDesc('Establece la ruta del índice de publicaciones.')
                    .addText((text: TextComponent) => text // Correct type
                        .setValue(this.plugin.settings!.indice_Publicaciones) // Add assertion
                        .onChange(async (value: string) => { // Use string type
                            this.plugin.settings!.indice_Publicaciones = value; // Add assertion
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
                    .addText((text: TextComponent) => text // Correct type
                        .setValue(this.plugin.settings!.folder_Recetas) // Add assertion
                        .onChange(async (value: string) => { // Use string type
                            this.plugin.settings!.folder_Recetas = value; // Add assertion
                            await this.plugin.saveSettings();
                        }));

                new Setting(recetasContent)
                    .setName('Índice de Recetas')
                    .setDesc('Establece la ruta del índice de recetas.')
                    .addText((text: TextComponent) => text // Correct type
                        .setValue(this.plugin.settings!.indice_Recetas) // Add assertion
                        .onChange(async (value: string) => { // Use string type
                            this.plugin.settings!.indice_Recetas = value; // Add assertion
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
                    .addText((text: TextComponent) => text // Correct type
                        .setValue(this.plugin.settings!.folder_RecursosRecurrentes) // Add assertion
                        .onChange(async (value: string) => { // Use string type
                            this.plugin.settings!.folder_RecursosRecurrentes = value; // Add assertion
                            await this.plugin.saveSettings();
                        }));

                new Setting(recursosRecurrentesContent)
                    .setName('Índice de Recursos Recurrentes')
                    .setDesc('Establece la ruta del índice de recursos recurrentes.')
                    .addText((text: TextComponent) => text // Correct type
                        .setValue(this.plugin.settings!.indice_RecursosRecurrentes) // Add assertion
                        .onChange(async (value: string) => { // Use string type
                            this.plugin.settings!.indice_RecursosRecurrentes = value; // Add assertion
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
                    .addText((text: TextComponent) => text // Correct type
                        .setValue(this.plugin.settings!.folder_RegistroTiempo) // Add assertion
                        .onChange(async (value: string) => { // Use string type
                            this.plugin.settings!.folder_RegistroTiempo = value; // Add assertion
                            await this.plugin.saveSettings();
                        }));

                new Setting(registroTiempoContent)
                    .setName('Índice de Registro de Tiempo')
                    .setDesc('Establece la ruta del índice de registros de tiempo.')
                    .addText((text: TextComponent) => text // Correct type
                        .setValue(this.plugin.settings!.indice_RegistroTiempo) // Add assertion
                        .onChange(async (value: string) => { // Use string type
                            this.plugin.settings!.indice_RegistroTiempo = value; // Add assertion
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
        this.openTab = (tabName: string) => { // Add type for tabName
            document.querySelectorAll('.tab-content').forEach(content => {
                (content as HTMLElement).style.display = 'none'; // Cast to HTMLElement
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
    openTab(arg0: string): any {
        throw new Error('Method not implemented.');
    }
}
