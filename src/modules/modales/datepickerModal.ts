// src/modules/modales/datepickerModal.ts
import { App, Modal } from 'obsidian';

export class DatepickerModal extends Modal {
    private resolver: (value: string | null) => void;
    private datePicker: HTMLInputElement;
    
    constructor(app: App) {
        super(app);
        this.titleEl.setText("Selecciona la fecha de publicación");
    }
    
    onOpen() {
        const {contentEl} = this;
        
        // Crear el datepicker
        this.datePicker = contentEl.createEl('input');
        this.datePicker.type = 'date';
        
        // Establecer la fecha actual como valor predeterminado
        const fechaActual = new Date().toISOString().split('T')[0];
        this.datePicker.value = fechaActual;
        
        // Botón de confirmación
        const confirmarBtn = contentEl.createEl('button', {
            text: 'Confirmar',
            cls: 'mod-cta'
        });
        confirmarBtn.addEventListener('click', () => {
            this.close();
            this.resolver(this.datePicker.value);
        });
        
        // Añadir estilos
        contentEl.createEl('style', {
            text: `
                input[type="date"] {
                    display: block;
                    width: 100%;
                    margin-bottom: 1rem;
                    padding: 8px;
                }
                button.mod-cta {
                    display: block;
                    width: 100%;
                }
            `
        });
    }
    
    onClose() {
        const {contentEl} = this;
        contentEl.empty();
    }
    
    openAndAwaitSelection(): Promise<string | null> {
        return new Promise((resolve) => {
            this.resolver = resolve;
            this.open();
        });
    }
}