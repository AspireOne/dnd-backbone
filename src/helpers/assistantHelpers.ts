import { openai } from "../lib/openai";
import { Threads } from "openai/resources/beta";
import RequiredActionFunctionToolCall = Threads.RequiredActionFunctionToolCall;
import { RunSubmitToolOutputsParams } from "openai/src/resources/beta/threads/runs/runs";
import { GameState, sessions } from "../lib/sessions";
import { ResolvedRunStatus } from "../types/types";
import { wait, withTimeout } from "../utils";
import { db } from "../db/db";
import { inventoryItems, stats as statsTable } from "../db/schema";
import { and, eq } from "drizzle-orm";

const CHECK_COUNT_LIMIT = 1000;
const STATUS_CHECK_TIMEOUT = 5000;

// biome-ignore format: off.
const resolvedRunStatuses: ResolvedRunStatus[] = [
  "requires_action",
  "cancelled",
  "failed",
  "completed",
  "expired",
]

/** Periodically retrieves the run until it's either completed, or requires action. */
export const waitUntilStatusResolved = async (
  threadId: string,
  runId: string,
  resolvedStatuses: ResolvedRunStatus[] = resolvedRunStatuses,
) => {
  let run: Threads.Runs.Run = await openai.beta.threads.runs.retrieve(
    threadId,
    runId,
  );
  let i = 0;
  for (; i < CHECK_COUNT_LIMIT; i++) {
    console.log(`Run status: ${run.status}`);
    if (resolvedStatuses.some((s) => s === run.status)) break;
    const { output, timedOut } = await withTimeout(
      () => openai.beta.threads.runs.retrieve(threadId, runId),
      STATUS_CHECK_TIMEOUT,
    );

    if (timedOut) console.warn("Status check took too long to resolve.");
    else run = output!;
    await wait(250);
  }

  return run;
};

/** Calls all the functions the assistant requires and returns their outputs. */
export const runRequiredFunctions = (
  actions: RequiredActionFunctionToolCall[],
  session: string,
): RunSubmitToolOutputsParams.ToolOutput[] => {
  const outputs: RunSubmitToolOutputsParams.ToolOutput[] = [];

  for (const action of actions) {
    const args = Object.values(JSON.parse(action.function.arguments));
    const output = (getFunctions(session) as any)[action.function.name](...args);

    outputs.push({
      output: JSON.stringify(output || "{}"),
      tool_call_id: action.id,
    });
    console.log(
      `Ran function ${action.function.name}(${action.function.arguments}) (id: ${action.id}) / output: ${JSON.stringify(output)}`,
    );
  }

  return outputs;
};

/** Recursively fulfills all required actions, even the subsequent ones. */
export const resolveRequiredFunctionsRecursively = async (
  actions: RequiredActionFunctionToolCall[],
  session: string,
  threadId: string,
  runId: string,
): Promise<void> => {
  const outputs = runRequiredFunctions(actions, session);
  await openai.beta.threads.runs.submitToolOutputs(threadId, runId, {
    tool_outputs: outputs,
  });

  const run = await waitUntilStatusResolved(threadId, runId);
  if (run.status === "requires_action")
    return await resolveRequiredFunctionsRecursively(
      run.required_action!.submit_tool_outputs.tool_calls,
      session,
      threadId,
      runId,
    );
};

/** Functions available to OpenAI assistant */
export const getFunctions = (session: string) => {
  return {
    getInventory: () => sessions[session].gameState.inventoryItems,
    getStats: () => sessions[session].gameState.stats,
    modifyStats: (stats: Partial<GameState["stats"]>) => {
      Object.assign(sessions[session].gameState.stats, stats);
      // not awaitng.
      db.update(statsTable)
        .set(stats)
        .where(eq(statsTable.sessionId, sessions[session].id))
        .returning()
        .then((res) => console.log(res));
    },
    addItem: (name: string, quantity: number, img?: string) => {
      sessions[session].gameState.inventoryItems.push({
        name: name,
        quantity: quantity,
        img: img || "default",
      });
      db.insert(inventoryItems)
        .values({
          name,
          quantity,
          icon: img || "default",
          sessionId: sessions[session].id,
        })
        .returning()
        .then((res) => console.log(res));
    },
    removeItem: (name: string, quantity: number) => {
      const item = sessions[session].gameState.inventoryItems.find(
        (item) => item.name === name,
      );

      if (item) {
        item.quantity -= quantity;
        if (item.quantity <= 0) {
          sessions[session].gameState.inventoryItems = sessions[
            session
          ].gameState.inventoryItems.filter((item) => item.name !== name);

          db.delete(inventoryItems).where(
            and(
              eq(inventoryItems.name, name),
              eq(inventoryItems.sessionId, sessions[session].id),
            ),
          );
        } else {
          db.update(inventoryItems)
            .set({
              quantity: item.quantity,
            })
            .where(
              and(
                eq(inventoryItems.name, name),
                eq(inventoryItems.sessionId, sessions[session].id),
              ),
            )
            .returning()
            .then((res) => console.log(res));
        }
      }
    },
  };
};

/** Gets the latest sent message from the thread. Never returns an image (cause not supported rn). */
export const getLatestMessage = async (
  threadId: string,
): Promise<Threads.Messages.MessageContentText> => {
  // Retrieve the messages and return the assistant's response.
  const allMessages = await openai.beta.threads.messages.list(threadId);
  const content = allMessages.data[0].content[0];

  if (content.type === "image_file")
    throw new Error("Why the fuck did the assistant return an image.");

  return content;
};
