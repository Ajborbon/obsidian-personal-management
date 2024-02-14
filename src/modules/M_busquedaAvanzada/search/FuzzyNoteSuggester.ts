// En algún lugar de tu módulo, como search/FuzzyNoteSuggester.ts
import { App, FuzzySuggestModal, TFile } from "obsidian";

export class FuzzyNoteSuggester extends FuzzySuggestModal<TFile> {
    constructor(app: App, private notas: TFile[]) {
        super(app);
    }

    getItems(): TFile[] {
        return this.notas;
    }

    getItemText(item: TFile): string {
        return item.basename; // O cualquier otro formato que prefieras
    }

    onChooseItem(item: TFile, evt: MouseEvent | KeyboardEvent): void {
        // Aquí defines qué hacer cuando se selecciona una nota. Por ejemplo, abrir la nota:
        const leaf = this.app.workspace.getLeaf(true);
        this.app.workspace.setActiveLeaf(leaf, false);
        leaf.openFile(item);
    }
}
