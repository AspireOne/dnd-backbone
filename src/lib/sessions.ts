import {GameState} from "../types/types";

export type SessionData = {
  threadId: string;
  gameState: GameState;
};
type Sessions = { [session: string]: SessionData };
/** Global object to store each chat session's data */
export const sessions: Sessions = {};
