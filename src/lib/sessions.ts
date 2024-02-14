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

export type SessionData = {
  threadId: string;
  gameState: GameState;
};
type Sessions = { [session: string]: SessionData };
/** Global object to store each chat session's data */
export const sessions: Sessions = {};
