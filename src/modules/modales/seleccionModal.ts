import { App, FuzzySuggestModal, Notice } from 'obsidian';

export class SeleccionModal extends FuzzySuggestModal<string> {
    titles: string[];
    values: string[];
    valueMap: Record<string, string>;
    private seleccionHecha: boolean = false;

    constructor(app: App, titles: string[], values: string[], placeholder: string) {
        super(app);
        this.titles = titles;
        this.values = values;
        this.valueMap = titles.reduce((acc, title, index) => {
            acc[title] = values[index];
            return acc;
        }, {});
        this.setPlaceholder(placeholder);
    }

    getItems(): string[] {
        return this.titles;
    }

    getItemText(item: string): string {
        return item;
    }

    onClose(): void {
        debugger
        if (!this.seleccionHecha) {
            this.reject(new Error('Modal cerrado sin selección'));
        }
    }

    selectSuggestion(item: string, evt: MouseEvent | KeyboardEvent): void {
        // Asegúrate de que la selección se marque antes de proceder al cierre
        debugger
        this.seleccionHecha = true;
        super.selectSuggestion(item, evt); // Llama al método de la clase base para manejar la selección
        // No es necesario llamar a close() aquí si super.selectSuggestion ya maneja el cierre del modal
    }
    

    onChooseItem(item: string, evt: MouseEvent | KeyboardEvent): void {
        debugger
        const value = this.valueMap[item];
        this.resolve(value);
        
    }

    openAndAwaitSelection(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            debugger
            this.resolve = resolve;
            this.reject = reject;
            this.open();
        });
    }
}
