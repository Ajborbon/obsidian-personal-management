import { App, FuzzySuggestModal, FuzzyMatch } from "obsidian";

export class SeleccionModalTareas extends FuzzySuggestModal<string> {
    private options: string[]; // Aquí guardamos las cadenas HTML que se mostrarán
    private values: string[];  // Valores que se retornan al elegir
    private seleccionHecha = false;
    private resolveSelection!: (value: string) => void;
    private rejectSelection!: (reason?: any) => void;

    /**
     * @param app Obsidian App
     * @param options Lista de cadenas (PUEDE INCLUIR HTML) que se mostrarán en el modal
     * @param values  Lista de valores asociados a cada opción
     * @param placeholder Texto en la barra de búsqueda
     */
    constructor(app: App, options: string[], values: string[], placeholder: string) {
        super(app);
        this.options = options;
        this.values = values;
        this.setPlaceholder(placeholder);
    }

    /**
     * Retorna la lista de ítems (en este caso, cadenas) sobre las que se hará la búsqueda difusa.
     */
    getItems(): string[] {
        return this.options;
    }

    /**
     * Determina el texto que se usa internamente para la búsqueda difusa.
     * Aquí quitamos etiquetas HTML, para que la búsqueda sea sobre texto plano.
     */
    getItemText(item: string): string {
        // Eliminar etiquetas HTML
        return item.replace(/<[^>]+>/g, "");
    }

    /**
     * Controla cómo se muestra cada opción en la lista de sugerencias.
     * Asignamos 'el.innerHTML' para que se renderice el HTML con estilos,
     * en lugar de mostrar las etiquetas en crudo.
     */
    renderSuggestion(result: FuzzyMatch<string>, el: HTMLElement): void {
        el.innerHTML = result.item; 
        // Si quisieras resaltar coincidencias manualmente, habría que modificar aquí.
    }

    /**
     * Maneja la selección de un ítem. Marcamos que se ha hecho selección y delegamos al método padre.
     */
    selectSuggestion(item: string, evt: MouseEvent | KeyboardEvent): void {
        this.seleccionHecha = true;
        super.selectSuggestion(item, evt);
    }

    /**
     * Se llama cuando el usuario confirma la elección de un ítem de la lista.
     * Obtenemos el valor asociado y resolvemos la promesa.
     */
    onChooseItem(item: string, evt: MouseEvent | KeyboardEvent): void {
        const index = this.options.indexOf(item);
        const value = this.values[index];
        this.resolveSelection(value);
    }

    /**
     * Si el modal se cierra sin que el usuario seleccione nada, rechazamos la promesa.
     */
    onClose(): void {
        if (!this.seleccionHecha) {
            this.rejectSelection(new Error("Modal cerrado sin selección"));
        }
    }

    /**
     * Método para abrir el modal y retornar una promesa que se resuelve cuando
     * el usuario elige un ítem o se rechaza si cierra sin elegir.
     */
    openAndAwaitSelection(): Promise<string> {
        return new Promise((resolve, reject) => {
            this.resolveSelection = resolve;
            this.rejectSelection = reject;
            this.open();
        });
    }
}