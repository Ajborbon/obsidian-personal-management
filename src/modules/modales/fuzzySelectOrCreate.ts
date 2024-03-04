import { App, Plugin, Notice } from "obsidian";
import {SeleccionModal} from "./seleccionModal";

export class fuzzySelectOrCreate {
  app: App;
  plugin: Plugin;
  pathCampos: string = "Estructura/Campos Sistema Gestion/Campos Registro Tiempo.md";

  constructor(app: App, plugin: Plugin) {
    this.app = app;
    this.plugin = plugin;
  }

  createModal() {
    const modal = document.createElement("div");
    modal.setAttribute("id", "fuzzySearchModal");
    modal.style.position = "fixed";
    modal.style.top = "50%";
    modal.style.left = "50%";
    modal.style.transform = "translate(-50%, -50%)";
    modal.style.zIndex = "1000";
    modal.style.padding = "20px";
    modal.style.backgroundColor = "white";
    modal.style.border = "1px solid #ccc";
    modal.style.borderRadius = "5px";
    modal.style.boxShadow = "0 4px 6px rgba(0,0,0,.1)";
    modal.style.width = "300px";
  
    const closeButton = document.createElement("button");
    closeButton.textContent = "×";
    closeButton.style.position = "absolute";
    closeButton.style.top = "5px";
    closeButton.style.right = "5px";
    closeButton.style.border = "none";
    closeButton.style.background = "none";
    closeButton.style.cursor = "pointer";
    closeButton.style.fontSize = "16px";
    closeButton.style.fontWeight = "bold";
    closeButton.style.padding = "0px 4px";
    closeButton.style.borderRadius = "10px";
    closeButton.style.outline = "none";
    closeButton.style.boxShadow = "none";
    closeButton.onclick = () => modal.remove();
  
    modal.appendChild(closeButton);
    return modal;
  }

  filterItems(query: string, items: any[]) {
    return items.filter((item: { value: string; }) =>
      item.value.toLowerCase().includes(query.toLowerCase())
    );
  }

  async updateYAMLFields(tipo: string | number, selectedValue: any, selectedGroup: any) {
    try {
        debugger
        const file = app.vault.getAbstractFileByPath(this.pathCampos);
        await app.fileManager.processFrontMatter(file, (frontmatter: { [x: string]: any[]; }) => {
            // Asumiendo que 'actsTemas' es el campo a modificar
            debugger;
            let currentActs = frontmatter[tipo] || [];
            let newValueForActs = [...currentActs, [selectedGroup, selectedValue]];
            frontmatter[tipo] = newValueForActs;
          });
          console.log("Frontmatter actualizado con éxito");
        } catch (err) {
              console.error("Error al actualizar el frontmatter", err);
            }
        }

