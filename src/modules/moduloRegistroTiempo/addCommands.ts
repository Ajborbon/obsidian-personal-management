import { SamplePlugin } from "./main";
export function addCommands(plugin: SamplePlugin) {
    // Imprimir saludo en la consola
    plugin.addCommand({
      id: "saludo-a-la-consola",
      name: "Imprimir saludo en la consola",
      callback: () => {
        console.log("¡Hey, tú!");
      },
    });
  }