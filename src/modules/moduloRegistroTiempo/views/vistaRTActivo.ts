import { ItemView, WorkspaceLeaf, Plugin } from "obsidian";
import { DateTime, Duration } from "luxon"; // Asegúrate de tener Luxon disponible para manipular fechas y horas
import { registroTiempoAPI } from "../API/registroTiempoAPI";
import { starterAPI } from "../../noteLifecycleManager/API/starterAPI";

export class VistaRegistroActivo extends ItemView {
    plugin : Plugin;
    constructor(leaf: WorkspaceLeaf, plugin: Plugin) {
        super(leaf);
        this.plugin = plugin;
        this.registroTiempoAPI = new registroTiempoAPI(this.plugin);
    }

    getViewType() {
        return "vista-registro-activo";
    }

    getDisplayText() {
        return "Registro Activo";
    }

    getIcon() {
        return "checkmark"; // Cambia a un ícono adecuado para registros activos
    }

    async onOpen() {
        await this.actualizarVista(); // Actualiza la vista inmediatamente al abrir
    
        this.intervalId = setInterval(async () => {
            await this.actualizarVista(); // Actualiza la vista cada 5 segundos
        }, 5000);
    }
    
    onClose() {
        clearInterval(this.intervalId); // Limpia el intervalo al cerrar la vista
    }

    async actualizarVista() {
        this.containerEl.empty(); // Limpia el contenido existente antes de actualizar

        const folder = this.plugin.settings.folder_RegistroTiempo; // Ajusta esto al directorio donde guardas tus registros
        const files = app.vault.getMarkdownFiles().filter(file => file.path.includes(folder));
        let registrosActivos = [];

        for (let file of files) {
            let metadata = app.metadataCache.getFileCache(file)?.frontmatter;

            if (metadata?.estado === "🟢") {
                let registroActivo = {file}; // Asumiendo que quieres guardar el path del archivo
                Object.assign(registroActivo, metadata); // Agrega el metadata al objeto registroActivo
                registrosActivos.push(registroActivo); // Añade el registro activo al array              
            }
        }

        // Crea la tabla HTML para mostrar la información
        if (registrosActivos.length === 0) {
            this.containerEl.createEl('p', { text: 'No hay ningún registro de tiempo ejecutandose.' });
            const botonCrear = this.containerEl.createEl('button');
            botonCrear.textContent = 'Nuevo Registro Tiempo';
            botonCrear.onclick = async () => {
                const starterAPInstance = new starterAPI(this.plugin)
                await starterAPInstance.createNote("RegistroTiempo");
            };

            // Logica para crear tabla sencilla de 5 ultimos RT
            let registrosFinalizados = [];
            for (let file of files) {
                let metadata = app.metadataCache.getFileCache(file)?.frontmatter;

                if (metadata?.estado === "🔵") {
                    let registroFinalizado = {file}; // Asumiendo que quieres guardar el path del archivo
                    Object.assign(registroFinalizado, metadata); // Agrega el metadata al objeto registroActivo
                    registrosFinalizados.push(registroFinalizado); // Añade el registro activo al array              
                }
            }
            // Ordena los registros activos por el campo 'id' de manera descendente
            registrosFinalizados.sort((a, b) => b.id - a.id);
            // Selecciona los primeros 5 registros después de ordenar
            
            let top5RegistrosActivos = registrosFinalizados.slice(0, 5);
            // Ahora top5RegistrosActivos contiene los 5 archivos con los ID más altos


            if (top5RegistrosActivos.length > 0) {
                const table = this.containerEl.createEl('table', {cls: 'table-small'});
                table.style.width = '100%';
                const header = table.createEl('tr');
                ["Alias", "Descripción", "Retomar"].forEach(text => header.createEl('th', {text: text}));
                
                top5RegistrosActivos.forEach(registro => {
                    const row = table.createEl('tr');
                    row.createEl('td', {text: registro.aliases[0]});
                    row.createEl('td', {text: registro.descripcion || "No Definida"});
                   // Crea una nueva celda para el botón
                   const buttonCell = row.createEl('td');
                   // Crea el botón y añádelo a la nueva celda
                   const button = this.createButtonTable('⏱️', () => {
                        this.registroTiempoAPI.retomarTarea(registro.id);
                   });
                       buttonCell.appendChild(button);
                   });
                    
            } else {
                this.containerEl.createEl('p', {text: 'No hay registros finalizados.'});
            }

        }else if (registrosActivos.length === 1){
            this.containerEl.classList.add("vista-RT");
            let alias = registrosActivos[0].aliases ? registrosActivos[0].aliases[0] : 'Sin alias';
            let descripcion = registrosActivos[0].descripcion ? registrosActivos[0].descripcion : 'Sin descripcion';
            let partes = registrosActivos[0].horaInicio.split(' ');
            let fechaHoraISO = `${partes[0]}T${partes[2]}`;
            let inicio = DateTime.fromISO(fechaHoraISO);
            let ahora = DateTime.now();
            let diferencia = ahora.diff(inicio);
            let tiempo = Duration.fromMillis(diferencia.toMillis()).toFormat('h:mm')
            this.containerEl.createEl('h5', { text: 'Tarea Actual'});

            this.containerEl.createEl('p', { text: 'Nombre: ' + alias });
            this.containerEl.createEl('span', { text: descripcion });
            this.containerEl.createEl('span', { text: 'Esta tarea lleva: ' + tiempo });
            const botonera = this.containerEl.createEl('div');
            const botonCerrar = botonera.createEl('button');
            botonCerrar.textContent = 'Cerrar Tarea';
            botonCerrar.onclick = async () => {
                await this.registroTiempoAPI.cerrarRegistro(registrosActivos[0].file); // Restablecer a la vista del botón de menú inicial
            };
            const botonDetalle = botonera.createEl('button');
            botonDetalle.textContent = 'Cambiar Descripción';
            botonDetalle.onclick = async () => {
                await this.registroTiempoAPI.detalleRegistro(registrosActivos[0].file); // Restablecer a la vista del botón de menú inicial
            };
        } else {
            this.containerEl.createEl('p', {text: ' Hay un error con la cantidad de registros activos.'});
        }
    }

    createButtonTable(buttonText, onClickCallback) {
        
        const button = document.createElement('button');
        button.textContent = buttonText;
        button.type = 'button'; // Asegúrate de que no se enviará un formulario al hacer clic en él
        button.classList.add('your-button-class'); // Agrega una clase para el estilo del botón si es necesario

        // Añade el evento de clic al botón
        button.addEventListener('click', onClickCallback);

        return button;
    }
    
    
}
