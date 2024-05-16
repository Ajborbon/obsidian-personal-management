import {Notice, TFile} from 'obsidian'
import {DateTime, Duration} from 'luxon'
import { starterAPI } from './starterAPI';
import { utilsAPI } from '../../moduloRegistroTiempo/API/utilsAPI';
import { VistaResumenSemanal } from '../views/vistaResumenSemanal';

export class menuSemanalAPI {
    constructor(plugin: Plugin) {
        this.plugin = plugin;
        this.app = plugin.app;  // Guarda una referencia a la aplicación Obsidian para acceder a sus métodos y propiedades
        // this.registroTiempoAPI = new registroTiempoAPI(this.plugin);
    }

    // Función para crear y mostrar el botón inicial "Menú hoy"
    async mostrarMenu(dv) {
        dv.container.innerHTML = ''; // Limpiar el contenedor

        const botonMenuHoy = document.createElement('button');
        botonMenuHoy.textContent = 'Menú Semanal';
        dv.container.appendChild(botonMenuHoy);

        botonMenuHoy.onclick = async () => {
            await this.mostrarBotones(dv); // Mostrar los botones adicionales al hacer clic
        };
    }

    // Método modificado para adaptarse al contexto del plugin
    async mostrarBotones(dv) {
        dv.container.innerHTML = ''; // Limpiar el contenedor para remover el botón de menú

        const botones = [
            "Resumen diario", "Agradecimientos", "Creadas", "Modificadas", "x Fecha", "Tareas Cerradas"
        ];

        // Crear y mostrar cada botón
        botones.forEach(textoBoton => {
            const boton = document.createElement('button');
            boton.textContent = textoBoton;
            boton.onclick = async () => {
                switch(textoBoton) {
                    case 'Resumen diario':
                        await this.mostrarResumenDiario(dv);
                        break;
                    case 'Agradecimientos':
                        await this.mostrarAgradecimientos(dv);
                        break;
                    case 'Creadas':
                        await this.mostrarCreadas(dv);
                        break;
                    case 'Modificadas':
                        await this.mostrarModificadas(dv);
                        break;
                    case 'x Fecha':
                        await this.mostrarxFecha(dv);
                        break;
                    case 'Tareas Cerradas':
                        await this.mostrarTareasCerradas(dv);
                        break;
                    default:
                        console.log(`${textoBoton} presionado.`);
                        break;
                }
            };
            dv.container.appendChild(boton);
        });

        const botonSalir = this.agregarBotonSalir(dv);
        dv.container.appendChild(botonSalir);
    }

    // Método para agregar el botón de recarga y su lógica (Ejemplo adaptado)
    agregarBotonSalir(dv) {
        const botonRecarga = document.createElement('button');
        botonRecarga.textContent = 'Salir';
        botonRecarga.onclick = async () => {
            await this.mostrarMenu(dv); // Restablecer a la vista del botón de menú inicial
        };
        return botonRecarga;
    }

     // Método para actualizar campos YAML
     async updateYAMLFields(filePath, YAMLfield, valor) {
        try {
            // Ruta al archivo que se va a modificar
            const file = app.vault.getAbstractFileByPath(filePath);
            if (file instanceof TFile) {
                // Leer y actualizar el frontmatter usando processFrontMatter
                try{
                  
                await app.fileManager.processFrontMatter(file, frontmatter => {
                    // Actualizar el valor del campo especificado
                    
                    frontmatter[YAMLfield] = valor;
                });
                // Opcional: Notificar al usuario que la actualización fue exitosa
                new Notice('YAML actualizado con éxito.');
            } catch (err) {
                console.error("Error al actualizar el frontmatter", err);
              }
            }
        } catch (err) {
            console.error("Archivo no encontrado", err);
            new Notice('Error al actualizar el YAML.');
        }
    }

    async mostrarResumenDiario(dv){
        debugger;

        // Obtener el leaf activo actual
        const activeLeaf = app.workspace.activeLeaf;

        // Obtener el path del TFile asociado con el leaf activo, si existe
        const currentFilePath = activeLeaf.view?.file?.path;

        // Crear una nueva división a la derecha del leaf activo
        const newLeaf = await app.workspace.splitActiveLeaf('vertical');

        // Configurar el nuevo leaf para mostrar tu vista personalizada
        // y pasar el path del TFile como parte del estado
 
        await newLeaf.setViewState({
            type: "vista-resumen-semanal",
        });
 
        app.workspace.revealLeaf(newLeaf);
    }
    



