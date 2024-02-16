import { sessions } from "../lib/sessions";
import { sessions as dbSessions, stats } from "../db/schema";
import { openai } from "../lib/openai";
import {
  getLatestMessage,
  resolveRequiredFunctionsRecursively,
  waitUntilStatusResolved,
} from "../helpers/assistant";
import { ASSISTANT_ID } from "../lib/constants";
import { db } from "../db/db";
import { eq } from "drizzle-orm";

/** Creates a new chat with Assistant's initial message and returns the new session */
export const createChat = async (): Promise<{
  session: string;
  message: string;
}> => {
  //const session = genSessionUuid();

  const thread = await openai.beta.threads.create();
  console.log("New thread created with ID:", thread.id);

  const { sessionId, transactionSuccess } = await createChatInDb(thread.id);

  if (!transactionSuccess) {
    throw new Error("Failed to add new session data to database.");
  }

  // Create the run.
  let run = await openai.beta.threads.runs.create(thread.id, {
    assistant_id: ASSISTANT_ID,
  });

  // Dry-run to get first message that sets up the scene etc.
  run = await waitUntilStatusResolved(thread.id, run.id);
  if (run.status === "requires_action") {
    try {
      await resolveRequiredFunctionsRecursively(
        run.required_action!.submit_tool_outputs.tool_calls,
        sessionId,
        thread.id,
        run.id,
      );
    } catch (e) {
      console.error("Error resolving required functions, cancelling run", e);
      await openai.beta.threads.runs.cancel(thread.id, run.id);
    }
  }
  const latestMessage = await getLatestMessage(thread.id);
  return { session: sessionId, message: latestMessage.text.value };
};

function genSessionUuid() {
  const date = new Date();
  const formattedDate = date.toISOString().replace(/[:.]/g, "-");
  // Generate four random alphanumeric characters
  const randomChars = Math.random().toString(36).substring(2, 6);
  return `${formattedDate}/${randomChars}`;
}

async function createChatInDb(threadId: string) {
  let sessionId = "";
  let transactionSuccess = false;

  await db.transaction(async (tx) => {
    const _newSession = await tx
      .insert(dbSessions)
      .values({
        threadId: threadId,
      })
      .returning();

    const newSession = _newSession[0]!;
    sessionId = `${newSession.id}`;

    const _newStats = await tx
      .insert(stats)
      .values({
        sessionId: newSession.id,
        health: 100,
        speed: 100,
        mana: 50,
        strength: 50,
      })
      .returning();

    const newStats = _newStats[0]!;

    await tx
      .update(dbSessions)
      .set({ statsId: newStats.id })
      .where(eq(dbSessions.id, newSession.id));

    console.log("New session created:", newSession);
    console.log("New stats created:", newStats);

    sessions[newSession.id] = {
      id: newSession.id,
      threadId: threadId,
      gameState: {
        stats: newStats,
        inventoryItems: [],
      },
    };

    transactionSuccess = true;
  });

  return {
    sessionId,
    transactionSuccess,
  };
}
