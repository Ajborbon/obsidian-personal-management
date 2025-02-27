// src/modules/modales/seleccionMultipleModal.ts
import { App, Modal, Notice } from 'obsidian';

interface OpcionCanal {
    nombre: string;
    seleccionado: boolean;
}

export class SeleccionMultipleModal extends Modal {
    private opciones: OpcionCanal[];
    private resolver: (value: string[] | null) => void;
    private checkboxes: HTMLInputElement[] = [];
    
    constructor(app: App, opciones: OpcionCanal[], titulo: string) {
        super(app);
        this.opciones = opciones;
        this.titleEl.setText(titulo);
    }
    
    onOpen() {
        const {contentEl} = this;
        
        // Crear un contenedor para los checkboxes
        const contenedor = contentEl.createEl('div', {cls: 'seleccion-multiple-container'});
        
        // Crear un checkbox para cada opción
        this.opciones.forEach(opcion => {
            const wrapper = contenedor.createEl('div', {cls: 'checkbox-wrapper'});
            
            const checkbox = wrapper.createEl('input', {
                type: 'checkbox',
                attr: { id: `opcion-${opcion.nombre}` }
            });
            checkbox.checked = opcion.seleccionado;
            this.checkboxes.push(checkbox);
            
            wrapper.createEl('label', {
                text: opcion.nombre,
                attr: { for: `opcion-${opcion.nombre}` }
            });
        });
        
        // Botones de acción
        const botonesContainer = contentEl.createEl('div', {cls: 'modal-button-container'});
        
        const seleccionarTodosBtn = botonesContainer.createEl('button', {text: 'Seleccionar todos'});
        seleccionarTodosBtn.addEventListener('click', () => {
            this.checkboxes.forEach(cb => cb.checked = true);
        });
        
        const deseleccionarTodosBtn = botonesContainer.createEl('button', {text: 'Deseleccionar todos'});
        deseleccionarTodosBtn.addEventListener('click', () => {
            this.checkboxes.forEach(cb => cb.checked = false);
        });
        
        const confirmarBtn = contentEl.createEl('button', {
            text: 'Confirmar',
            cls: 'mod-cta'
        });
        confirmarBtn.addEventListener('click', () => {
            this.confirmarSeleccion();
        });
        
        // Añadir estilos
        contentEl.createEl('style', {
            text: `
                .seleccion-multiple-container {
                    margin-bottom: 1rem;
                    max-height: 300px;
                    overflow-y: auto;
                    padding: 10px;
                }
                .checkbox-wrapper {
                    display: flex;
                    align-items: center;
                    margin-bottom: 8px;
                }
                .checkbox-wrapper label {
                    margin-left: 8px;
                }
                .modal-button-container {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 1rem;
                }
                button.mod-cta {
                    display: block;
                    width: 100%;
                    margin-top: 1rem;
                }
            `
        });
    }
    
    confirmarSeleccion() {
        const seleccionados: string[] = [];
        
        this.checkboxes.forEach((checkbox, index) => {
            if (checkbox.checked) {
                seleccionados.push(this.opciones[index].nombre);
            }
        });
        
        if (seleccionados.length === 0) {
            new Notice("Debes seleccionar al menos un canal");
            return;
        }
        
        this.close();
        this.resolver(seleccionados);
    }
    
    onClose() {
        const {contentEl} = this;
        contentEl.empty();
    }
    
    openAndAwaitSelection(): Promise<string[] | null> {
        return new Promise((resolve) => {
            this.resolver = resolve;
            this.open();
        });
    }
}

