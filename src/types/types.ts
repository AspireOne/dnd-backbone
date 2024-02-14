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

export type RunStatus =
  | "queued"
  | "in_progress"
  | "requires_action"
  | "cancelling"
  | "cancelled"
  | "failed"
  | "completed"
  | "expired";
export type ResolvedRunStatus =
  | "requires_action"
  | "cancelled"
  | "failed"
  | "completed"
  | "expired";