  async showFuzzySearchModal(items: any, groups: any[], tipo: string | undefined) {
    return new Promise((resolve, reject) => {
        let selectedValue = ""; // Variable para guardar la opción seleccionada o ingresada por el usuario
        let selectedGroup = "";
        const modal = this.createModal();
      

        // Crear y configurar el título del modal
        const title = document.createElement("h2");
        title.textContent = "Busca o crea tu actividad";
        title.style.textAlign = "center"; // Centrar el título, ajusta los estilos según sea necesario
        modal.appendChild(title);

        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "Escribe tu actividad...";
        // Establece el ancho del input a un porcentaje del contenedor para hacerlo más ancho.
        input.style.width = "80%";
        // Centrar el texto dentro del input
        input.style.textAlign = "center";
        // Centrar el input dentro del modal (si el modal tiene un display flex)
        modal.style.display = "flex";
        modal.style.flexDirection = "column";
        modal.style.alignItems = "center";
        modal.appendChild(input);


        // Crear y agregar un espacio entre el input y resultsDiv
        const spacer = document.createElement("div");
        spacer.style.height = "16px"; // Ajusta esta altura según necesites para el espacio
        modal.appendChild(spacer);
      
        const resultsDiv = document.createElement("div");
        modal.appendChild(resultsDiv);
      
        function updateResultsDisplay(filteredResults: any[], menuOtro: this) {
          resultsDiv.innerHTML = ""; // Limpiar resultados previos
          filteredResults.forEach((result: { value: string | null; activity: string; group: string; }) => {
            const div = document.createElement("div");
            div.textContent = result.value;
            div.style.cursor = "pointer";
            div.onmouseover = () => (div.style.backgroundColor = "#f0f0f0");
            div.onmouseout = () => (div.style.backgroundColor = "transparent");
            div.onclick = () => {
              selectedValue = result.activity; // Guardar el valor seleccionado
              selectedGroup = result.group; // Guardar el grupo seleccionado
              //displaySelectedValue(selectedValue, selectedGroup); // Mostrar la selección al usuario
              modal.remove();
              resolve([selectedValue, selectedGroup]);
            };
            resultsDiv.appendChild(div);
          });
      
          // Si no hay resultados y el usuario ha ingresado un texto, ofrecer la creación de una nueva actividad
          if (filteredResults.length === 0 && input.value.trim() !== "") {
            const createNewDiv = document.createElement("div");
            createNewDiv.textContent = `Crear nueva actividad: "${input.value}"`;
            createNewDiv.style.cursor = "pointer";
            createNewDiv.style.color = "blue";
            createNewDiv.onclick = () => {
              selectedValue = input.value; // Guardar la nueva actividad
              debugger
              if (tipo== undefined){ tipo = "actsTemas"}
              selectGroupForNewActivity(menuOtro, tipo); // Proceder a seleccionar un grupo
            };
            resultsDiv.appendChild(createNewDiv);
          }
        }
      
        function selectGroupForNewActivity(menuOtro: { esRecurrente: (arg0: string) => any; updateYAMLFields: (arg0: any, arg1: string, arg2: string) => any; }, tipo: any) {
          resultsDiv.innerHTML = "";
          input.remove();
          spacer.remove();
          title.remove();

          const texto = document.createElement("p");
          texto.textContent = `Vamos a crear la actividad: "${selectedValue}". Selecciona un grupo:`;;
          texto.style.textAlign = "center"; // Centrar el título, ajusta los estilos según sea necesario
          resultsDiv.appendChild(texto); 
      
          groups.forEach((group: string | null) => {
            const groupDiv = document.createElement("div");
            groupDiv.textContent = group;
            groupDiv.style.cursor = "pointer";
            groupDiv.onmouseover = () => (groupDiv.style.backgroundColor = "#f0f0f0");
            groupDiv.onmouseout = () => (groupDiv.style.backgroundColor = "transparent");
            groupDiv.onclick = async () => {
              selectedGroup = group; // Guardar el grupo seleccionado
              //displaySelectedValue(selectedValue, selectedGroup); // Mostrar la actividad y el grupo seleccionado
              modal.remove();
              let recurrente = await menuOtro.esRecurrente(selectedValue)
              if (recurrente){
                await menuOtro.updateYAMLFields(tipo, selectedValue, selectedGroup);
              }
              resolve([selectedValue, selectedGroup]);
            };
            resultsDiv.appendChild(groupDiv);
          });
        }
      
        function displaySelectedValue(activity: any, group: any) {
          resultsDiv.innerHTML = `Seleccionado: ${activity} / ${group}`;
          // Aquí puedes cerrar el modal o permitir al usuario hacer más acciones
        }
      
        input.oninput = () => {
          const filteredItems = this.filterItems(input.value, items);
          updateResultsDisplay(filteredItems, this);
        };
      
        document.body.appendChild(modal);
       
    });   
}

async esRecurrente(tarea:string):Promise<boolean>{
  const opciones = ["Si","No"] ;
  const valores = [true,false];
  const placeholder = `${tarea} es tarea recurrente?`;
  const modal = new SeleccionModal(app, opciones, valores, placeholder);
  try {
    return await modal.openAndAwaitSelection();
  } catch (error) {
    console.error("Error o modal cerrado sin selección:", error);
    return false;
    }
}

}