    // Método adaptado para mostrarBotonBalancePersonal
    async mostrarBotonBalancePersonal(dv) {
        // Limpiar el contenedor
        dv.container.innerHTML = '';
    
        // Mensaje inicial
        const mensaje = document.createElement('h2');
        mensaje.textContent = 'Evalúa el balance de tu vida hoy';
        dv.container.appendChild(mensaje);
    
        const instrucciones = document.createElement('p');
        instrucciones.textContent = 'Evalúa de 1 a 5 cada área:';
        dv.container.appendChild(instrucciones);
    
        // Áreas a evaluar
        const areas = [
            "Productividad", "Espiritual", "Salud", "Rutinas",
            "Vida Social", "Familiar", "Aprendizajes", "Creatividad"
        ];
    
        // Obtener el archivo actual y su metadata
        const file = app.workspace.getActiveFile();
        let metadata;
        if (file instanceof TFile) {
            metadata = app.metadataCache.getFileCache(file)?.frontmatter;
        }
    
        // Crear input range para cada área
        areas.forEach(area => {
            const safeName = area.toLowerCase().replace(/ /g, '_');
            
            const currentVal = metadata && metadata[safeName] ? metadata[safeName] : 0;
    
            const contenedorArea = document.createElement('div');
            contenedorArea.classList.add('area-evaluacion');
    
            const label = document.createElement('label');
            label.textContent = area + ': ';
            label.htmlFor = safeName;
    
            const input = document.createElement('input');
            input.type = 'range';
            input.id = safeName;
            input.name = safeName;
            input.min = '1';
            input.max = '5';
            input.value = currentVal.toString(); // Usar valor actual o 0
    
            const valorLabel = document.createElement('span');
            valorLabel.textContent = input.value; // Mostrar el valor actual al lado
    
            input.oninput = () => valorLabel.textContent = input.value; // Actualizar el valor mostrado al mover el range
    
            contenedorArea.appendChild(label);
            contenedorArea.appendChild(input);
            contenedorArea.appendChild(valorLabel);
            dv.container.appendChild(contenedorArea);
        });
    
        // Botón para guardar los valores
        const botonGuardar = document.createElement('button');
        botonGuardar.textContent = 'Guardar';
        botonGuardar.onclick = async () => {
            if (file instanceof TFile) {
                for (const area of areas) {
                    const safeName = area.toLowerCase().replace(/ /g, '_');
                    const inputElement = document.getElementById(safeName) as HTMLInputElement;
                    const valor = parseInt(inputElement.value, 10);
                    await this.updateYAMLFields(file.path, safeName, valor);
                }
                new Notice('Balances actualizados con éxito.');
            } else {
                new Notice('No se pudo obtener el archivo actual.');
            }
        };
        dv.container.appendChild(botonGuardar);
    
        // Agregar botón de salir si necesario
        const botonSalir = this.agregarBotonSalir(dv);
        dv.container.appendChild(botonSalir);
    }


    async mostrarFormularioHabitos(dv) {
        // Limpiar el contenedor
        dv.container.innerHTML = '';
        
        const habitos = [
            "Club 5am",
            "Registro Akáshiko",
            "Gimnasio",
            "Comer Saludable",
            "Leer libro",
            "Escribir bitácora el mismo día",
            "Crear plan día siguiente",
            "Me fuí a dormir antes de las 10:30pm"
        ];
    
        // Función para cargar y marcar checkboxes seleccionados previamente
        const cargarCheckboxesSeleccionados = async () => {
            const file = app.workspace.getActiveFile();
            // Leer el archivo para obtener el campo 'habitos' del YAML
            const fileContent = await app.vault.read(file);
            const frontMatter = app.metadataCache.getFileCache(file)?.frontmatter;
            const existingHabits = frontMatter?.habitos || [];
    
            habitos.forEach(habito => {
                const container = document.createElement('div');
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = habito;
                checkbox.name = 'habitos';
                checkbox.value = habito;
                checkbox.checked = existingHabits.includes(habito);
    
                const label = document.createElement('label');
                label.htmlFor = habito;
                label.textContent = habito;
    
                container.appendChild(checkbox);
                container.appendChild(label);
    
                dv.container.appendChild(container);
            });
        };
    
        await cargarCheckboxesSeleccionados();
    
        // Crear y configurar el botón de guardar
        const guardarBtn = document.createElement('button');
        guardarBtn.textContent = 'Guardar';
        guardarBtn.onclick = async () => {
            const file = app.workspace.getActiveFile();
            const checkboxes = Array.from(document.querySelectorAll('input[name="habitos"]:checked'));
            const selectedHabits = checkboxes.map(checkbox => checkbox.value);
    
            // Actualizar el campo 'habitos' en el archivo YAML usando el método updateYAMLFields
            await this.updateYAMLFields(file.path, 'habitos', selectedHabits);
        };
    
        // Añadir el botón de guardar al contenedor
        dv.container.appendChild(guardarBtn);

        // Agregar botón de salir si necesario
        const botonSalir = this.agregarBotonSalir(dv);
        dv.container.appendChild(botonSalir);
    }
    
