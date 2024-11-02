// src/modules/dataviewQueries/interfaces/ButtonStyle.ts
export interface ButtonStyle {
    text: string;
    icon: string;
    class: string;
    action: () => Promise<void>;
}