export type StatTypes = "health" | "mana" | "strength";
export type GameState = {
  inventoryItems: {
    name: string;
    quantity: number;
    img: string;
  }[];
  stats: {
    type: StatTypes;
    quantity: number;
  }[];
};