    // Método adaptado para mostrarBotonBalancePersonal
    async mostrarBotonRegistroTareas(dv) {
        
        // Limpiar el contenedor
        dv.container.innerHTML = '';
        let botones;
        const utilsAPInstance = new utilsAPI(this.plugin);
        const activo = await utilsAPInstance.buscarRegistrosActivos(app)
        if (activo instanceof TFile){ // Verifica si hay algun archivo activo 
            botones = ["Cerradas Hoy", "Registros Hoy", "Nuevo Registro Tiempo", "Cerrar Registro Tiempo"];
        }else{
            botones = ["Cerradas Hoy", "Registros Hoy", "Nuevo Registro Tiempo"];
        }

        // Crear y mostrar cada botón
        botones.forEach(textoBoton => {
            const boton = document.createElement('button');
            boton.textContent = textoBoton;
            boton.onclick = async () => {
                switch(textoBoton) {
                    case 'Cerradas Hoy':
                        await this.mostrarCerradasHoy(dv);
                        break;
                    case 'Registros Hoy':
                        await this.mostrarRegistrosHoy(dv);
                        break;
                    case 'Cerrar Registro Tiempo':
                        debugger;
                        await this.registroTiempoAPI.cerrarRegistro(activo);
                        break;
                    case 'Nuevo Registro Tiempo':
                        const starterAPInstance = new starterAPI(this.plugin)
                        await starterAPInstance.createNote("RegistroTiempo");
                        break;
                    default:
                        console.log(`${textoBoton} presionado.`);
                        break;
                }
            };
            dv.container.appendChild(boton);
        });

        const botonSalir = this.agregarBotonSalir(dv);
        dv.container.appendChild(botonSalir);
    }

    async mostrarCerradasHoy(dv) {
        dv.container.innerHTML = '';
    
        const activo = app.workspace.getActiveFile();
        let fechaActivo = activo?.basename.split(" ")[0];
        const hoy = new Date(fechaActivo).setHours(0, 0, 0, 0);
    
        const files = app.vault.getMarkdownFiles();
        
        let tareasPromesas = files.map(async (file) => {
            let contenido = await app.vault.read(file);
            let tareasExtraidas = extraerTareas(contenido);
        
            const frontMatter = app.metadataCache.getFileCache(file)?.frontmatter;
            const alias = frontMatter?.aliases ? frontMatter.aliases[0] : null;
            const filePath = file.path;
        
            return {
                filePath,
                alias,
                tareas: tareasExtraidas.filter(tarea => {
                    let fechaTarea = new Date(tarea.completionDate).setHours(0, 0, 0, 0);
                    return tarea.completed && tarea.completionDate && fechaTarea === hoy;
                })
            };
        });
        
        let resultados = await Promise.all(tareasPromesas);
        let totalTareasCerradas = resultados.reduce((total, { tareas }) => total + tareas.length, 0);

        // Mensaje sobre el estado de las tareas cerradas hoy
        if (totalTareasCerradas > 0) {
            dv.header(3, `Hoy se han cerrado ${totalTareasCerradas} tareas.`);
            
             // Crear la tabla HTML
        const table = document.createElement('table');
        table.classList.add('table'); // Agregar una clase para la tabla para el estilo
        table.style.width = '100%';
    
        // Añadir encabezados de tabla
        const headerRow = document.createElement('tr');
        let headers = ["Nota", "Tareas Cerradas"];
        headers.forEach(headerText => {
            let header = document.createElement('th');
            header.textContent = headerText;
            header.style.textAlign = 'center';
            headerRow.appendChild(header);
        });
        table.appendChild(headerRow);
    
        // Añadir filas de datos a la tabla
        resultados.forEach(({filePath, alias, tareas}) => {
            if (tareas.length > 0) {
                let row = document.createElement('tr');
    
                // Columna de enlace centrado verticalmente
                let linkCell = document.createElement('td');
                linkCell.style.verticalAlign = 'middle';
                let a = document.createElement('a');
                a.setAttribute('href', `obsidian://open?vault=${app.vault.getName()}&file=${encodeURIComponent(filePath)}`);
                a.textContent = alias || filePath;
                linkCell.appendChild(a);
                row.appendChild(linkCell);
    
                // Columna de tareas cerradas
                let tasksCell = document.createElement('td');
                let tasksList = document.createElement('ul');
                tareas.forEach(tarea => {
                    let li = document.createElement('li');
                    li.textContent = tarea.text;
                    tasksList.appendChild(li);
                });
                tasksCell.appendChild(tasksList);
                row.appendChild(tasksCell);
    
                table.appendChild(row);
            }
        });
    
        // Añadir la tabla al contenedor de Dataview
        dv.container.appendChild(table);
        
        } else {
            dv.paragraph("No hay tareas cerradas hoy.");
        }
            
        const botonSalir = this.agregarBotonSalir(dv);
        dv.container.appendChild(botonSalir);
    
    function extraerTareas(contenido) {
        const tareas = [];
        const lineas = contenido.split("\n");
    
        for (const linea of lineas) {
            const tareaRegex = /^\s*-\s*\[(x|X| )\]\s*(.+)$/;
            const match = tareaRegex.exec(linea);
    
            if (match) {
                const completada = match[1].toLowerCase() === 'x';
                let textoTarea = match[2];
                let fechaCompletitud = null;
    
                const fechaRegex = /\[completion:: (\d{4}-\d{2}-\d{2})\]/;
                const fechaMatch = fechaRegex.exec(textoTarea);
                if (fechaMatch) {
                    fechaCompletitud = fechaMatch[1];
                    textoTarea = textoTarea.replace(fechaRegex, '').trim();
                }
    
                tareas.push({
                    text: textoTarea,
                    completed: completada,
                    completionDate: fechaCompletitud,
                });
            }
        }
    
        return tareas;
    }
    
    
}


