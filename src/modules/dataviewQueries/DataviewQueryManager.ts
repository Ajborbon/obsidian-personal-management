// src/modules/dataviewQueries/DataviewQueryManager.ts
import { Plugin, Component } from 'obsidian';

export class DataviewQueryManager extends Component {
    constructor(plugin: Plugin) {
        super();
        this.plugin = plugin;
    }

    // Cache para almacenar resultados de consultas frecuentes
    private queryCache = new Map<string, {
        data: any;
        timestamp: number;
        ttl: number;
    }>();

    // Método para ejecutar consultas con caché
    async executeQuery(queryKey: string, queryFn: () => Promise<any>, ttl = 60000) {
        const cached = this.queryCache.get(queryKey);
        const now = Date.now();

        if (cached && now - cached.timestamp < cached.ttl) {
            return cached.data;
        }

        const result = await queryFn();
        this.queryCache.set(queryKey, {
            data: result,
            timestamp: now,
            ttl
        });

        return result;
    }

    // Método para limpiar caché
    clearCache(queryKey?: string) {
        if (queryKey) {
            this.queryCache.delete(queryKey);
        } else {
            this.queryCache.clear();
        }
    }
}