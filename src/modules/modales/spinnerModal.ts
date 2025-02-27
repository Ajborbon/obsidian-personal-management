import { Modal, App } from 'obsidian';

export class SpinnerModal extends Modal {
    private initialValue: number;
    private currentValue: number;
    private resolver: ((value: number | null) => void) | null = null;
    private numberDisplay: HTMLElement | null = null;

    constructor(app: App, initialValue: number = 1, max: number = 100) {
        super(app);
        const min = 1;
        this.initialValue = Math.max(min, Math.min(max, initialValue));
        this.currentValue = this.initialValue;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.addClass('number-selector-modal');

        // Contenedor principal
        const container = contentEl.createDiv({ cls: 'number-selector-container' });

        // Título
        container.createEl('h2', { text: '¿Cuántos Hits representa este entregable?' });

        // Contenedor de controles
        const controlsContainer = container.createDiv({ cls: 'controls-container' });

        // Botón de decremento
        const decrementBtn = controlsContainer.createEl('button', { 
            text: '▲', 
            cls: 'increment-btn' 
        });
        decrementBtn.addEventListener('click', () => this.changeValue(1));

        // Display de número
        this.numberDisplay = controlsContainer.createEl('div', { 
            text: this.currentValue.toString(), 
            cls: 'number-display' 
        });

        // Botón de incremento
        const incrementBtn = controlsContainer.createEl('button', { 
            text: '▼', 
            cls: 'decrement-btn' 
        });
        incrementBtn.addEventListener('click', () => this.changeValue(-1));

        // Botón de confirmación
        const confirmBtn = container.createEl('button', { 
            text: 'Confirmar', 
            cls: 'confirm-btn' 
        });
        confirmBtn.addEventListener('click', () => this.confirm());

        // Botón de cancelar
        const cancelBtn = container.createEl('button', { 
            text: 'Cancelar', 
            cls: 'cancel-btn' 
        });
        cancelBtn.addEventListener('click', () => this.cancel());

        // Añadir estilos CSS
        const styleEl = document.createElement('style');
        styleEl.innerHTML = `
            .number-selector-modal {
                text-align: center;
                padding: 20px;
            }
            .number-selector-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 15px;
            }
            .controls-container {
                display: flex;
                align-items: center;
                gap: 15px;
            }
            .number-display {
                font-size: 24px;
                font-weight: bold;
                width: 50px;
                text-align: center;
            }
            .increment-btn, .decrement-btn {
                background: none;
                border: 1px solid #ccc;
                padding: 5px 10px;
                cursor: pointer;
            }
            .confirm-btn, .cancel-btn {
                margin: 0 10px;
                padding: 10px 15px;
                cursor: pointer;
            }
        `;
        document.head.appendChild(styleEl);
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
        if (this.resolver && this.currentValue === null) {
            this.resolver(null);
        }
    }

    private changeValue(direction: number) {
        if (!this.numberDisplay) return;
    
        let newValue = this.currentValue;
    
        if (direction > 0) { // Incrementar
            if (newValue < 1) {
                // De 0.33 a 0.5 y de 0.5 a 1
                if (newValue === 0.33) {
                    newValue = 0.5;
                } else if (newValue === 0.5) {
                    newValue = 1;
                }
            } else {
                // Si ya es 1 o mayor, incrementa de 1 en 1
                newValue = newValue + 1;
            }
        } else if (direction < 0) { // Decrementar
            if (newValue > 1) {
                // Si es mayor a 1, decrementa de 1 en 1
                newValue = newValue - 1;
            } else if (newValue === 1) {
                // De 1 pasa a 0.5
                newValue = 0.5;
            } else if (newValue === 0.5) {
                // De 0.5 pasa a 0.33
                newValue = 0.33;
            } else {
                // No se permite bajar de 0.33
                newValue = 0.33;
            }
        }
    
        this.currentValue = newValue;
        this.numberDisplay.textContent = newValue.toString();
    }

    private confirm() {
        if (this.resolver) {
            this.resolver(this.currentValue);
        }
        this.close();
    }

    private cancel() {
        if (this.resolver) {
            this.resolver(null);
        }
        this.close();
    }

    openAndAwaitSelection(): Promise<number | null> {
        return new Promise((resolve) => {
            this.resolver = resolve;
            this.open();
        });
    }
}