    async mostrarRegistrosHoy(dv) {
        dv.container.innerHTML = ''; // Limpiar el contenedor de Dataview
        
        // Obtén la fecha actual basada en el nombre del archivo
        const fechaHoy = DateTime.fromFormat(app.workspace.getActiveFile().basename.split(" ")[0], 'yyyy-MM-dd', { locale: 'es' });
       
        // Encuentra archivos que contienen registros de tiempo
        const folder = this.plugin.settings.folder_RegistroTiempo
        const files = app.vault.getMarkdownFiles().filter(file => file.path.includes(folder));

        // Lee y procesa el contenido de cada archivo para extraer registros de tiempo
        let totalDia = 0;
        let registrosHoy = [];
        
        for (let file of files) {
            
            let metadata = app.metadataCache.getFileCache(file)?.frontmatter;

            if (metadata?.horaInicio) {
                let horaInicio = DateTime.fromFormat(metadata.horaInicio, 'yyyy-MM-dd EEEE HH:mm', { locale: 'es' });
                const startOfDay = horaInicio.startOf('day');
    
                if (startOfDay.ts === fechaHoy.startOf('day').ts) {
                    registrosHoy.push({path: file.path, frontmatter : metadata}); // Corregido para agregar el objeto archivo directamente
                    // Asegúrate de convertir tiempoTrabajado a número antes de sumar
                    totalDia += metadata.tiempoTrabajado ? parseInt(metadata.tiempoTrabajado) : 0;
                }
            }
        }
        // Mostrar el total de tiempo trabajado hoy
        dv.header(3, "Tiempo registrado hoy: " + Duration.fromMillis(totalDia).toFormat('hh:mm:ss'));


            // Ordena los registros por hora de inicio antes de generar la tabla
        registrosHoy.sort((a, b) => {
            
                // Verifica si horaInicio está presente y es una cadena válida para ambos objetos
                if (typeof a.frontmatter.horaInicio === 'string' && typeof b.frontmatter.horaInicio === 'string') {
                    try {
                        const millisA = DateTime.fromFormat(a.frontmatter.horaInicio, 'yyyy-MM-dd EEEE HH:mm', { locale: 'es' }).toMillis();
                        const millisB = DateTime.fromFormat(b.frontmatter.horaInicio, 'yyyy-MM-dd EEEE HH:mm', { locale: 'es' }).toMillis();
                        return millisB - millisA;
                    } catch (e) {
                        console.error("Error parsing dates:", e);
                        return 0;
                    }
                } else {
                    // Manejo de casos donde los datos no sean strings válidos
                    console.warn('Invalid date format for sorting:', a.horaInicio, b.horaInicio);
                    return 0;
                }
            });
                
if (registrosHoy.length>0){
// Crea la tabla HTML
const table = dv.container.createEl('table', {cls: 'dataview table'});
table.style.width = '100%';

// Crea y añade los encabezados de la tabla
const header = dv.el('tr', '', table);
["Registro", "Descripción", "Hora Inicio", "Tiempo", "Estado", "Id", "Acción"].forEach(text => dv.el('th', text, header));

// Crea y añade cada fila de registro a la tabla
registrosHoy.forEach(registro => {
    const row = dv.el('tr','',table)
    dv.el('td', dv.func.link(registro.path,registro.frontmatter.aliases[0]), row);
     // Añade la celda de descripción y título
    dv.el('td', registro.frontmatter.descripcion ? registro.frontmatter.descripcion : 'Sin descripción', row);
    dv.el('td', DateTime.fromFormat(registro.frontmatter.horaInicio, 'yyyy-MM-dd EEEE HH:mm', { locale: 'es' }).toFormat('h:mm a') +
    " / " + DateTime.fromFormat(registro.frontmatter.horaFinal, 'yyyy-MM-dd EEEE HH:mm', { locale: 'es' }).toFormat('h:mm a'), row);
    if (registro.frontmatter.estado === "🟢"){
    // Separamos la fecha y la hora, y eliminamos el día de la semana
    let partes = registro.frontmatter.horaInicio.split(' ');
    // Reorganizamos las partes para formar una fecha en formato "YYYY-MM-DDTHH:mm"
    let fechaHoraISO = `${partes[0]}T${partes[2]}`;
    // Parseamos la fecha en formato ISO
    let inicio = Date.parse(fechaHoraISO);
    let ahora = Date.now();
    let diferencia = ahora - inicio; // Diferencia en milisegundos
    dv.el('td', Duration.fromMillis(diferencia).toFormat('h:mm'), row)
    }else{
    dv.el('td', Duration.fromMillis(registro.frontmatter.tiempoTrabajado).toFormat('h:mm'), row);
    }
    dv.el('td', registro.frontmatter.estado, row);
    dv.el('td', registro.frontmatter.id, row);
    if (registro.frontmatter.estado === "🟢"){
        dv.el('td', this.createButtonTable('Cerrar', async () => {
        debugger
        // Lógica que manejará el clic del botón.
        // Por ejemplo, retomar la tarea representada por `registro`
        await this.registroTiempoAPI.cerrarRegistro(registro.frontmatter.id);
        //this.cerrarTarea(registro.frontmatter.id);
        }), row);
    }else{
    dv.el('td', this.createButtonTable('Retomar', () => {
        // Lógica que manejará el clic del botón.
        // Por ejemplo, retomar la tarea representada por `registro`
        this.retomarTarea(registro.frontmatter.id);
        }), row);
    }
    });
    }
    const botonSalir = this.agregarBotonSalir(dv);
    dv.container.appendChild(botonSalir);
    
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
    // Crea la nota desde el templater de RegistroTiempo
    async retomarTarea(id) { 
        // Asegúrate de reemplazar 'ruta/al/archivo.md' con la ruta exacta del archivo que deseas obtener
        debugger;
        const filePath = `Plantillas/${this.plugin.settings[`folder_RegistroTiempo`]}/Plt - RegistroTiempo.md`;
        const template = app.vault.getAbstractFileByPath(filePath);

        if (template instanceof TFile) {
            // Ahora 'file' es tu archivo deseado, y puedes trabajar con él como necesites
            console.log("Archivo encontrado:", template);
        } else {
            // Si el archivo no se encontró, 'file' será null
            console.log("Archivo no encontrado.");
        }
        const filename = "Retomar " + id;
        const folder = app.vault.getAbstractFileByPath("Inbox");
        const tp = this.getTp();
        let crearNota = tp.file.static_functions.get("create_new")
        await crearNota (template, filename, false, folder).basename;
      }

    getTp(){
        if (!this.plugin || !this.plugin.app.plugins.enabledPlugins.has('templater-obsidian')) {
            console.error('El plugin Templater no está habilitado.');
            return;
        }   
        let tpGen = this.plugin.app.plugins.plugins["templater-obsidian"].templater;
        tpGen = tpGen.functions_generator.internal_functions.modules_array;
        let tp = {}
        // get an instance of modules
        tp.file = tpGen.find(m => m.name == "file");
        tp.system = tpGen.find(m => m.name == "system");

        if (!tp.file) {
        console.error("No se pudo acceder al objeto de funciones actuales de Templater.");
        return;
        }
        console.log('tp con propiedades "file" se ha cargado satisfactoriamente');
        return tp;
    }

}
    
