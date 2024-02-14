import { z } from "zod";
import { sessions } from "../lib/sessions";
import { sessionSchema } from "../helpers/schemaValidations";
import {GameState} from "../types/types";

export const getGameStateInputSchema = z.object({
  session: sessionSchema,
});

export type GetGameStateInput = z.infer<typeof getGameStateInputSchema>;

export const getGameStateRoute = async ({
  session,
}: GetGameStateInput): Promise<GameState> => {
  return sessions[session].gameState;
};
