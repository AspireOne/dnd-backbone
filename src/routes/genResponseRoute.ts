import { z } from "zod";
import { sessions } from "../lib/sessions";
import { openai } from "../lib/openai";
import { ASSISTANT_ID } from "../lib/constants";
import { getLatestMessage, runAndResolve } from "../helpers/assistantHelpers";
import {GameState} from "../types/types";

export const genResponseInputSchema = z.object({
  session: z
    .string()
    .min(1)
    .refine((s) => s in sessions, {
      message: "Session does not exist. Did you create a chat first?",
    }),
  message: z.string().min(1),
});

export type GenResponseInput = z.infer<typeof genResponseInputSchema>;
export type GenResponseOutput = {
  message: string;
  state: GameState;
};

export const genResponse = async ({
  session,
  message,
}: GenResponseInput): Promise<GenResponseOutput> => {
  // Create the message.
  const threadMessage = await openai.beta.threads.messages.create(
    sessions[session].threadId,
    {
      role: "user",
      content: message,
    },
  );
  console.log("Created chat message: ", threadMessage);

  // Create the run.
  const run = await openai.beta.threads.runs.create(sessions[session].threadId, {
    assistant_id: ASSISTANT_ID,
  });
  console.log("Created run: ", run);

  // Run & wait until it's fully resolved (& take care of required actions).
  await runAndResolve(sessions[session].threadId, session);
  const latestMessage = await getLatestMessage(sessions[session].threadId);

  return {
    message: latestMessage.text.value,
    state: sessions[session].gameState,
  };
};
