export type GameState = {
  inventoryItems: {
    name: string;
    quantity: number;
    img: string;
  }[];
  stats: {
    // Out of 100.
    health: number;
    mana: number;
    speed: number;
    strength: number;
  };
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
