// src/modules/taskNavigator/components/FilterPanel.ts

import { FilterOptions } from '../models/HierarchyViewModel';
import { TaskListType } from '../models/Task';

/**
 * Componente para el panel de filtros de la vista de tareas
 */
export class FilterPanel {
    // Callback para cuando se aplican filtros
    private onApplyFilters: (filters: Partial<FilterOptions>) => void;
    
    // Estado actual de los filtros
    private currentFilters: FilterOptions;
    
    // Elementos DOM
    private container: HTMLElement;
    private containerShown: boolean = true;
    
    constructor(onApplyFilters: (filters: Partial<FilterOptions>) => void) {
        this.onApplyFilters = onApplyFilters;
        
        // Inicializar filtros con valores por defecto
        this.currentFilters = {
            showCompleted: false,
            showActive: true,
            showPaused: true,
            showStopped: false,
            showArchived: false,
            
            showAreasVida: true,
            showAreasInteres: true,
            showProyectosQ: true,
            showProyectosGTD: true,
            showOtherEntities: true,
            
            contexts: [],
            people: [],
            
            enabledLists: Object.values(TaskListType),
            
            searchText: '',
            daysRange: 7
        };
    }
    
    /**
     * Renderiza el panel de filtros en el contenedor proporcionado
     */
    render(container: HTMLElement): void {
        this.container = container;
        
        // Crear el panel de filtros
        const filterPanel = container.createDiv({ cls: 'task-navigator-filter-panel' });
        
        // Crear encabezado con botón para colapsar/expandir
        const header = filterPanel.createDiv({ cls: 'filter-panel-header' });
        
        // Título del panel
        header.createEl('h3', { text: 'Filtros', cls: 'filter-panel-title' });
        
        // Botón para colapsar/expandir
        const toggleButton = header.createDiv({ cls: 'filter-panel-toggle' });
        toggleButton.innerHTML = this.containerShown ? '▼' : '▶';
        toggleButton.addEventListener('click', () => this.togglePanel(toggleButton));
        
        // Contenido del panel (colapsable)
        const content = filterPanel.createDiv({ cls: 'filter-panel-content' });
        if (!this.containerShown) {
            content.style.display = 'none';
        }
        
        // Crear secciones de filtros
        this.createSearchSection(content);
        this.createEntityStateSection(content);
        this.createEntityTypeSection(content);
        this.createGTDListsSection(content);
        this.createContextsSection(content);
        this.createPeopleSection(content);
        this.createDateRangeSection(content);
        
        // Botones de acción
        const actionsDiv = content.createDiv({ cls: 'filter-panel-actions' });
        
        // Botón para aplicar filtros
        const applyButton = actionsDiv.createEl('button', { 
            text: 'Aplicar Filtros',
            cls: 'filter-apply-button'
        });
        applyButton.addEventListener('click', () => this.applyFilters());
        
        // Botón para restablecer filtros
        const resetButton = actionsDiv.createEl('button', { 
            text: 'Restablecer',
            cls: 'filter-reset-button'
        });
        resetButton.addEventListener('click', () => this.resetFilters());


        // Añadir escucha para el evento de actualización de filtros
        container.addEventListener('task-navigator-update-filters', (event: CustomEvent) => {
        console.log("[TaskNavigator] Evento de actualización de filtros recibido", event.detail);
        
        if (event.detail?.filters) {
            // Actualizar filtros con los valores nuevos
            this.currentFilters = { ...this.currentFilters, ...event.detail.filters };
            
            // Actualizar la UI para reflejar los nuevos filtros
            this.updateUI();
            
            // Aplicar los filtros
            this.applyFilters();
        }
    });
    }
    
    /**
     * Cambia la visibilidad del panel de filtros
     */
    private togglePanel(toggleButton: HTMLElement): void {
        this.containerShown = !this.containerShown;
        const content = this.container.querySelector('.filter-panel-content') as HTMLElement;
        
        if (this.containerShown) {
            content.style.display = 'block';
            toggleButton.innerHTML = '▼';
        } else {
            content.style.display = 'none';
            toggleButton.innerHTML = '▶';
        }
    }
    
    /**
     * Crea la sección de búsqueda de texto
     */
    private createSearchSection(container: HTMLElement): void {
        const section = container.createDiv({ cls: 'filter-section' });
        
        // Título de la sección
        section.createEl('h4', { text: 'Búsqueda', cls: 'filter-section-title' });
        
        // Input de búsqueda
        const searchInput = section.createEl('input', {
            type: 'text',
            placeholder: 'Buscar tareas o entidades...',
            cls: 'filter-search-input'
        });
        searchInput.value = this.currentFilters.searchText;
        
        // Event listener para actualizar el filtro al escribir
        searchInput.addEventListener('input', (e) => {
            this.currentFilters.searchText = (e.target as HTMLInputElement).value;
        });
    }
    
