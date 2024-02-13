import { z } from "zod";
import { sessions } from "../lib/sessions";
import { openai } from "../lib/openai";
import { ASSISTANT_ID } from "../lib/constants";
import { runAndResolve } from "../helpers/assistantHelpers";

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
  content: string;
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

  // Retrieve the messages and return the assistant's response.
  const allMessages = await openai.beta.threads.messages.list(
    sessions[session].threadId,
  );
  const content = allMessages.data[0].content[0];

  if (content.type === "image_file")
    throw new Error("Why the fuck did the assistant return an image.");

  return {
    content: content.text.value,
    state: sessions[session].gameState,
  };
};
