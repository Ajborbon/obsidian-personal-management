/*
 * Filename: /src/modules/noteLifecycleManager/API/addOnsAPI.ts
 * Path: /src/modules/noteLifecycleManager/API
 * Created Date: 2024-03-19 09:32:03
 * Author: Andrés Julián Borbón
 * -----
 * Last Modified: 2025-02-23 17:48:35
 * Modified By: Andrés Julián Borbón
 * -----
 * Copyright (c) 2025 - Andrés Julián Borbón
 */


export class addOnsAPI {
    constructor(plugin) {
      this.plugin = plugin;
    }
  
    crearPrevNext(paginas, pagIndice, dv) {
        let pagina = dv.current();
        let indice;
        for (let a = 0; a < paginas.length; a++) {
            if (paginas[a].file.name == pagina.file.name) {
                indice = a;
            }
        }
    
        let links = [];
        if (indice == 0 && paginas.length == 1) {
            links[0] = "";
            links[1] = "";
        } else if (indice == 0) {
            links[0] = "";
            links[1] = "➡️ " + dv.func.link(paginas[indice + 1].file.path, this.determinarTextoEnlace(paginas[indice + 1]));
        } else if (indice == (paginas.length - 1)) {
            links[0] = dv.func.link(paginas[indice - 1].file.path, this.determinarTextoEnlace(paginas[indice - 1])) + " ⬅️";
            links[1] = "";
        } else {
            links[0] = dv.func.link(paginas[indice - 1].file.path, this.determinarTextoEnlace(paginas[indice - 1])) + " ⬅️";
            links[1] = "➡️ " + dv.func.link(paginas[indice + 1].file.path, this.determinarTextoEnlace(paginas[indice + 1]));
        }
    
        dv.paragraph(links[0] + " ==" + dv.func.link(pagIndice.file.path, pagIndice.titulo || pagIndice.file.name) + "== " + links[1]);
    }

    determinarTextoEnlace(pagina) {
        if (pagina.titulo) {
            return pagina.titulo;
        } else if (pagina.aliases && pagina.aliases.length > 0) {
            return pagina.aliases[0];
        } else {
            return pagina.file.name;
        }
    }
  


  }