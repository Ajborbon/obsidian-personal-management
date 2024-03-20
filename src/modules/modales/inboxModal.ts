import { Modal, App } from 'obsidian';

export class BandejaDeEntradaModal extends Modal {
    inputArea: HTMLTextAreaElement;
    checkBox: HTMLInputElement;
    private resolver: (value: { text: string; saveInCurrent: boolean }) => void;

    constructor(app: App) {
        super(app);
    }

    onOpen() {
        this.containerEl.classList.add("modalInbox");
        let {contentEl} = this;
        
        this.titleEl.setText("Bandeja de Entrada");
        
        // Envuelve el área de texto en un div para control de flujo
        let textAreaDiv = contentEl.createEl('div');
        this.inputArea = textAreaDiv.createEl('textarea');
        this.inputArea.setAttribute('placeholder', 'Escribe tu tarea aquí...');
        // Añade un listener de evento 'keydown' al textarea
        this.inputArea.addEventListener('keydown', (e) => {
            // Verifica si la tecla presionada es Enter y que no haya ninguna modificación (shift, ctrl, alt)
            if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
                e.preventDefault(); // Previene el comportamiento por defecto para no insertar una nueva línea
                this.submitForm(); // Llama a la función que maneja el envío
            }
        });
    
        const activeFile = this.app.workspace.getActiveFile();
        const metadata = this.app.metadataCache.getFileCache(activeFile);
        let nameActiveFile = metadata.aliases ? metadata.aliases[0] : activeFile.basename;
        
        // Envuelve el checkbox y su etiqueta en un div para control de flujo
        let checkBoxDiv = contentEl.createEl('div');
        this.checkBox = checkBoxDiv.createEl('input', {type: 'checkbox'});
        checkBoxDiv.createEl('label', {text: `Guardar en ${nameActiveFile}`}).prepend(this.checkBox);
        const saveButton = checkBoxDiv.createEl('button', {text: 'Guardar'});
        saveButton.addEventListener('click', () => this.submitForm());
    }
    
    submitForm() {
        const text = this.inputArea.value;
        const saveInCurrent = this.checkBox.checked;
        this.close();
        if (this.resolver) {
            this.resolver({ text, saveInCurrent });
        }
    }
    

    waitForInput(): Promise<{ text: string; saveInCurrent: boolean }> {
        return new Promise((resolve) => {
            this.resolver = resolve;
        });
    }
}
