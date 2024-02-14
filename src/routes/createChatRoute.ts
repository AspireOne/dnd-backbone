import { sessions } from "../lib/sessions";
import { openai } from "../lib/openai";
import { getLatestMessage, waitAndResolve } from "../helpers/assistantHelpers";
import { ASSISTANT_ID } from "../lib/constants";

/** Creates a new chat with Assistant's initial message and returns the new session */
export const createChat = async (): Promise<{
  session: string;
  message: string;
}> => {
  const session = genSessionUuid();
  const thread = await openai.beta.threads.create();
  console.log("New thread created with ID:", thread.id);

  sessions[session] = {
    threadId: thread.id,
    gameState: { stats: [], inventoryItems: [] },
  };

  // Create the run.
  const run = await openai.beta.threads.runs.create(thread.id, {
    assistant_id: ASSISTANT_ID,
  });

  // Dry-run to get first message that sets up the scene etc.
  await waitAndResolve(thread.id, session, run.id);
  const latestMessage = await getLatestMessage(thread.id);
  return { session, message: latestMessage.text.value };
};

function genSessionUuid() {
  const date = new Date();
  const formattedDate = date.toISOString().replace(/[:.]/g, "-");
  // Generate four random alphanumeric characters
  const randomChars = Math.random().toString(36).substring(2, 6);
  return `${formattedDate}/${randomChars}`;
}
