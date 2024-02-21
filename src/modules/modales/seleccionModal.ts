// Importación de clases necesarias desde la librería de Obsidian.
import { App, FuzzySuggestModal, Notice } from 'obsidian';

// Definición de la clase SeleccionModal que extiende de FuzzySuggestModal para manejar selecciones de strings.
export class SeleccionModal extends FuzzySuggestModal<string> {
    titles: string[]; // Array de títulos para las opciones del modal.
    values: string[]; // Array de valores asociados a cada título.
    valueMap: Record<string, string>; // Objeto para mapear títulos a valores.
    private seleccionHecha: boolean = false; // Flag para determinar si se ha hecho una selección.

    // Constructor de la clase.
    constructor(app: App, titles: string[], values: string[], placeholder: string) {
        super(app); // Llamada al constructor de la clase base con la instancia de App de Obsidian.
        this.titles = titles; // Inicialización del array de títulos.
        this.values = values; // Inicialización del array de valores.
        // Creación del mapeo de títulos a valores.
        this.valueMap = titles.reduce((acc, title, index) => {
            acc[title] = values[index];
            return acc;
        }, {});
        this.setPlaceholder(placeholder); // Establecimiento del texto de placeholder para el campo de búsqueda en el modal.
    }

    // Método para obtener los ítems (títulos) que se mostrarán en el modal.
    getItems(): string[] {
        return this.titles;
    }

    // Método para obtener el texto que se mostrará para cada ítem en el modal.
    getItemText(item: string): string {
        return item;
    }

    // Método que se llama al cerrar el modal.
    onClose(): void {
        // Si el modal se cierra sin que se haya hecho una selección, se rechaza la promesa.
        if (!this.seleccionHecha) {
            this.reject(new Error('Modal cerrado sin selección'));
        }
    }

    // Método para manejar la selección de un ítem.
    selectSuggestion(item: string, evt: MouseEvent | KeyboardEvent): void {
        this.seleccionHecha = true; // Marcar que se ha hecho una selección.
        super.selectSuggestion(item, evt); // Llamar al método correspondiente de la clase base para manejar la selección.
    }

    // Método que se llama al elegir un ítem, donde se resuelve la promesa con el valor asociado al ítem seleccionado.
    onChooseItem(item: string, evt: MouseEvent | KeyboardEvent): void {
        const value = this.valueMap[item]; // Obtener el valor asociado al ítem seleccionado.
        this.resolve(value); // Resolver la promesa con el valor seleccionado.
    }

    // Método para abrir el modal y esperar a que el usuario haga una selección, devolviendo una promesa con el valor seleccionado.
    openAndAwaitSelection(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.resolve = resolve; // Guardar la función resolve de la promesa para usarla al seleccionar un ítem.
            this.reject = reject; // Guardar la función reject de la promesa para usarla si se cierra el modal sin selección.
            this.open(); // Abrir el modal.
        });
    }
}