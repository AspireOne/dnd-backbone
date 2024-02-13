import { sessions } from "../lib/sessions";
import { openai } from "../lib/openai";
import { runAndResolve } from "../helpers/assistantHelpers";

/** Creates a new chat with Assistant's initial message and returns the new session */
export const createChat = async (): Promise<string> => {
  const session = genSessionUuid();
  const thread = await openai.beta.threads.create();
  console.log("New thread created with ID: ", thread.id);

  sessions[session] = {
    threadId: thread.id,
    gameState: { stats: [], inventoryItems: [] },
  };

  // Dry-run to get first message that sets up the scene etc.
  await runAndResolve(thread.id, session);
  return session;
};

function genSessionUuid() {
  const date = new Date();
  const formattedDate = date.toISOString().replace(/[:.]/g, "-");
  // Generate four random alphanumeric characters
  const randomChars = Math.random().toString(36).substring(2, 6);
  return `${formattedDate}/${randomChars}`;
}
