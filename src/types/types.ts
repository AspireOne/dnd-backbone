type StatTypes = "health" | "mana" | "strength";
type GameState = {
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