    /**
     * Crea la sección de filtros por estado de entidad
     */
    private createEntityStateSection(container: HTMLElement): void {
        const section = container.createDiv({ cls: 'filter-section' });
        
        // Título de la sección
        section.createEl('h4', { text: 'Estados', cls: 'filter-section-title' });
        
        // Checkboxes para cada estado
        this.createCheckbox(section, 'showActive', '🟢 Activo', this.currentFilters.showActive);
        this.createCheckbox(section, 'showPaused', '🟡 En Pausa', this.currentFilters.showPaused);
        this.createCheckbox(section, 'showStopped', '🔴 Detenido', this.currentFilters.showStopped);
        this.createCheckbox(section, 'showArchived', '🔵 Archivado', this.currentFilters.showArchived);
        this.createCheckbox(section, 'showCompleted', '✅ Tareas Completadas', this.currentFilters.showCompleted);
    }
    
    /**
     * Crea la sección de filtros por tipo de entidad
     */
    private createEntityTypeSection(container: HTMLElement): void {
        const section = container.createDiv({ cls: 'filter-section' });
        
        // Título de la sección
        section.createEl('h4', { text: 'Tipos de Entidad', cls: 'filter-section-title' });
        
        // Checkboxes para cada tipo
        this.createCheckbox(section, 'showAreasVida', 'Áreas de Vida', this.currentFilters.showAreasVida);
        this.createCheckbox(section, 'showAreasInteres', 'Áreas de Interés', this.currentFilters.showAreasInteres);
        this.createCheckbox(section, 'showProyectosQ', 'Proyectos Q', this.currentFilters.showProyectosQ);
        this.createCheckbox(section, 'showProyectosGTD', 'Proyectos GTD', this.currentFilters.showProyectosGTD);
        this.createCheckbox(section, 'showOtherEntities', 'Otras Entidades', this.currentFilters.showOtherEntities);
    }
    
    /**
     * Crea la sección de filtros por listas GTD
     */
    private createGTDListsSection(container: HTMLElement): void {
        const section = container.createDiv({ cls: 'filter-section' });
        
        // Título de la sección
        section.createEl('h4', { text: 'Listas GTD', cls: 'filter-section-title' });
        
        // Crear checkboxes para cada lista GTD
        const listLabels = {
            [TaskListType.INBOX]: 'Bandeja de Entrada',
            [TaskListType.NEXT_ACTIONS]: 'Próximas Acciones',
            [TaskListType.CALENDAR]: 'Calendario',
            [TaskListType.HOPEFULLY_TODAY]: 'Ojalá Hoy',
            [TaskListType.ASSIGNED]: 'Asignadas',
            [TaskListType.PROJECTS]: 'Proyectos',
            [TaskListType.SOMEDAY_MAYBE]: 'Algún Día / Tal Vez',
            [TaskListType.NOT_THIS_WEEK]: 'Esta Semana No',
            [TaskListType.WAITING]: 'En Pausa'
        };
        
        for (const listType of Object.values(TaskListType)) {
            const isEnabled = this.currentFilters.enabledLists.includes(listType);
            
            const checkboxDiv = section.createDiv({ cls: 'filter-checkbox-container' });
            
            const checkbox = checkboxDiv.createEl('input', {
                type: 'checkbox',
                cls: 'filter-checkbox'
            });
            checkbox.id = `list-${listType}`;
            checkbox.checked = isEnabled;
            
            checkbox.addEventListener('change', (e) => {
                const checked = (e.target as HTMLInputElement).checked;
                
                if (checked) {
                    // Añadir la lista a las habilitadas si no está ya
                    if (!this.currentFilters.enabledLists.includes(listType)) {
                        this.currentFilters.enabledLists.push(listType);
                    }
                } else {
                    // Eliminar la lista de las habilitadas
                    this.currentFilters.enabledLists = this.currentFilters.enabledLists.filter(
                        type => type !== listType
                    );
                }
            });
            
            // Etiqueta del checkbox
            const label = checkboxDiv.createEl('label', {
                text: listLabels[listType] || listType,
                cls: 'filter-checkbox-label'
            });
            label.htmlFor = checkbox.id;
        }
    }
    
