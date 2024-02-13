import { openai } from "../lib/openai";
import { Threads } from "openai/resources/beta";
import RequiredActionFunctionToolCall = Threads.RequiredActionFunctionToolCall;
import { RunSubmitToolOutputsParams } from "openai/src/resources/beta/threads/runs/runs";
import { sessions } from "../lib/sessions";
import { ASSISTANT_ID } from "../lib/constants";

const RESOLVED_CHECKS_LIMIT = 1000;

/** Periodically retrieves the run until it's either completed, or requires action. */
export const retrieveUntilStatusResolved = async (
  threadId: string,
  runId: string,
) => {
  for (let i = 0; i < RESOLVED_CHECKS_LIMIT; i++) {
    const { status } = await openai.beta.threads.runs.retrieve(threadId, runId);

    console.log(`Run status: ${status}`);
    if (status === "completed" || status === "requires_action") break;
  }
};

/** Calls all the actions the assistant requires and returns their outputs. */
export const runRequiredActions = (
  actions: RequiredActionFunctionToolCall[],
  session: string,
): RunSubmitToolOutputsParams.ToolOutput[] => {
  const outputs: RunSubmitToolOutputsParams.ToolOutput[] = [];

  for (const action of actions) {
    const result = (getFunctions(session) as any)[action.function.name](
      ...action.function.arguments,
    );

    outputs.push({
      output: result,
      tool_call_id: action.id,
    });
  }

  return outputs;
};

/** Functions available to OpenAI assistant */
export const getFunctions = (session: string) => {
  return {
    getInventory: () => sessions[session].gameState.inventoryItems,
    getStats: () => sessions[session].gameState.stats,
    modifyStats: (stats: { type: StatTypes; quantity: number }[]) => {
      for (const stat of stats) {
        const foundStat = sessions[session].gameState.stats.find(
          (s) => s.type === stat.type,
        );

        if (foundStat) foundStat.quantity += stat.quantity;
        else sessions[session].gameState.stats.push(stat);
      }
    },
    addItem: (name: string, quantity: number, img: string) => {
      sessions[session].gameState.inventoryItems.push({
        name: name,
        quantity: quantity,
        img: img,
      });
    },
    removeItem: (name: string, quantity: number) => {
      const item = sessions[session].gameState.inventoryItems.find(
        (item) => item.name === name,
      );

      if (item) item.quantity -= quantity;
    },
  };
};

/** Creates a run, waits for it to resolve, fulfills any required action calls, and waits for it to resolve again. */
export const runAndResolve = async (threadId: string, session: string) => {
  // Create the run.
  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: ASSISTANT_ID,
  });

  // Run & wait until it's fully resolved (& take care of required actions).
  while (true) {
    await retrieveUntilStatusResolved(threadId, run.id);
    if (run.status === "failed") throw new Error("Run failed, tf?");
    // biome-ignore format: off.
    if (run.status === "cancelled") throw new Error("Run cancelled, co si to to API dovoluje?");
    // biome-ignore format: off.
    if (run.status === "expired") throw new Error("Run expired, I don't think this should happen.");
    if (run.status === "completed") break;
    if (run.status === "requires_action") {
      const outputs = runRequiredActions(
        run.required_action!.submit_tool_outputs.tool_calls,
        session,
      );

      await openai.beta.threads.runs.submitToolOutputs(threadId, run.id, {
        tool_outputs: outputs,
      });
      // Wait again after submitting outputs.
      await retrieveUntilStatusResolved(threadId, run.id);
    }
  }
  return run;
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