    /**
     * Crea la sección de filtros por contextos
     */
    private createContextsSection(container: HTMLElement): void {
        const section = container.createDiv({ cls: 'filter-section' });
        
        // Título de la sección
        section.createEl('h4', { text: 'Contextos (#cx)', cls: 'filter-section-title' });
        
        // Input para añadir contextos
        const contextInput = section.createEl('input', {
            type: 'text',
            placeholder: 'Añadir contexto (cx-nombre)',
            cls: 'filter-text-input'
        });
        
        // Botón para añadir contexto
        const addButton = section.createEl('button', {
            text: 'Añadir',
            cls: 'filter-add-button'
        });
        
        // Event listener para el botón
        addButton.addEventListener('click', () => {
            const context = contextInput.value.trim();
            if (context && !this.currentFilters.contexts.includes(context)) {
                // Añadir prefijo cx- si no lo tiene
                const formattedContext = context.startsWith('cx-') ? context : `cx-${context}`;
                this.currentFilters.contexts.push(formattedContext);
                this.updateContextTags(section);
                contextInput.value = '';
            }
        });
        
        // Permitir añadir contexto con Enter
        contextInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addButton.click();
            }
        });
        
        // Contenedor para mostrar los contextos seleccionados
        const contextTags = section.createDiv({ cls: 'filter-tags-container' });
        
        // Actualizar los tags de contexto
        this.updateContextTags = (parent) => {
            const container = parent.querySelector('.filter-tags-container');
            container.empty();
            
            for (const context of this.currentFilters.contexts) {
                const tag = container.createDiv({ cls: 'filter-tag' });
                tag.createSpan({ text: context });
                
                // Botón para eliminar el contexto
                const removeButton = tag.createSpan({ cls: 'filter-tag-remove', text: '×' });
                removeButton.addEventListener('click', () => {
                    this.currentFilters.contexts = this.currentFilters.contexts.filter(c => c !== context);
                    this.updateContextTags(parent);
                });
            }
        };
        
        // Inicializar los tags de contexto
        this.updateContextTags(section);
    }
    
    /**
     * Crea la sección de filtros por personas asignadas
     */
    private createPeopleSection(container: HTMLElement): void {
        const section = container.createDiv({ cls: 'filter-section' });
        
        // Título de la sección
        section.createEl('h4', { text: 'Personas (#px)', cls: 'filter-section-title' });
        
        // Input para añadir personas
        const personInput = section.createEl('input', {
            type: 'text',
            placeholder: 'Añadir persona (px-nombre)',
            cls: 'filter-text-input'
        });
        
        // Botón para añadir persona
        const addButton = section.createEl('button', {
            text: 'Añadir',
            cls: 'filter-add-button'
        });
        
        // Event listener para el botón
        addButton.addEventListener('click', () => {
            const person = personInput.value.trim();
            if (person && !this.currentFilters.people.includes(person)) {
                // Añadir prefijo px- si no lo tiene
                const formattedPerson = person.startsWith('px-') ? person : `px-${person}`;
                this.currentFilters.people.push(formattedPerson);
                this.updatePeopleTags(section);
                personInput.value = '';
            }
        });
        
        // Permitir añadir persona con Enter
        personInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addButton.click();
            }
        });
        
        // Contenedor para mostrar las personas seleccionadas
        const peopleTags = section.createDiv({ cls: 'filter-tags-container' });
        
        // Actualizar los tags de personas
        this.updatePeopleTags = (parent) => {
            const container = parent.querySelector('.filter-tags-container');
            container.empty();
            
            for (const person of this.currentFilters.people) {
                const tag = container.createDiv({ cls: 'filter-tag' });
                tag.createSpan({ text: person });
                
                // Botón para eliminar la persona
                const removeButton = tag.createSpan({ cls: 'filter-tag-remove', text: '×' });
                removeButton.addEventListener('click', () => {
                    this.currentFilters.people = this.currentFilters.people.filter(p => p !== person);
                    this.updatePeopleTags(parent);
                });
            }
        };
        
        // Inicializar los tags de personas
        this.updatePeopleTags(section);
    }
    
    /**
     * Crea la sección de filtros por rango de fechas
     */
    private createDateRangeSection(container: HTMLElement): void {
        const section = container.createDiv({ cls: 'filter-section' });
        
        // Título de la sección
        section.createEl('h4', { text: 'Rango de Días', cls: 'filter-section-title' });
        
        // Slider para seleccionar el rango de días
        const sliderContainer = section.createDiv({ cls: 'filter-slider-container' });
        
        const slider = sliderContainer.createEl('input', {
            type: 'range',
            cls: 'filter-slider',
            attr: {
                min: '1',
                max: '30',
                step: '1',
                value: this.currentFilters.daysRange.toString()
            }
        });
        
        const valueDisplay = sliderContainer.createDiv({ cls: 'filter-slider-value' });
        valueDisplay.textContent = `${this.currentFilters.daysRange} días`;
        
        // Event listener para actualizar el valor mostrado
        slider.addEventListener('input', (e) => {
            const value = parseInt((e.target as HTMLInputElement).value);
            this.currentFilters.daysRange = value;
            valueDisplay.textContent = `${value} días`;
        });
    }
    
    /**
     * Crea un checkbox con etiqueta
     */
    private createCheckbox(container: HTMLElement, filterKey: string, label: string, isChecked: boolean): void {
        const checkboxDiv = container.createDiv({ cls: 'filter-checkbox-container' });
        
        const checkbox = checkboxDiv.createEl('input', {
            type: 'checkbox',
            cls: 'filter-checkbox'
        });
        checkbox.id = `filter-${filterKey}`;
        checkbox.checked = isChecked;
        
        checkbox.addEventListener('change', (e) => {
            this.currentFilters[filterKey] = (e.target as HTMLInputElement).checked;
        });
        
        // Etiqueta del checkbox
        const labelEl = checkboxDiv.createEl('label', {
            text: label,
            cls: 'filter-checkbox-label'
        });
        labelEl.htmlFor = checkbox.id;
    }
    
    /**
     * Aplica los filtros actuales
     */
    private applyFilters(): void {
        this.onApplyFilters({ ...this.currentFilters });
    }
    
    /**
     * Restablece los filtros a sus valores por defecto
     */
    private resetFilters(): void {
        // Restablecer filtros a valores por defecto
        this.currentFilters = {
            showCompleted: false,
            showActive: true,
            showPaused: true,
            showStopped: false,
            showArchived: false,
            
            showAreasVida: true,
            showAreasInteres: true,
            showProyectosQ: true,
            showProyectosGTD: true,
            showOtherEntities: true,
            
            contexts: [],
            people: [],
            
            enabledLists: Object.values(TaskListType),
            
            searchText: '',
            daysRange: 7
        };
        
        // Actualizar la UI para reflejar los valores por defecto
        this.updateUI();
        
        // Aplicar los filtros restablecidos
        this.applyFilters();
    }
    
    /**
     * Actualiza la UI para reflejar los valores actuales de los filtros
     */
    private updateUI(): void {
        // Actualizar checkbox de estados
        this.updateCheckbox('showActive', this.currentFilters.showActive);
        this.updateCheckbox('showPaused', this.currentFilters.showPaused);
        this.updateCheckbox('showStopped', this.currentFilters.showStopped);
        this.updateCheckbox('showArchived', this.currentFilters.showArchived);
        this.updateCheckbox('showCompleted', this.currentFilters.showCompleted);
        
        // Actualizar checkbox de tipos
        this.updateCheckbox('showAreasVida', this.currentFilters.showAreasVida);
        this.updateCheckbox('showAreasInteres', this.currentFilters.showAreasInteres);
        this.updateCheckbox('showProyectosQ', this.currentFilters.showProyectosQ);
        this.updateCheckbox('showProyectosGTD', this.currentFilters.showProyectosGTD);
        this.updateCheckbox('showOtherEntities', this.currentFilters.showOtherEntities);
        
        // Actualizar checkbox de listas GTD
        for (const listType of Object.values(TaskListType)) {
            const checkbox = document.getElementById(`list-${listType}`) as HTMLInputElement;
            if (checkbox) {
                checkbox.checked = this.currentFilters.enabledLists.includes(listType);
            }
        }
        
        // Actualizar campos de texto
        const searchInput = this.container.querySelector('.filter-search-input') as HTMLInputElement;
        if (searchInput) {
            searchInput.value = this.currentFilters.searchText;
        }
        
        // Actualizar slider de rango de días
        const slider = this.container.querySelector('.filter-slider') as HTMLInputElement;
        const valueDisplay = this.container.querySelector('.filter-slider-value');
        if (slider && valueDisplay) {
            slider.value = this.currentFilters.daysRange.toString();
            valueDisplay.textContent = `${this.currentFilters.daysRange} días`;
        }
        
        // Actualizar tags de contextos y personas
        const contextSection = this.container.querySelectorAll('.filter-section')[5]; // Índice de la sección de contextos
        if (contextSection) {
            this.updateContextTags(contextSection);
        }
        
        const peopleSection = this.container.querySelectorAll('.filter-section')[6]; // Índice de la sección de personas
        if (peopleSection) {
            this.updatePeopleTags(peopleSection);
        }
    }
    
    /**
     * Actualiza el estado de un checkbox
     */
    private updateCheckbox(filterKey: string, isChecked: boolean): void {
        const checkbox = document.getElementById(`filter-${filterKey}`) as HTMLInputElement;
        if (checkbox) {
            checkbox.checked = isChecked;
        }
    }
    
    // Métodos para actualizar tags de contextos y personas (definidos dinámicamente)
    private updateContextTags: (parent: HTMLElement) => void;
    private updatePeopleTags: (parent: HTMLElement) => void;
}

// DEVELOPMENT_CHECKPOINT: "filter_panel"
// Descripción: Componente para el panel de filtros de la vista de tareas
// Estado: Completo